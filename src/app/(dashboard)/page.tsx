import { prisma } from "@/lib/prisma";
import { money, monthWeeks } from "@/lib/weeks";
import { IncomeComparisonChart } from "@/components/income-comparison-chart";
import { saveMonthlyIncomeOverrides } from "./actions";

const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export default async function HomePage() {
  const today = new Date();
  const currentYear = today.getFullYear();

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

  const weeks = monthWeeks(today.getFullYear(), today.getMonth());
  const monthStart = weeks[0].start;

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
      where: { status: "PAGADO", paidAt: { gte: monthStart } },
      select: { amount: true, paidAt: true, subscription: { select: { program: true } } },
    }),
  ]);

  const [yearPayments, overrides] = await Promise.all([
    prisma.payment.findMany({
      where: { status: "PAGADO", paidAt: { gte: new Date(currentYear, 0, 1), lt: new Date(currentYear + 1, 0, 1) } },
      select: { amount: true, paidAt: true, subscription: { select: { program: true } } },
    }),
    prisma.monthlyIncomeOverride.findMany({ where: { year: currentYear } }),
  ]);

  const computedMonthly = (program: string, monthIdx: number) =>
    yearPayments
      .filter((p) => p.paidAt && p.paidAt.getMonth() === monthIdx && p.subscription.program === program)
      .reduce((sum, p) => sum + Number(p.amount), 0);

  const overrideMonthly = (program: string, monthIdx: number) =>
    overrides.find((o) => o.program === program && o.month === monthIdx + 1)?.amount;

  const mergedMonthly = (program: string, monthIdx: number) => {
    const override = overrideMonthly(program, monthIdx);
    return override !== undefined ? Number(override) : computedMonthly(program, monthIdx);
  };

  const chartData = MONTH_LABELS.map((_, monthIdx) => ({
    DESQBRO_BEBES: mergedMonthly("DESQBRO_BEBES", monthIdx),
    DESQBRO_AQUA: mergedMonthly("DESQBRO_AQUA", monthIdx),
    GUAGUAS_SOCCER: mergedMonthly("GUAGUAS_SOCCER", monthIdx),
  }));

  const weeklyIncome = (weekStart: Date, weekEndInclusive: Date, program?: string) => {
    const weekEndExclusive = new Date(weekEndInclusive);
    weekEndExclusive.setDate(weekEndExclusive.getDate() + 1);
    return recentPayments
      .filter((p) => p.paidAt && p.paidAt >= weekStart && p.paidAt < weekEndExclusive && (!program || p.subscription.program === program))
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

      <h2 style={{ fontSize: "1.05rem", marginTop: 28, marginBottom: 12, color: "#3d0f30" }}>
        Ingresos por semana y programa · {today.toLocaleDateString("es-CO", { month: "long", year: "numeric" })}
      </h2>
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
            {weeks.map(({ start, end }, i) => {
              const rowTotal = weeklyIncome(start, end);
              return (
                <tr key={start.toISOString()} style={{ borderTop: "1px solid #e2e8f0" }}>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>
                    Semana {i + 1} · {start.toLocaleDateString("es-CO", { day: "numeric", month: "short" })} - {end.toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                  </td>
                  {PROGRAMS.map((p) => (
                    <td key={p.key} style={{ ...td, textAlign: "right" }}>
                      {money(weeklyIncome(start, end, p.key))}
                    </td>
                  ))}
                  <td style={{ ...td, textAlign: "right", fontWeight: 700 }}>{money(rowTotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: "1.05rem", marginTop: 28, marginBottom: 12, color: "#3d0f30" }}>
        Comparativo de ingresos por programa · {currentYear}
      </h2>
      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", padding: "1.25rem" }}>
        <IncomeComparisonChart data={chartData} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, flexWrap: "wrap", gap: 8 }}>
        <h3 style={{ fontSize: "0.95rem", margin: 0, color: "#3d0f30" }}>Resumen mensual por programa</h3>
        <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0 }}>
          Los meses con pagos registrados en el sistema se calculan automáticamente; puedes corregir cualquier valor y guardar.
        </p>
      </div>
      <form action={saveMonthlyIncomeOverrides} className="table-scroll" style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginTop: 10 }}>
        <input type="hidden" name="year" value={currentYear} />
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
          <thead>
            <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
              <th style={th}>Programa</th>
              {MONTH_LABELS.map((m) => (
                <th key={m} style={{ ...th, textAlign: "center" }}>
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PROGRAMS.map((p) => (
              <tr key={p.key} style={{ borderTop: "1px solid #e2e8f0" }}>
                <td style={{ ...td, fontWeight: 600, color: "#3d0f30", whiteSpace: "nowrap" }}>{p.label}</td>
                {MONTH_LABELS.map((_, monthIdx) => (
                  <td key={monthIdx} style={{ padding: "0.4rem 0.3rem" }}>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      name={`amount_${p.key}_${monthIdx + 1}`}
                      defaultValue={mergedMonthly(p.key, monthIdx)}
                      style={{ width: 82, padding: "0.3rem", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.75rem", textAlign: "right" }}
                    />
                  </td>
                ))}
              </tr>
            ))}
            <tr style={{ borderTop: "2px solid #cbd5e1", background: "#f8fafc" }}>
              <td style={{ ...td, fontWeight: 700, color: "#3d0f30" }}>Total</td>
              {MONTH_LABELS.map((_, monthIdx) => (
                <td key={monthIdx} style={{ ...td, textAlign: "center", fontWeight: 700 }}>
                  {money(PROGRAMS.reduce((sum, p) => sum + mergedMonthly(p.key, monthIdx), 0))}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        <div style={{ padding: "1rem" }}>
          <button
            type="submit"
            style={{ background: "#166534", color: "#fff", border: "none", padding: "0.55rem 1.2rem", borderRadius: 8, fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
          >
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}

const th: React.CSSProperties = { padding: "0.75rem 1rem", fontWeight: 600, color: "#334155" };
const td: React.CSSProperties = { padding: "0.75rem 1rem", color: "#3d0f30" };
