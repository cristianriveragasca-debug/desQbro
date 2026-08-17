import { prisma } from "@/lib/prisma";
import { money, monthWeeks } from "@/lib/weeks";
import { DAY_LABELS, PROGRAM_LABEL } from "@/lib/schedule";

function monthInputValue(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function parseMonthParam(value: string | undefined): { year: number; month: number } {
  if (value) {
    const match = /^(\d{4})-(\d{2})$/.exec(value);
    if (match) return { year: Number(match[1]), month: Number(match[2]) - 1 };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

export default async function ReportesPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month: monthParam } = await searchParams;
  const { year, month } = parseMonthParam(monthParam);
  const weeks = monthWeeks(year, month);
  const monthStart = weeks[0].start;
  const monthEnd = new Date(weeks[weeks.length - 1].end);
  monthEnd.setDate(monthEnd.getDate() + 1);

  const payments = await prisma.payment.findMany({
    where: { status: "PAGADO", paidAt: { gte: monthStart, lt: monthEnd } },
    include: { subscription: { include: { client: true } } },
    orderBy: { paidAt: "asc" },
  });

  const weekIndexFor = (date: Date) => {
    for (let i = 0; i < weeks.length; i++) {
      const weekEndExclusive = new Date(weeks[i].end);
      weekEndExclusive.setDate(weekEndExclusive.getDate() + 1);
      if (date >= weeks[i].start && date < weekEndExclusive) return i;
    }
    return -1;
  };

  const weekRows = weeks.map((w, i) => {
    const rowPayments = payments.filter((p) => p.paidAt && weekIndexFor(p.paidAt) === i);
    return {
      ...w,
      count: rowPayments.length,
      total: rowPayments.reduce((sum, p) => sum + Number(p.amount), 0),
    };
  });

  const monthValue = monthInputValue(monthStart);
  const monthLabel = monthStart.toLocaleDateString("es-CO", { month: "long", year: "numeric" });

  const classGroups = await prisma.classGroup.findMany({
    include: { enrollments: { include: { client: true } } },
    orderBy: [{ program: "asc" }, { dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Reportes</h1>
      <p style={{ color: "#64748b" }}>Quiénes pagaron cada semana, con exportación a Excel.</p>

      <form style={{ display: "flex", gap: 10, alignItems: "flex-end", marginTop: 20, flexWrap: "wrap" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", marginBottom: 6, color: "#334155" }}>Mes</label>
          <input
            name="month"
            type="month"
            defaultValue={monthValue}
            style={{ padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
          />
        </div>
        <button
          type="submit"
          style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 8, padding: "0.5rem 1rem", fontSize: "0.85rem", cursor: "pointer", color: "#334155" }}
        >
          Ver mes
        </button>
        <a
          href={`/api/reportes/pagos-semana?month=${monthValue}`}
          style={{
            background: "#166534",
            color: "#fff",
            padding: "0.5rem 1rem",
            borderRadius: 8,
            fontSize: "0.85rem",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Descargar Excel
        </a>
      </form>

      <h2 style={{ fontSize: "1.05rem", marginTop: 28, marginBottom: 12, color: "#3d0f30", textTransform: "capitalize" }}>
        Resumen · {monthLabel}
      </h2>
      <div className="table-scroll" style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead>
            <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
              <th style={th}>Semana</th>
              <th style={{ ...th, textAlign: "center" }}>Pagos</th>
              <th style={{ ...th, textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {weekRows.map((w, i) => (
              <tr key={w.start.toISOString()} style={{ borderTop: "1px solid #e2e8f0" }}>
                <td style={td}>
                  Semana {i + 1} · {w.start.toLocaleDateString("es-CO", { day: "numeric", month: "short" })} - {w.end.toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                </td>
                <td style={{ ...td, textAlign: "center" }}>{w.count}</td>
                <td style={{ ...td, textAlign: "right", fontWeight: 700 }}>{money(w.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: "1.05rem", marginTop: 28, marginBottom: 12, color: "#3d0f30" }}>Detalle de pagos</h2>
      <div className="table-scroll" style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
              <th style={th}>Semana</th>
              <th style={th}>Fecha</th>
              <th style={th}>Niño/a</th>
              <th style={th}>Programa</th>
              <th style={th}>Concepto</th>
              <th style={{ ...th, textAlign: "right" }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...td, textAlign: "center", color: "#94a3b8" }}>
                  Sin pagos registrados este mes.
                </td>
              </tr>
            )}
            {payments.map((p) => {
              const idx = p.paidAt ? weekIndexFor(p.paidAt) : -1;
              return (
                <tr key={p.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                  <td style={td}>{idx >= 0 ? `Semana ${idx + 1}` : "—"}</td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>{p.paidAt?.toLocaleDateString("es-CO")}</td>
                  <td style={td}>{p.subscription.client.fullName}</td>
                  <td style={td}>{PROGRAM_LABEL[p.subscription.program]}</td>
                  <td style={td}>{p.concept}</td>
                  <td style={{ ...td, textAlign: "right" }}>{money(Number(p.amount))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ fontSize: "1.05rem", margin: 0, color: "#3d0f30" }}>Grupos y horarios</h2>
        <a
          href="/api/reportes/grupos-horarios"
          style={{ background: "#166534", color: "#fff", padding: "0.45rem 0.9rem", borderRadius: 8, fontSize: "0.8rem", fontWeight: 700, textDecoration: "none" }}
        >
          Descargar Excel
        </a>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
        {classGroups.length === 0 && (
          <p style={{ fontSize: "0.85rem", color: "#94a3b8", background: "#fff", borderRadius: 12, padding: "1rem" }}>
            Aún no hay grupos de clase creados.
          </p>
        )}
        {classGroups.map((g) => (
          <div key={g.id} style={{ background: "#fff", borderRadius: 12, padding: "1rem 1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div>
                <strong style={{ color: "#3d0f30" }}>{g.name}</strong>
                <span style={{ color: "#64748b", marginLeft: 8, fontSize: "0.85rem" }}>{PROGRAM_LABEL[g.program]}</span>
              </div>
              <span style={{ fontSize: "0.85rem", color: "#5c1a4a", fontWeight: 600 }}>
                {DAY_LABELS[g.dayOfWeek]} · {g.startTime} - {g.endTime}
              </span>
            </div>
            <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 6 }}>
              {g.enrollments.length} / {g.capacity} niños inscritos
            </p>
            <details style={{ marginTop: 6 }}>
              <summary style={{ cursor: "pointer", fontSize: "0.8rem", color: "#5c1a4a", fontWeight: 600 }}>Ver niños del grupo</summary>
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                {g.enrollments.length === 0 && <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: 0 }}>Sin niños inscritos.</p>}
                {g.enrollments.map((e) => (
                  <div key={e.id} style={{ fontSize: "0.85rem", color: "#3d0f30" }}>
                    {e.client.fullName}
                  </div>
                ))}
              </div>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}

const th: React.CSSProperties = { padding: "0.75rem 1rem", fontWeight: 600, color: "#334155" };
const td: React.CSSProperties = { padding: "0.75rem 1rem", color: "#3d0f30" };
