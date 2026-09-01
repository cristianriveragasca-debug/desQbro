"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function createTrialRequest(formData: FormData) {
  const guardianName = String(formData.get("guardianName") ?? "").trim();
  const babyName = String(formData.get("babyName") ?? "").trim();
  const birthDateStr = String(formData.get("birthDate") ?? "");
  const address = String(formData.get("address") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!guardianName) throw new Error("El nombre del acudiente es obligatorio");
  if (!babyName) throw new Error("El nombre del bebé es obligatorio");
  if (!birthDateStr) throw new Error("La fecha de nacimiento es obligatoria");
  if (!address) throw new Error("La dirección es obligatoria");
  if (!phone) throw new Error("El contacto es obligatorio");

  await prisma.trialRequest.create({
    data: {
      guardianName,
      babyName,
      birthDate: new Date(birthDateStr),
      address,
      phone,
      email: email || null,
    },
  });

  redirect("/reserva/gracias");
}
