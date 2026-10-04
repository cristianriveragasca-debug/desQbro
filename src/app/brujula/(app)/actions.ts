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
    data: { passwordHash },
  });

  revalidatePath("/brujula/cuenta");
}

const MAX_PHOTO_CHARS = 400_000;

export async function uploadClientPhoto(clientId: string, dataUrl: string): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return { ok: false, error: "Sesión expirada" };

  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { parentAccountId: true } });
  if (!client || client.parentAccountId !== userId) return { ok: false, error: "No autorizado" };

  const prefix = "data:image/jpeg;base64,";
  if (!dataUrl.startsWith(prefix) || dataUrl.length > MAX_PHOTO_CHARS || !/^[A-Za-z0-9+/=]+$/.test(dataUrl.slice(prefix.length))) {
    return { ok: false, error: "La imagen no es válida o es muy pesada" };
  }

  await prisma.clientPhoto.upsert({
    where: { clientId },
    create: { clientId, data: dataUrl },
    update: { data: dataUrl },
  });

  revalidatePath(`/brujula/${clientId}`);
  revalidatePath("/brujula");
  revalidatePath(`/brujula-admin/${clientId}`);
  revalidatePath(`/clientes/${clientId}`);
  return { ok: true };
}
