import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeAge, formatAge } from "@/lib/dates";

export default async function BrujulaHomePage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/brujula/login");

  const account = await prisma.parentAccount.findUnique({
    where: { id: userId },
    include: { clients: { include: { subscriptions: true } } },
  });
  if (!account) redirect("/brujula/login");

  if (account.clients.length === 1) {
    redirect(`/brujula/${account.clients[0].id}`);
  }

  return (
    <div>
      <h1 style={{ marginTop: 0, color: "#3d0f30" }}>Hola, {account.name ?? "familia"} 👋</h1>
      <p style={{ color: "#64748b" }}>Elige el niño o niña para ver su información.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 24 }}>
        {account.clients.map((c) => (
          <Link
            key={c.id}
            href={`/brujula/${c.id}`}
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "1.25rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              textDecoration: "none",
              display: "block",
            }}
          >
            <div style={{ fontWeight: 700, color: "#3d0f30", fontSize: "1.1rem" }}>{c.fullName}</div>
            <div style={{ color: "#64748b", fontSize: "0.85rem", marginTop: 4 }}>{formatAge(computeAge(c.birthDate))}</div>
            <div style={{ color: "#5c1a4a", fontSize: "0.85rem", marginTop: 8, fontWeight: 600 }}>
              {c.subscriptions.length} programa(s) →
            </div>
          </Link>
        ))}
        {account.clients.length === 0 && <p style={{ color: "#94a3b8" }}>Aún no hay niños vinculados a esta cuenta.</p>}
      </div>
    </div>
  );
}
