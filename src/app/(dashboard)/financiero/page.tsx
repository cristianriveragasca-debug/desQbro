import { prisma } from "@/lib/prisma";
import { markAsPaid } from "./actions";

const PROGRAM_LABEL: Record<string, string> = {
  DESQBRO_BEBES: "desQbro Bebés",
  DESQBRO_AQUA: "desQbro AQUA",
  GUAGUAS_SOCCER: "Güipas Soccer",
};

function money(n: number) {
  return n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

export default async function FinancieroPage() {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const payments = await prisma.payment.findMany({
    include: { client: { select: { fullName: true, program: true } } },
    orderBy: { dueDate: "asc" },
  });

  let recaudadoMes = 0;
  let recaudadoTotal = 0;
  let pendiente = 0;
  let vencido = 0;
  const byProgram: Record<string, number> = {};

  for (const p of payments) {
    const amount = Number(p.amount);
    if (p.status === "PAGADO") {
      recaudadoTotal += amount;
      if (p.paidAt && p.paidAt >= startOfMonth) recaudadoMes += amount;
      byProgram[p.client.program] = (byProgram[p.client.program] ?? 0) + amount;
    } else if (p.status === "PENDIENTE") {
      if (p.dueDate < today) vencido += amount;
      else pendiente += amount;
    }
  }

  const pendingPayments = payments.filter((p) => p.status === "PENDIENTE");
  const recentPaid = payments.filter((p) => p.status === "PAGADO").slice(-15).reverse();

  const cards = [
    { label: "Recaudado este mes", value: money(recaudadoMes), color: "#166534" },
    { label: "Recaudado histórico", value: money(recaudadoTotal), color: "#3d0f30" },
    { label: "Por cobrar (vigente)", value: money(pendiente), color: "#92400e" },
    { label: "Vencido", value: money(vencido), color: "#dc2626" },
  ];

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Financiero</h1>
      <p style={{ color: "#64748b" }}>Recaudo, cuotas pendientes e ingresos por programa.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 24 }}>
        {cards.map((c) => (
          <div key={c.label} style={{ background: "#fff", borderRadius: 12, padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: "0.85rem", color: "#64748b" }}>{c.label}</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: "1.1rem", marginTop: 32 }}>Ingresos por programa (histórico)</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 12 }}>
        {Object.entries(PROGRAM_LABEL).map(([key, label]) => (
          <div key={key} style={{ background: "#fff", borderRadius: 12, padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: "0.85rem", color: "#64748b" }}>{label}</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#3d0f30" }}>{money(byProgram[key] ?? 0)}</div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: "1.1rem", marginTop: 32 }}>Cuotas pendientes y vencidas</h2>
      <div style={{ marginTop: 12, background: "#fff", borderRadius: 12, overflow: "auto", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
              <th style={th}>Cliente</th>
              <th style={th}>Concepto</th>
              <th style={th}>Valor</th>
              <th style={th}>Vence</th>
              <th style={th}>Estado</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {pendingPayments.length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...td, textAlign: "center", color: "#94a3b8" }}>
                  No hay cuotas pendientes.
                </td>
              </tr>
            )}
            {pendingPayments.map((p) => {
              const overdue = p.dueDate < today;
              return (
                <tr key={p.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                  <td style={td}>{p.client.fullName}</td>
                  <td style={td}>{p.concept}</td>
                  <td style={td}>{money(Number(p.amount))}</td>
                  <td style={{ ...td, whiteSpace: "nowrap", color: overdue ? "#dc2626" : "#3d0f30", fontWeight: overdue ? 700 : 400 }}>
                    {p.dueDate.toLocaleDateString("es-CO")}
                  </td>
                  <td style={td}>
                    <span
                      style={{
                        background: overdue ? "#fee2e2" : "#fef3c7",
                        color: overdue ? "#dc2626" : "#92400e",
                        padding: "0.15rem 0.5rem",
                        borderRadius: 999,
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      {overdue ? "Vencido" : "Pendiente"}
                    </span>
                  </td>
                  <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                    <form action={markAsPaid}>
                      <input type="hidden" name="id" value={p.id} />
                      <button
                        type="submit"
                        style={{
                          background: "#ffc814",
                          color: "#3d0f30",
                          border: "none",
                          padding: "0.35rem 0.7rem",
                          borderRadius: 6,
                          fontWeight: 700,
                          fontSize: "0.8rem",
                          cursor: "pointer",
                        }}
                      >
                        Marcar pagado
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: "1.1rem", marginTop: 32 }}>Últimos pagos recibidos</h2>
      <div style={{ marginTop: 12, background: "#fff", borderRadius: 12, overflow: "auto", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
              <th style={th}>Cliente</th>
              <th style={th}>Concepto</th>
              <th style={th}>Valor</th>
              <th style={th}>Fecha de pago</th>
            </tr>
          </thead>
          <tbody>
            {recentPaid.length === 0 && (
              <tr>
                <td colSpan={4} style={{ ...td, textAlign: "center", color: "#94a3b8" }}>
                  Aún no hay pagos registrados.
                </td>
              </tr>
            )}
            {recentPaid.map((p) => (
              <tr key={p.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                <td style={td}>{p.client.fullName}</td>
                <td style={td}>{p.concept}</td>
                <td style={td}>{money(Number(p.amount))}</td>
                <td style={{ ...td, whiteSpace: "nowrap" }}>{p.paidAt?.toLocaleDateString("es-CO")}</td>
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
