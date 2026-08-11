import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BrujulaChildView } from "@/components/brujula-child-view";

export default async function BrujulaAdminChildPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true } });
  if (!client) notFound();

  return (
    <div>
      <Link href="/brujula-admin" style={{ color: "#5c1a4a", fontSize: "0.85rem" }}>
        ← Volver a La Brújula
      </Link>
      <div
        style={{
          background: "#fef3c7",
          color: "#92400e",
          padding: "0.6rem 0.9rem",
          borderRadius: 8,
          fontSize: "0.85rem",
          marginTop: 12,
        }}
      >
        Vista previa: así es como este padre de familia ve su panel en La Brújula.
      </div>
      <BrujulaChildView clientId={clientId} />
    </div>
  );
}
