import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { markAsPaid } from "./actions";
import { CASH_DISTRIBUTION, PLAN_LABEL, PLAN_MONTHS, getPlanPrice } from "@/lib/pricing";
import { EXPENSE_CATEGORY_LABEL } from "@/lib/expenses";

const PROGRAM_LABEL: Record<string, string> = {
  DESQBRO_BEBES: "desQbro Bebés",
  DESQBRO_AQUA: "desQbro AQUA",
  GUAGUAS_SOCCER: "Güipas Soccer",
};

function monthsElapsed(from: Date, to: Date): number {
  let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  if (to.getDate() < from.getDate()) months -= 1;
  return Math.max(months, 0);
}

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
  const mesByProgram: Record<string, number> = {};

  for (const p of payments) {
    const amount = Number(p.amount);
    if (p.status === "PAGADO") {
      recaudadoTotal += amount;
      byProgram[p.client.program] = (byProgram[p.client.program] ?? 0) + amount;
      if (p.paidAt && p.paidAt >= startOfMonth) {
        recaudadoMes += amount;
        mesByProgram[p.client.program] = (mesByProgram[p.client.program] ?? 0) + amount;
      }
    } else if (p.status === "PENDIENTE") {
      if (p.dueDate < today) vencido += amount;
      else pendiente += amount;
    }
  }

  const pendingPayments = payments.filter((p) => p.status === "PENDIENTE");
  const recentPaid = payments.filter((p) => p.status === "PAGADO").slice(-15).reverse();

  const expensesMes = await prisma.expense.aggregate({
    _sum: { amount: true },
    where: { date: { gte: startOfMonth } },
  });
  const egresosMes = Number(expensesMes._sum.amount ?? 0);
  const utilidadNeta = recaudadoMes - egresosMes;

  const expensesMesList = await prisma.expense.findMany({ where: { date: { gte: startOfMonth } } });
  const egresosPorCategoria: Record<string, number> = {};
  for (const e of expensesMesList) {
    egresosPorCategoria[e.category] = (egresosPorCategoria[e.category] ?? 0) + Number(e.amount);
  }
  const egresosPorCategoriaOrdenados = Object.entries(egresosPorCategoria).sort((a, b) => b[1] - a[1]);
  const maxEgresoCategoria = Math.max(...egresosPorCategoriaOrdenados.map(([, v]) => v), 1);

  const cards = [
    { label: "Recaudado este mes", value: money(recaudadoMes), color: "#166534" },
    { label: "Egresos este mes", value: money(egresosMes), color: "#dc2626" },
    { label: "Utilidad neta del mes", value: money(utilidadNeta), color: utilidadNeta >= 0 ? "#166534" : "#dc2626" },
    { label: "Recaudado histórico", value: money(recaudadoTotal), color: "#3d0f30" },
    { label: "Por cobrar (vigente)", value: money(pendiente), color: "#92400e" },
    { label: "Vencido", value: money(vencido), color: "#dc2626" },
  ];

  // Caja anticipada: dinero ya recibido de planes trimestrales/semestrales
  // que corresponde a meses futuros aún no "consumidos".
  const advanceClients = await prisma.client.findMany({
    where: { planType: { in: ["TRIMESTRAL", "SEMESTRAL"] }, status: { not: "INACTIVO" } },
    include: { payments: { where: { status: "PAGADO" } } },
  });

  const advanceRows = advanceClients
    .map((c) => {
      const totalPaid = c.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const months = PLAN_MONTHS[c.planType] ?? 1;
      const planTotal = c.customAmount ? Number(c.customAmount) : getPlanPrice(c.program, c.planType);
      const monthlyEquivalent = planTotal / months;
      const elapsed = Math.min(monthsElapsed(c.paymentDate, today), months);
      const recognized = Math.min(monthlyEquivalent * elapsed, totalPaid);
      const advance = Math.max(totalPaid - recognized, 0);
      return {
        id: c.id,
        fullName: c.fullName,
        planType: c.planType,
        totalPaid,
        monthlyEquivalent,
        advance,
      };
    })
    .filter((r) => r.totalPaid > 0);

  const totalAdvance = advanceRows.reduce((sum, r) => sum + r.advance, 0);
  const totalMonthlyEquivalent = advanceRows.reduce((sum, r) => sum + r.monthlyEquivalent, 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0 }}>Financiero</h1>
          <p style={{ color: "#64748b", marginTop: 4 }}>Recaudo, cuotas pendientes e ingresos por programa.</p>
        </div>
        <Link
          href="/financiero/egresos"
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
          Ver Egresos →
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 24 }}>
        {cards.map((c) => (
          <div key={c.label} style={{ background: "#fff", borderRadius: 12, padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: "0.85rem", color: "#64748b" }}>{c.label}</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: "1.1rem", marginTop: 32 }}>Distribución de caja por programa (mes actual)</h2>
      <div className="table-scroll" style={{ marginTop: 12, background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
              <th style={th}>Programa</th>
              <th style={th}>Recaudado mes</th>
              {CASH_DISTRIBUTION.map((d) => (
                <th key={d.key} style={th}>
                  {d.label} ({Math.round(d.pct * 100)}%)
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(PROGRAM_LABEL).map(([key, label]) => {
              const monto = mesByProgram[key] ?? 0;
              return (
                <tr key={key} style={{ borderTop: "1px solid #e2e8f0" }}>
                  <td style={td}>{label}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{money(monto)}</td>
                  {CASH_DISTRIBUTION.map((d) => (
                    <td key={d.key} style={td}>
                      {money(monto * d.pct)}
                    </td>
                  ))}
                </tr>
              );
            })}
            <tr style={{ borderTop: "2px solid #cbd5e1", fontWeight: 700 }}>
              <td style={td}>Total</td>
              <td style={td}>{money(recaudadoMes)}</td>
              {CASH_DISTRIBUTION.map((d) => (
                <td key={d.key} style={td}>
                  {money(recaudadoMes * d.pct)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: "1.1rem", marginTop: 32 }}>Caja anticipada (planes trimestrales / semestrales)</h2>
      <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: 4 }}>
        Dinero ya recibido de planes por adelantado que aún corresponde a meses futuros — se descuenta cada mes como si el
        padre pagara mensualmente. Equivalente mensual actual: <strong>{money(totalMonthlyEquivalent)}</strong>.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 12 }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Caja anticipada total (sin consumir)</div>
          <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#0369a1" }}>{money(totalAdvance)}</div>
        </div>
      </div>
      <div className="table-scroll" style={{ marginTop: 12, background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
              <th style={th}>Cliente</th>
              <th style={th}>Plan</th>
              <th style={th}>Pagado</th>
              <th style={th}>Equiv. mensual</th>
              <th style={th}>Anticipado disponible</th>
            </tr>
          </thead>
          <tbody>
            {advanceRows.length === 0 && (
              <tr>
                <td colSpan={5} style={{ ...td, textAlign: "center", color: "#94a3b8" }}>
                  No hay planes trimestrales o semestrales con pagos registrados.
                </td>
              </tr>
            )}
            {advanceRows.map((r) => (
              <tr key={r.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                <td style={td}>{r.fullName}</td>
                <td style={td}>{PLAN_LABEL[r.planType]}</td>
                <td style={td}>{money(r.totalPaid)}</td>
                <td style={td}>{money(r.monthlyEquivalent)}</td>
                <td style={{ ...td, color: "#0369a1", fontWeight: 600 }}>{money(r.advance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: "1.1rem", marginTop: 32 }}>Egresos por categoría (mes actual)</h2>
      <div style={{ marginTop: 12, background: "#fff", borderRadius: 12, padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        {egresosPorCategoriaOrdenados.length === 0 ? (
          <p style={{ color: "#94a3b8", margin: 0, fontSize: "0.85rem" }}>No hay egresos registrados este mes.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {egresosPorCategoriaOrdenados.map(([category, amount]) => (
              <div key={category}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: 4 }}>
                  <span style={{ color: "#334155" }}>{EXPENSE_CATEGORY_LABEL[category] ?? category}</span>
                  <span style={{ fontWeight: 600, color: "#dc2626" }}>{money(amount)}</span>
                </div>
                <div style={{ background: "#f1f5f9", borderRadius: 999, height: 8, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${(amount / maxEgresoCategoria) * 100}%`,
                      background: "#dc2626",
                      height: "100%",
                      borderRadius: 999,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
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
      <div className="table-scroll" style={{ marginTop: 12, background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
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
      <div className="table-scroll" style={{ marginTop: 12, background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
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
