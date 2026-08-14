"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function parseProgram(value: FormDataEntryValue | null): "DESQBRO_BEBES" | "DESQBRO_AQUA" | "GUAGUAS_SOCCER" | null {
  if (value === "DESQBRO_BEBES" || value === "DESQBRO_AQUA" || value === "GUAGUAS_SOCCER") return value;
  return null;
}

export async function createEvent(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const title = String(formData.get("title") ?? "").trim();
  const dateStr = String(formData.get("date") ?? "");
  if (!title) throw new Error("El título es obligatorio");
  if (!dateStr) throw new Error("La fecha es obligatoria");

  const isMatch = formData.get("isMatch") === "on";
  const callUpIds = isMatch ? formData.getAll("callUpClientId").map(String) : [];

  await prisma.specialEvent.create({
    data: {
      title,
      date: new Date(dateStr),
      description: String(formData.get("description") ?? "").trim() || null,
      program: isMatch ? "GUAGUAS_SOCCER" : parseProgram(formData.get("program")),
      isMatch,
      callUps: callUpIds.length > 0 ? { create: callUpIds.map((clientId) => ({ clientId })) } : undefined,
    },
  });

  revalidatePath("/eventos");
  revalidatePath("/brujula");
  redirect("/eventos");
}

export async function updateEventCallUps(eventId: string, formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const callUpIds = formData.getAll("callUpClientId").map(String);

  await prisma.$transaction([
    prisma.eventCallUp.deleteMany({ where: { eventId } }),
    prisma.eventCallUp.createMany({ data: callUpIds.map((clientId) => ({ eventId, clientId })) }),
  ]);

  revalidatePath("/eventos");
  revalidatePath("/brujula");
}

export async function deleteEvent(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.specialEvent.delete({ where: { id } });
  revalidatePath("/eventos");
  revalidatePath("/brujula");
}
