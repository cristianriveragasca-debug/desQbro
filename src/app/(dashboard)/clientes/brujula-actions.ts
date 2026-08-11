"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { SWIM_CRITERIA, countChecked, nextSwimLevel, type SwimLevelValue } from "@/lib/swim-progress";

function parseProgressLevel(value: FormDataEntryValue | null): "INICIACION" | "BASICO" | "INTERMEDIO" | "AVANZADO" | "EXPERTO" {
  if (value === "BASICO" || value === "INTERMEDIO" || value === "AVANZADO" || value === "EXPERTO") return value;
  return "INICIACION";
}

export async function setParentAccess(clientId: string, formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const phone = String(formData.get("parentPhone") ?? "").trim();
  const password = String(formData.get("parentPassword") ?? "").trim();
  if (!phone) throw new Error("El teléfono del padre es obligatorio");
  if (!password || password.length < 4) throw new Error("La contraseña debe tener al menos 4 caracteres");

  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await prisma.parentAccount.findUnique({ where: { phone } });
  const account = existing
    ? await prisma.parentAccount.update({ where: { phone }, data: { passwordHash } })
    : await prisma.parentAccount.create({ data: { phone, passwordHash } });

  await prisma.client.update({ where: { id: clientId }, data: { parentAccountId: account.id } });

  revalidatePath(`/clientes/${clientId}`);
}

export async function removeParentAccess(clientId: string, formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  await prisma.client.update({ where: { id: clientId }, data: { parentAccountId: null } });
  revalidatePath(`/clientes/${clientId}`);
}

export async function updateProgressLevel(subscriptionId: string, clientId: string, formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const progressLevel = parseProgressLevel(formData.get("progressLevel"));
  await prisma.programSubscription.update({ where: { id: subscriptionId }, data: { progressLevel } });

  revalidatePath(`/clientes/${clientId}`);
}

export async function toggleSwimCriterion(subscriptionId: string, clientId: string, formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const criterionKey = String(formData.get("criterionKey") ?? "");
  if (!criterionKey) return;

  const subscription = await prisma.programSubscription.findUnique({ where: { id: subscriptionId } });
  if (!subscription) return;

  const level = subscription.swimLevel as SwimLevelValue;
  const criteria = SWIM_CRITERIA[level];
  if (!criteria.some((c) => c.key === criterionKey)) return;

  const currentChecklist = (subscription.swimChecklist as Record<string, boolean> | null) ?? {};
  const wasChecked = currentChecklist[criterionKey] === true;
  const updatedChecklist = { ...currentChecklist, [criterionKey]: !wasChecked };

  const approvedCount = countChecked(updatedChecklist, criteria);
  const promoted = approvedCount >= 4;
  const target = promoted ? nextSwimLevel(level) : null;

  await prisma.programSubscription.update({
    where: { id: subscriptionId },
    data: target
      ? { swimLevel: target, swimChecklist: {} }
      : { swimChecklist: updatedChecklist },
  });

  revalidatePath(`/clientes/${clientId}`);
  revalidatePath(`/brujula-admin/${clientId}`);
  revalidatePath(`/brujula/${clientId}`);
}

export async function addCoachNote(subscriptionId: string, clientId: string, formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const note = String(formData.get("note") ?? "").trim();
  const dateStr = String(formData.get("date") ?? "");
  if (!note) throw new Error("La nota no puede estar vacía");
  if (!dateStr) throw new Error("La fecha es obligatoria");

  await prisma.coachNote.create({
    data: { subscriptionId, note, date: new Date(dateStr) },
  });

  revalidatePath(`/clientes/${clientId}`);
}

export async function deleteCoachNote(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const id = String(formData.get("id") ?? "");
  const clientId = String(formData.get("clientId") ?? "");
  if (!id) return;

  await prisma.coachNote.delete({ where: { id } });
  revalidatePath(`/clientes/${clientId}`);
}
