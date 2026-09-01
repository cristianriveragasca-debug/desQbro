"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

function parseProgram(value: FormDataEntryValue | null): "DESQBRO_BEBES" | "DESQBRO_AQUA" | "GUAGUAS_SOCCER" {
  if (value === "DESQBRO_AQUA" || value === "GUAGUAS_SOCCER") return value;
  return "DESQBRO_BEBES";
}

export async function createTrialRequest(formData: FormData) {
  const program = parseProgram(formData.get("program"));
  const guardianName = String(formData.get("guardianName") ?? "").trim();
  const babyName = String(formData.get("babyName") ?? "").trim();
  const birthDateStr = String(formData.get("birthDate") ?? "");
  const address = String(formData.get("address") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!formData.get("program")) throw new Error("Elige el programa");
  if (!guardianName) throw new Error("El nombre del acudiente es obligatorio");
  if (!babyName) throw new Error("El nombre del niño/a es obligatorio");
  if (!birthDateStr) throw new Error("La fecha de nacimiento es obligatoria");
  if (!address) throw new Error("La dirección es obligatoria");
  if (!phone) throw new Error("El contacto es obligatorio");

  await prisma.trialRequest.create({
    data: {
      program,
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
