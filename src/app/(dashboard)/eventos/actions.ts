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

  await prisma.specialEvent.create({
    data: {
      title,
      date: new Date(dateStr),
      description: String(formData.get("description") ?? "").trim() || null,
      program: parseProgram(formData.get("program")),
    },
  });

  revalidatePath("/eventos");
  revalidatePath("/brujula");
  redirect("/eventos");
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
