import { prisma } from "@/lib/prisma";

function money(n: number) {
  return n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

function startOfWeek(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday as start of week
  d.setDate(d.getDate() + diff);
  return d;
}

export default async function HomePage() {
  const today = new Date();

  const PROGRAMS = [
    { key: "DESQBRO_BEBES", label: "desQbro Bebés" },
    { key: "DESQBRO_AQUA", label: "desQbro AQUA" },
    { key: "GUAGUAS_SOCCER", label: "Güipas Soccer" },
  ] as const;
  const PLAN_TYPES = [
    { key: "MENSUAL", label: "Mensual" },
    { key: "TRIMESTRAL", label: "Trimestral" },
    { key: "SEMESTRAL", label: "Semestral" },
  ] as const;

  const WEEKS_BACK = 6;
  const currentWeekStart = startOfWeek(today);
  const earliestWeekStart = new Date(currentWeekStart);
  earliestWeekStart.setDate(earliestWeekStart.getDate() - (WEEKS_BACK - 1) * 7);

  const [totalClientes, activos, vencidos, inactivos, bebes, aqua, soccer, planByProgramCounts, recentPayments] = await Promise.all([
    prisma.client.count(),
    prisma.programSubscription.count({ where: { status: { not: "INACTIVO" }, dueDate: { gte: today } } }),
    prisma.programSubscription.count({ where: { status: { not: "INACTIVO" }, dueDate: { lt: today } } }),
    prisma.programSubscription.count({ where: { status: "INACTIVO" } }),
    prisma.programSubscription.count({ where: { program: "DESQBRO_BEBES" } }),
    prisma.programSubscription.count({ where: { program: "DESQBRO_AQUA" } }),
    prisma.programSubscription.count({ where: { program: "GUAGUAS_SOCCER" } }),
    Promise.all(
      PROGRAMS.flatMap((p) =>
        PLAN_TYPES.map(async (pt) => ({
          program: p.key,
          planType: pt.key,
          count: await prisma.programSubscription.count({
            where: { program: p.key, planType: pt.key, status: { not: "INACTIVO" } },
          }),
        }))
      )
    ),
    prisma.payment.findMany({
      where: { status: "PAGADO", paidAt: { gte: earliestWeekStart } },
      select: { amount: true, paidAt: true, subscription: { select: { program: true } } },
    }),
  ]);

  const weeks = Array.from({ length: WEEKS_BACK }, (_, i) => {
    const start = new Date(currentWeekStart);
    start.setDate(start.getDate() - (WEEKS_BACK - 1 - i) * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { start, end };
  });

  const weeklyIncome = (weekStart: Date, program?: string) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return recentPayments
      .filter((p) => p.paidAt && p.paidAt >= weekStart && p.paidAt < weekEnd && (!program || p.subscription.program === program))
      .reduce((sum, p) => sum + Number(p.amount), 0);
  };

  const cards = [
    { label: "Total clientes", value: totalClientes, color: "#3d0f30" },
    { label: "Programas activos", value: activos, color: "#166534" },
    { label: "Programas vencidos", value: vencidos, color: "#dc2626" },
    { label: "Programas inactivos", value: inactivos, color: "#64748b" },
    { label: "desQbro Bebés", value: bebes, color: "#3d0f30" },
    { label: "desQbro AQUA", value: aqua, color: "#3d0f30" },
    { label: "Güipas Soccer", value: soccer, color: "#3d0f30" },
  ];

  const planCount = (program: string, planType: string) =>
    planByProgramCounts.find((c) => c.program === program && c.planType === planType)?.count ?? 0;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Panel General</h1>
      <p style={{ color: "#64748b" }}>Resumen de tu escuela de formación deportiva.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginTop: 24 }}>
        {cards.map((c) => (
          <div
            key={c.label}
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "1.25rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ fontSize: "0.85rem", color: "#64748b" }}>{c.label}</div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: "1.05rem", marginTop: 28, marginBottom: 12, color: "#3d0f30" }}>Niños por programa y tipo de plan</h2>
      <div className="table-scroll" style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead>
            <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
              <th style={th}>Programa</th>
              {PLAN_TYPES.map((pt) => (
                <th key={pt.key} style={{ ...th, textAlign: "center" }}>
                  {pt.label}
                </th>
              ))}
              <th style={{ ...th, textAlign: "center" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {PROGRAMS.map((p) => {
              const rowTotal = PLAN_TYPES.reduce((sum, pt) => sum + planCount(p.key, pt.key), 0);
              return (
                <tr key={p.key} style={{ borderTop: "1px solid #e2e8f0" }}>
                  <td style={{ ...td, fontWeight: 600, color: "#3d0f30" }}>{p.label}</td>
                  {PLAN_TYPES.map((pt) => (
                    <td key={pt.key} style={{ ...td, textAlign: "center" }}>
                      {planCount(p.key, pt.key)}
                    </td>
                  ))}
                  <td style={{ ...td, textAlign: "center", fontWeight: 700 }}>{rowTotal}</td>
                </tr>
              );
            })}
            <tr style={{ borderTop: "2px solid #cbd5e1", background: "#f8fafc" }}>
              <td style={{ ...td, fontWeight: 700, color: "#3d0f30" }}>Total</td>
              {PLAN_TYPES.map((pt) => (
                <td key={pt.key} style={{ ...td, textAlign: "center", fontWeight: 700 }}>
                  {PROGRAMS.reduce((sum, p) => sum + planCount(p.key, pt.key), 0)}
                </td>
              ))}
              <td style={{ ...td, textAlign: "center", fontWeight: 700 }}>
                {PROGRAMS.reduce((sum, p) => sum + PLAN_TYPES.reduce((s, pt) => s + planCount(p.key, pt.key), 0), 0)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: "1.05rem", marginTop: 28, marginBottom: 12, color: "#3d0f30" }}>Ingresos por semana y programa</h2>
      <div className="table-scroll" style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
              <th style={th}>Semana</th>
              {PROGRAMS.map((p) => (
                <th key={p.key} style={{ ...th, textAlign: "right" }}>
                  {p.label}
                </th>
              ))}
              <th style={{ ...th, textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {weeks
              .slice()
              .reverse()
              .map(({ start, end }) => {
                const rowTotal = weeklyIncome(start);
                return (
                  <tr key={start.toISOString()} style={{ borderTop: "1px solid #e2e8f0" }}>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>
                      {start.toLocaleDateString("es-CO", { day: "numeric", month: "short" })} - {end.toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                    </td>
                    {PROGRAMS.map((p) => (
                      <td key={p.key} style={{ ...td, textAlign: "right" }}>
                        {money(weeklyIncome(start, p.key))}
                      </td>
                    ))}
                    <td style={{ ...td, textAlign: "right", fontWeight: 700 }}>{money(rowTotal)}</td>
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
