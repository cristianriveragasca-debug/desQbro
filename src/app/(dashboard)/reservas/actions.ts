"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function parseStatus(value: FormDataEntryValue | null): "NUEVO" | "CONTACTADO" | "AGENDADO" | "DESCARTADO" | "CONVERTIDO" {
  if (value === "CONTACTADO" || value === "AGENDADO" || value === "DESCARTADO" || value === "CONVERTIDO") return value;
  return "NUEVO";
}

export async function updateLeadStatus(id: string, formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const status = parseStatus(formData.get("status"));
  const notes = String(formData.get("notes") ?? "").trim() || null;

  await prisma.trialRequest.update({ where: { id }, data: { status, notes } });
  revalidatePath("/reservas");
}

export async function deleteLead(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.trialRequest.delete({ where: { id } });
  revalidatePath("/reservas");
}
