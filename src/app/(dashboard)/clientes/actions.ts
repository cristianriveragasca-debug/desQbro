"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { computeDueDate } from "@/lib/dates";
import { generateInstallments, getPlanPrice, ONE_TIME_FEES, PROGRAM_ONLY_MONTHLY } from "@/lib/pricing";

function parseProgram(value: FormDataEntryValue | null): "DESQBRO_BEBES" | "DESQBRO_AQUA" | "GUAGUAS_SOCCER" {
  if (value === "DESQBRO_AQUA" || value === "GUAGUAS_SOCCER") return value;
  return "DESQBRO_BEBES";
}

function parsePlanType(value: FormDataEntryValue | null): "MENSUAL" | "TRIMESTRAL" | "SEMESTRAL" {
  if (value === "TRIMESTRAL" || value === "SEMESTRAL") return value;
  return "MENSUAL";
}

function parsePaymentMode(value: FormDataEntryValue | null): "TOTAL" | "CUOTAS" {
  return value === "CUOTAS" ? "CUOTAS" : "TOTAL";
}

function parseStatus(value: FormDataEntryValue | null): "ACTIVO" | "INACTIVO" {
  return value === "INACTIVO" ? "INACTIVO" : "ACTIVO";
}

function buildClientData(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const guardianName = String(formData.get("guardianName") ?? "").trim();
  const birthDateStr = String(formData.get("birthDate") ?? "");

  if (!fullName || !phone || !guardianName) throw new Error("Nombre, acudiente y teléfono son obligatorios");
  if (!birthDateStr) throw new Error("La fecha de nacimiento es obligatoria");

  return {
    fullName,
    phone,
    guardianName,
    email: String(formData.get("email") ?? "").trim() || null,
    birthDate: new Date(birthDateStr),
    notes: String(formData.get("notes") ?? "").trim() || null,
  };
}

function buildSubscriptionData(formData: FormData) {
  const paymentDateStr = String(formData.get("paymentDate") ?? "");
  if (!paymentDateStr) throw new Error("La fecha de pago es obligatoria");
  const paymentDate = new Date(paymentDateStr);

  const program = parseProgram(formData.get("program"));
  let planType = parsePlanType(formData.get("planType"));
  if (PROGRAM_ONLY_MONTHLY[program]) planType = "MENSUAL";
  const paymentMode = parsePaymentMode(formData.get("paymentMode"));

  let installments = parseInt(String(formData.get("installments") ?? "1"), 10) || 1;
  if (paymentMode === "TOTAL" || planType === "MENSUAL") {
    installments = 1;
  } else if (planType === "TRIMESTRAL") {
    installments = Math.min(Math.max(installments, 1), 2);
  } else if (planType === "SEMESTRAL") {
    installments = Math.min(Math.max(installments, 1), 3);
  }

  const dueDate = computeDueDate(paymentDate, planType);
  const fees = ONE_TIME_FEES.filter((f) => formData.get(`fee_${f.key}`) === "on");

  const customAmountStr = String(formData.get("customAmount") ?? "").trim();
  const customAmount = customAmountStr ? Number(customAmountStr) : null;

  let cuotaAmounts: number[] | null = null;
  if (paymentMode === "CUOTAS" && installments > 0) {
    const amounts = Array.from({ length: installments }, (_, i) => {
      const raw = String(formData.get(`cuotaAmount_${i + 1}`) ?? "").trim();
      return raw ? Number(raw) : NaN;
    });
    if (amounts.every((a) => !isNaN(a) && a >= 0)) cuotaAmounts = amounts;
  }

  const cuotaTotal = cuotaAmounts ? cuotaAmounts.reduce((sum, a) => sum + a, 0) : null;
  const rawTotal = cuotaTotal ?? (customAmount && customAmount > 0 ? customAmount : null);
  const resolvedCustomAmount = rawTotal !== null && rawTotal !== getPlanPrice(program, planType) ? rawTotal : null;

  return {
    program,
    planType,
    paymentMode,
    installments,
    customAmount: resolvedCustomAmount,
    paymentDate,
    dueDate,
    status: parseStatus(formData.get("status")),
    fees,
    cuotaAmounts,
  };
}

