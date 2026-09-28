"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function parseStatus(value: FormDataEntryValue | null): "PENDIENTE_PAGO" | "PAGADO" | "CANCELADO" {
  if (value === "PAGADO" || value === "CANCELADO") return value;
  return "PENDIENTE_PAGO";
}

export async function updateMovimienteStatus(id: string, formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const status = parseStatus(formData.get("status"));
  const notes = String(formData.get("notes") ?? "").trim() || null;

  await prisma.movimienteRegistration.update({ where: { id }, data: { status, notes } });
  revalidatePath("/movimiente-admin");
}

export async function deleteMovimienteRegistration(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.movimienteRegistration.delete({ where: { id } });
  revalidatePath("/movimiente-admin");
}
