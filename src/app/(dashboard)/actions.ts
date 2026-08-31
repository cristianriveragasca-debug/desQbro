"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const PROGRAMS = ["DESQBRO_BEBES", "DESQBRO_AQUA", "GUAGUAS_SOCCER"] as const;

export async function saveMonthlyIncomeOverrides(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const year = Number(formData.get("year"));
  if (!year) throw new Error("Año inválido");

  const upserts = [];
  for (const program of PROGRAMS) {
    for (let month = 1; month <= 12; month++) {
      const raw = formData.get(`amount_${program}_${month}`);
      if (raw === null) continue;
      const amount = Number(raw);
      if (Number.isNaN(amount) || amount < 0) continue;

      upserts.push(
        prisma.monthlyIncomeOverride.upsert({
          where: { year_month_program: { year, month, program } },
          create: { year, month, program, amount },
          update: { amount },
        })
      );
    }
  }

  await prisma.$transaction(upserts);
  revalidatePath("/");
}
