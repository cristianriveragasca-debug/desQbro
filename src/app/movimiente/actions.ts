"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { computeAge } from "@/lib/dates";
import { MAX_CHILD_AGE, MIN_CHILD_AGE } from "./age-limits";

export async function createMovimienteRegistration(formData: FormData) {
  const guardianName = String(formData.get("guardianName") ?? "").trim();
  const childName = String(formData.get("childName") ?? "").trim();
  const birthDateStr = String(formData.get("birthDate") ?? "");
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const emergencyContactName = String(formData.get("emergencyContactName") ?? "").trim();
  const emergencyContactPhone = String(formData.get("emergencyContactPhone") ?? "").trim();
  const eps = String(formData.get("eps") ?? "").trim();
  const medicalNotes = String(formData.get("medicalNotes") ?? "").trim();
  const imageConsent = formData.get("imageConsent") === "on";

  if (!guardianName) throw new Error("El nombre del acudiente es obligatorio");
  if (!childName) throw new Error("El nombre del niño/a es obligatorio");
  if (!birthDateStr) throw new Error("La fecha de nacimiento es obligatoria");
  const birthDate = new Date(birthDateStr);
  const age = computeAge(birthDate).years;
  if (Number.isNaN(age) || age < MIN_CHILD_AGE || age > MAX_CHILD_AGE) {
    throw new Error(`Solo pueden inscribirse niños y niñas de ${MIN_CHILD_AGE} a ${MAX_CHILD_AGE} años`);
  }
  if (!phone) throw new Error("El contacto es obligatorio");
  if (!emergencyContactName) throw new Error("El contacto de emergencia es obligatorio");
  if (!emergencyContactPhone) throw new Error("El teléfono de emergencia es obligatorio");

  await prisma.movimienteRegistration.create({
    data: {
      guardianName,
      childName,
      birthDate,
      phone,
      email: email || null,
      emergencyContactName,
      emergencyContactPhone,
      eps: eps || null,
      medicalNotes: medicalNotes || null,
      imageConsent,
    },
  });

  redirect("/movimiente/gracias");
}
