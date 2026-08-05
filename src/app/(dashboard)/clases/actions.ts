"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function parseProgram(value: FormDataEntryValue | null): "DESQBRO_BEBES" | "DESQBRO_AQUA" | "GUAGUAS_SOCCER" {
  if (value === "DESQBRO_AQUA" || value === "GUAGUAS_SOCCER") return value;
  return "DESQBRO_BEBES";
}

function buildData(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const startTime = String(formData.get("startTime") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();
  const dayOfWeek = parseInt(String(formData.get("dayOfWeek") ?? "1"), 10);
  const capacity = parseInt(String(formData.get("capacity") ?? "20"), 10) || 20;

  if (!name || !startTime || !endTime) throw new Error("Nombre y horario son obligatorios");

  return {
    name,
    program: parseProgram(formData.get("program")),
    dayOfWeek: isNaN(dayOfWeek) ? 1 : dayOfWeek,
    startTime,
    endTime,
    capacity,
  };
}

export async function createClassGroup(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const data = buildData(formData);
  await prisma.classGroup.create({ data });

  revalidatePath("/clases");
  redirect("/clases");
}

export async function updateClassGroup(id: string, formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const data = buildData(formData);
  await prisma.classGroup.update({ where: { id }, data });

  revalidatePath("/clases");
  redirect("/clases");
}

export async function deleteClassGroup(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.classGroup.delete({ where: { id } });
  revalidatePath("/clases");
}

export async function enrollClient(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const classGroupId = String(formData.get("classGroupId") ?? "");
  const clientId = String(formData.get("clientId") ?? "");
  if (!classGroupId || !clientId) return;

  await prisma.enrollment.upsert({
    where: { clientId_classGroupId: { clientId, classGroupId } },
    update: {},
    create: { clientId, classGroupId },
  });

  revalidatePath(`/clases/${classGroupId}`);
}

export async function unenrollClient(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const classGroupId = String(formData.get("classGroupId") ?? "");
  const clientId = String(formData.get("clientId") ?? "");
  if (!classGroupId || !clientId) return;

  await prisma.enrollment.delete({
    where: { clientId_classGroupId: { clientId, classGroupId } },
  });

  revalidatePath(`/clases/${classGroupId}`);
}
