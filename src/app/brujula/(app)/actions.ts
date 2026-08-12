"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

export async function changeParentPassword(formData: FormData) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/brujula/login");

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!newPassword || newPassword.length < 4) throw new Error("La nueva contraseña debe tener al menos 4 caracteres");
  if (newPassword !== confirmPassword) throw new Error("Las contraseñas no coinciden");

  const account = await prisma.parentAccount.findUnique({ where: { id: userId } });
  if (!account) redirect("/brujula/login");

  const currentValid = await bcrypt.compare(currentPassword, account.passwordHash);
  if (!currentValid) throw new Error("La contraseña actual no es correcta");

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.parentAccount.update({
    where: { id: userId },
    data: { passwordHash, passwordPlain: newPassword },
  });

  revalidatePath("/brujula/cuenta");
}