async function createSubscriptionWithPayments(clientId: string, formData: FormData) {
  const { fees, cuotaAmounts, ...subscriptionData } = buildSubscriptionData(formData);

  const subscription = await prisma.programSubscription.create({
    data: { ...subscriptionData, clientId },
  });

  const installments = generateInstallments(
    subscriptionData.program,
    subscriptionData.planType,
    subscriptionData.installments,
    subscriptionData.paymentDate,
    subscriptionData.customAmount,
    cuotaAmounts
  );

  await prisma.payment.createMany({
    data: [
      ...installments.map((inst) => ({
        subscriptionId: subscription.id,
        amount: inst.amount,
        concept: inst.concept,
        status: inst.status,
        dueDate: inst.dueDate,
        paidAt: inst.paidAt,
      })),
      ...fees.map((f) => ({
        subscriptionId: subscription.id,
        amount: f.amount,
        concept: f.label,
        status: "PAGADO" as const,
        dueDate: subscriptionData.paymentDate,
        paidAt: subscriptionData.paymentDate,
      })),
    ],
  });

  return subscription;
}

export async function createClient(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const clientData = buildClientData(formData);
  const client = await prisma.client.create({ data: clientData });
  await createSubscriptionWithPayments(client.id, formData);

  revalidatePath("/clientes");
  revalidatePath("/financiero");
  redirect("/clientes");
}

export async function updateClient(id: string, formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const clientData = buildClientData(formData);
  await prisma.client.update({ where: { id }, data: clientData });

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  redirect("/clientes");
}

export async function deleteClient(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.client.delete({ where: { id } });
  revalidatePath("/clientes");
  revalidatePath("/financiero");
}

export async function addProgramSubscription(clientId: string, formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const program = parseProgram(formData.get("program"));
  const existing = await prisma.programSubscription.findUnique({
    where: { clientId_program: { clientId, program } },
  });
  if (existing) throw new Error("Este cliente ya está inscrito en ese programa.");

  await createSubscriptionWithPayments(clientId, formData);

  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/clientes");
  revalidatePath("/financiero");
  redirect(`/clientes/${clientId}`);
}

export async function updateProgramSubscription(id: string, clientId: string, formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const { fees, cuotaAmounts, ...subscriptionData } = buildSubscriptionData(formData);

  const conflict = await prisma.programSubscription.findUnique({
    where: { clientId_program: { clientId, program: subscriptionData.program } },
  });
  if (conflict && conflict.id !== id) {
    throw new Error("Este cliente ya está inscrito en ese programa.");
  }

  await prisma.programSubscription.update({
    where: { id },
    data: subscriptionData,
  });

  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/clientes");
  revalidatePath("/financiero");
  redirect(`/clientes/${clientId}`);
}

export async function deleteProgramSubscription(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const id = String(formData.get("id") ?? "");
  const clientId = String(formData.get("clientId") ?? "");
  if (!id) return;

  await prisma.programSubscription.delete({ where: { id } });
  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/clientes");
  revalidatePath("/financiero");
}

export async function addSubscriptionPayment(subscriptionId: string, clientId: string, formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const concept = String(formData.get("concept") ?? "").trim();
  const dateStr = String(formData.get("date") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const status = formData.get("status") === "PENDIENTE" ? "PENDIENTE" : "PAGADO";

  if (!concept) throw new Error("El concepto es obligatorio");
  if (!dateStr) throw new Error("La fecha es obligatoria");
  if (!amount || amount <= 0) throw new Error("El valor debe ser mayor a cero");

  const date = new Date(dateStr);

  await prisma.payment.create({
    data: {
      subscriptionId,
      concept,
      amount,
      status,
      dueDate: date,
      paidAt: status === "PAGADO" ? date : null,
    },
  });

  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/financiero");
}

export async function renewMonthlyPayment(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const subscription = await prisma.programSubscription.findUnique({ where: { id } });
  if (!subscription || subscription.planType !== "MENSUAL") return;

  const now = new Date();
  const amount = generateInstallments(
    subscription.program,
    "MENSUAL",
    1,
    now,
    subscription.customAmount ? Number(subscription.customAmount) : null
  )[0].amount;
  const newDueDate = computeDueDate(now, "MENSUAL");

  await prisma.$transaction([
    prisma.payment.create({
      data: {
        subscriptionId: id,
        amount,
        concept: "Plan Mensual - Renovación",
        status: "PAGADO",
        dueDate: newDueDate,
        paidAt: now,
      },
    }),
    prisma.programSubscription.update({
      where: { id },
      data: { paymentDate: now, dueDate: newDueDate, status: "ACTIVO" },
    }),
  ]);

  revalidatePath("/clientes");
  revalidatePath("/financiero");
}
