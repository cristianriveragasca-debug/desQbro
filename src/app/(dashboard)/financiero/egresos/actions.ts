"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { EXPENSE_CATEGORY_LABEL, EXPENSE_METHOD_LABEL } from "@/lib/expenses";

function parseCategory(value: FormDataEntryValue | null): string {
  const str = typeof value === "string" ? value : "";
  return str in EXPENSE_CATEGORY_LABEL ? str : "OTROS";
}

function parseMethod(value: FormDataEntryValue | null): string {
  const str = typeof value === "string" ? value : "";
  return str in EXPENSE_METHOD_LABEL ? str : "TRANSFERENCIA";
}

export async function createExpense(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const concept = String(formData.get("concept") ?? "").trim();
  const dateStr = String(formData.get("date") ?? "");
  const amount = Number(formData.get("amount") ?? 0);

  if (!concept) throw new Error("El concepto es obligatorio");
  if (!dateStr) throw new Error("La fecha es obligatoria");
  if (!amount || amount <= 0) throw new Error("El valor debe ser mayor a cero");

  await prisma.expense.create({
    data: {
      concept,
      date: new Date(dateStr),
      amount,
      category: parseCategory(formData.get("category")) as never,
      method: parseMethod(formData.get("method")) as never,
      provider: String(formData.get("provider") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
    },
  });

  revalidatePath("/financiero/egresos");
  revalidatePath("/financiero");
  redirect("/financiero/egresos");
}

export async function deleteExpense(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.expense.delete({ where: { id } });
  revalidatePath("/financiero/egresos");
  revalidatePath("/financiero");
}
