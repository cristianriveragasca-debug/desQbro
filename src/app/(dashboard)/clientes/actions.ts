"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { computeDueDate } from "@/lib/dates";
import { generateInstallments, ONE_TIME_FEES, PROGRAM_ONLY_MONTHLY } from "@/lib/pricing";

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

function parseStatus(value: FormDataEntryValue | null): "ACTIVO" | "INACTIVO" | "VENCIDO" {
  if (value === "INACTIVO" || value === "VENCIDO") return value;
  return "ACTIVO";
}

function buildData(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const guardianName = String(formData.get("guardianName") ?? "").trim();
  const birthDateStr = String(formData.get("birthDate") ?? "");
  const paymentDateStr = String(formData.get("paymentDate") ?? "");

  if (!fullName || !phone || !guardianName) throw new Error("Nombre, acudiente y teléfono son obligatorios");
  if (!birthDateStr) throw new Error("La fecha de nacimiento es obligatoria");
  if (!paymentDateStr) throw new Error("La fecha de pago es obligatoria");

  const birthDate = new Date(birthDateStr);
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

  return {
    fullName,
    phone,
    guardianName,
    email: String(formData.get("email") ?? "").trim() || null,
    birthDate,
    program,
    planType,
    paymentMode,
    installments,
    paymentDate,
    dueDate,
    status: parseStatus(formData.get("status")),
    notes: String(formData.get("notes") ?? "").trim() || null,
    fees,
  };
}

export async function createClient(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const { fees, ...clientData } = buildData(formData);

  const client = await prisma.client.create({ data: clientData });

  const installments = generateInstallments(clientData.program, clientData.planType, clientData.installments, clientData.paymentDate);
  await prisma.payment.createMany({
    data: [
      ...installments.map((inst) => ({
        clientId: client.id,
        amount: inst.amount,
        concept: inst.concept,
        status: inst.status,
        dueDate: inst.dueDate,
        paidAt: inst.paidAt,
      })),
      ...fees.map((f) => ({
        clientId: client.id,
        amount: f.amount,
        concept: f.label,
        status: "PAGADO" as const,
        dueDate: clientData.paymentDate,
        paidAt: clientData.paymentDate,
      })),
    ],
  });

  revalidatePath("/clientes");
  revalidatePath("/financiero");
  redirect("/clientes");
}

export async function updateClient(id: string, formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const { fees, ...clientData } = buildData(formData);
  await prisma.client.update({ where: { id }, data: clientData });

  const existingPayments = await prisma.payment.count({ where: { clientId: id } });
  if (existingPayments === 0) {
    const installments = generateInstallments(clientData.program, clientData.planType, clientData.installments, clientData.paymentDate);
    await prisma.payment.createMany({
      data: [
        ...installments.map((inst) => ({
          clientId: id,
          amount: inst.amount,
          concept: inst.concept,
          status: inst.status,
          dueDate: inst.dueDate,
          paidAt: inst.paidAt,
        })),
        ...fees.map((f) => ({
          clientId: id,
          amount: f.amount,
          concept: f.label,
          status: "PAGADO" as const,
          dueDate: clientData.paymentDate,
          paidAt: clientData.paymentDate,
        })),
      ],
    });
  }

  revalidatePath("/clientes");
  revalidatePath("/financiero");
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

export async function renewMonthlyPayment(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client || client.planType !== "MENSUAL") return;

  const now = new Date();
  const amount = generateInstallments(client.program, "MENSUAL", 1, now)[0].amount;
  const newDueDate = computeDueDate(now, "MENSUAL");

  await prisma.$transaction([
    prisma.payment.create({
      data: {
        clientId: id,
        amount,
        concept: "Plan Mensual - Renovación",
        status: "PAGADO",
        dueDate: newDueDate,
        paidAt: now,
      },
    }),
    prisma.client.update({
      where: { id },
      data: { paymentDate: now, dueDate: newDueDate, status: "ACTIVO" },
    }),
  ]);

  revalidatePath("/clientes");
  revalidatePath("/financiero");
}
