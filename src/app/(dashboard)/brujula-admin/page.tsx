import Link from "next/link";
import { prisma } from "@/lib/prisma";

const PROGRAM_LABEL: Record<string, string> = {
  DESQBRO_BEBES: "desQbro Bebés",
  DESQBRO_AQUA: "desQbro AQUA",
  GUAGUAS_SOCCER: "Güipas Soccer",
};

export default async function BrujulaAdminPage() {
  const clients = await prisma.client.findMany({
    include: {
      subscriptions: true,
      parentAccount: true,
    },
    orderBy: { fullName: "asc" },
  });

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>La Brújula</h1>
      <p style={{ color: "#64748b" }}>Vista previa de lo que cada padre de familia ve en su portal.</p>

      <div className="table-scroll" style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginTop: 20 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead>
            <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
              <th style={th}>Niño/a</th>
              <th style={th}>Programas</th>
              <th style={th}>Acceso de padres</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 && (
              <tr>
                <td colSpan={4} style={{ ...td, textAlign: "center", color: "#94a3b8" }}>
                  Aún no hay clientes registrados.
                </td>
              </tr>
            )}
            {clients.map((c) => (
              <tr key={c.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                <td style={td}>{c.fullName}</td>
                <td style={td}>{c.subscriptions.map((s) => PROGRAM_LABEL[s.program]).join(", ") || "—"}</td>
                <td style={td}>
                  {c.parentAccount ? (
                    <span style={{ ...badge, background: "#dcfce7", color: "#166534" }}>{c.parentAccount.phone}</span>
                  ) : (
                    <span style={{ ...badge, background: "#f1f5f9", color: "#64748b" }}>Sin acceso</span>
                  )}
                </td>
                <td style={{ ...td, textAlign: "right" }}>
                  <Link href={`/brujula-admin/${c.id}`} style={{ color: "#5c1a4a", fontWeight: 600, fontSize: "0.85rem" }}>
                    Ver panel →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th: React.CSSProperties = { padding: "0.75rem 1rem", fontWeight: 600, color: "#334155" };
const td: React.CSSProperties = { padding: "0.75rem 1rem", color: "#3d0f30" };
const badge: React.CSSProperties = { padding: "0.2rem 0.6rem", borderRadius: 999, fontSize: "0.75rem", fontWeight: 600 };
