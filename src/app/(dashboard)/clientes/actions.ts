"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function parseSport(value: FormDataEntryValue | null): "FUTBOL" | "NATACION" {
  return value === "NATACION" ? "NATACION" : "FUTBOL";
}

function parseStatus(value: FormDataEntryValue | null): "ACTIVO" | "INACTIVO" | "SUSPENDIDO" {
  if (value === "INACTIVO" || value === "SUSPENDIDO") return value;
  return "ACTIVO";
}

export async function createClient(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!fullName || !phone) throw new Error("Nombre y teléfono son obligatorios");

  await prisma.client.create({
    data: {
      fullName,
      phone,
      email: String(formData.get("email") ?? "").trim() || null,
      sport: parseSport(formData.get("sport")),
      guardianName: String(formData.get("guardianName") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
      status: parseStatus(formData.get("status")),
    },
  });

  revalidatePath("/clientes");
  redirect("/clientes");
}

export async function updateClient(id: string, formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!fullName || !phone) throw new Error("Nombre y teléfono son obligatorios");

  await prisma.client.update({
    where: { id },
    data: {
      fullName,
      phone,
      email: String(formData.get("email") ?? "").trim() || null,
      sport: parseSport(formData.get("sport")),
      guardianName: String(formData.get("guardianName") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
      status: parseStatus(formData.get("status")),
    },
  });

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
