import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BrujulaChildView } from "@/components/brujula-child-view";

export default async function BrujulaChildPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/brujula/login");

  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { parentAccountId: true } });
  if (!client) notFound();
  if (client.parentAccountId !== userId) redirect("/brujula");

  return (
    <div>
      <Link href="/brujula" style={{ color: "#5c1a4a", fontSize: "0.85rem" }}>
        ← Ver otros hijos
      </Link>
      <BrujulaChildView clientId={clientId} />
    </div>
  );
}
