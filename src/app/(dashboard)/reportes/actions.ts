"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function saveMonthlyGoal(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));
  const aspirational = Number(formData.get("aspirational"));
  const realistic = Number(formData.get("realistic"));

  if (!year || !month) throw new Error("Mes inválido");
  if (Number.isNaN(aspirational) || aspirational < 0) throw new Error("Meta aspiracional inválida");
  if (Number.isNaN(realistic) || realistic < 0) throw new Error("Meta realista inválida");

  await prisma.monthlyGoal.upsert({
    where: { year_month: { year, month } },
    create: { year, month, aspirational, realistic },
    update: { aspirational, realistic },
  });

  revalidatePath("/reportes");
}
