import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteClient, renewMonthlyPayment } from "./actions";
import { computeAge, formatAge } from "@/lib/dates";
import { getEffectiveStatus } from "@/lib/status";

const PROGRAM_LABEL: Record<string, string> = {
  DESQBRO_BEBES: "desQbro Bebés",
  DESQBRO_AQUA: "desQbro AQUA",
  GUAGUAS_SOCCER: "Güipas Soccer",
};
const PLAN_LABEL: Record<string, string> = {
  MENSUAL: "Mensual",
  TRIMESTRAL: "Trimestral",
  SEMESTRAL: "Semestral",
};
const STATUS_LABEL: Record<string, string> = {
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
  VENCIDO: "Vencido",
};
const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  ACTIVO: { bg: "#dcfce7", fg: "#166534" },
  VENCIDO: { bg: "#fee2e2", fg: "#dc2626" },
  INACTIVO: { bg: "#f1f5f9", fg: "#64748b" },
};

export default async function ClientesPage() {
  const clients = await prisma.client.findMany({ orderBy: { createdAt: "desc" } });
  const today = new Date();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Clientes</h1>
        <Link
          href="/clientes/nuevo"
          style={{
            background: "#ffc814",
            color: "#3d0f30",
            padding: "0.6rem 1rem",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: "0.9rem",
            fontWeight: 700,
          }}
        >
          + Nuevo cliente
        </Link>
      </div>

      <div className="table-scroll" style={{ marginTop: 24, background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
              <th style={th}>Nombre</th>
              <th style={th}>Edad</th>
              <th style={th}>Acudiente</th>
              <th style={th}>Teléfono</th>
              <th style={th}>Programa</th>
              <th style={th}>Plan</th>
              <th style={th}>Vence</th>
              <th style={th}>Estado</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 && (
              <tr>
                <td colSpan={9} style={{ ...td, textAlign: "center", color: "#94a3b8" }}>
                  Aún no hay clientes registrados.
                </td>
              </tr>
            )}
            {clients.map((c) => {
              const overdue = c.dueDate < today;
              const effectiveStatus = getEffectiveStatus(c.status, c.dueDate, today);
              const statusColor = STATUS_COLOR[effectiveStatus];
              return (
                <tr key={c.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                  <td style={td}>{c.fullName}</td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>{formatAge(computeAge(c.birthDate))}</td>
                  <td style={td}>{c.guardianName}</td>
                  <td style={td}>{c.phone}</td>
                  <td style={td}>{PROGRAM_LABEL[c.program]}</td>
                  <td style={td}>
                    {PLAN_LABEL[c.planType]}
                    {c.customAmount && (
                      <span
                        title="Este cliente paga un valor personalizado"
                        style={{
                          marginLeft: 6,
                          background: "#ede9fe",
                          color: "#6d28d9",
                          padding: "0.1rem 0.4rem",
                          borderRadius: 999,
                          fontSize: "0.65rem",
                          fontWeight: 700,
                        }}
                      >
                        Personalizado
                      </span>
                    )}
                  </td>
                  <td style={{ ...td, color: overdue ? "#dc2626" : "#3d0f30", fontWeight: overdue ? 700 : 400, whiteSpace: "nowrap" }}>
                    {c.dueDate.toLocaleDateString("es-CO")}
                  </td>
                  <td style={td}>
                    <span
                      style={{
                        background: statusColor.bg,
                        color: statusColor.fg,
                        padding: "0.2rem 0.6rem",
                        borderRadius: 999,
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {STATUS_LABEL[effectiveStatus]}
                    </span>
                  </td>
                  <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                    {c.planType === "MENSUAL" && (
                      <form action={renewMonthlyPayment} style={{ display: "inline" }}>
                        <input type="hidden" name="id" value={c.id} />
                        <button
                          type="submit"
                          title="Registra el pago del mes y actualiza la fecha de vencimiento"
                          style={{
                            background: "#ecfdf5",
                            color: "#166534",
                            border: "1px solid #a7f3d0",
                            padding: "0.25rem 0.6rem",
                            borderRadius: 6,
                            fontWeight: 600,
                            fontSize: "0.8rem",
                            cursor: "pointer",
                            marginRight: 12,
                          }}
                        >
                          Renovar pago
                        </button>
                      </form>
                    )}
                    <Link href={`/clientes/${c.id}/editar`} style={{ color: "#5c1a4a", fontWeight: 600, marginRight: 12, fontSize: "0.85rem" }}>
                      Editar
                    </Link>
                    <form action={deleteClient} style={{ display: "inline" }}>
                      <input type="hidden" name="id" value={c.id} />
                      <button
                        type="submit"
                        style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "0.85rem" }}
                      >
                        Eliminar
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th: React.CSSProperties = { padding: "0.75rem 1rem", fontWeight: 600, color: "#334155" };
const td: React.CSSProperties = { padding: "0.75rem 1rem", color: "#3d0f30" };
