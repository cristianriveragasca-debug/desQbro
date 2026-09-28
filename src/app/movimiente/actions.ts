"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

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
  if (!phone) throw new Error("El contacto es obligatorio");
  if (!emergencyContactName) throw new Error("El contacto de emergencia es obligatorio");
  if (!emergencyContactPhone) throw new Error("El teléfono de emergencia es obligatorio");

  await prisma.movimienteRegistration.create({
    data: {
      guardianName,
      childName,
      birthDate: new Date(birthDateStr),
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
