"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { computeDueDate } from "@/lib/dates";

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

function parseStatus(value: FormDataEntryValue | null): "ACTIVO" | "INACTIVO" | "SUSPENDIDO" {
  if (value === "INACTIVO" || value === "SUSPENDIDO") return value;
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
  const planType = parsePlanType(formData.get("planType"));
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

  return {
    fullName,
    phone,
    guardianName,
    email: String(formData.get("email") ?? "").trim() || null,
    birthDate,
    program: parseProgram(formData.get("program")),
    planType,
    paymentMode,
    installments,
    paymentDate,
    dueDate,
    status: parseStatus(formData.get("status")),
    notes: String(formData.get("notes") ?? "").trim() || null,
  };
}

export async function createClient(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const data = buildData(formData);
  await prisma.client.create({ data });

  revalidatePath("/clientes");
  redirect("/clientes");
}

export async function updateClient(id: string, formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const data = buildData(formData);
  await prisma.client.update({ where: { id }, data });

  revalidatePath("/clientes");
  redirect("/clientes");
}

export async function deleteClient(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.client.delete({ where: { id } });
  revalidatePath("/clientes");
}
