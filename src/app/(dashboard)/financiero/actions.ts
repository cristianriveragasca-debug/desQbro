"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function markAsPaid(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.payment.update({
    where: { id },
    data: { status: "PAGADO", paidAt: new Date() },
  });

  revalidatePath("/financiero");
  revalidatePath("/clientes");
}
