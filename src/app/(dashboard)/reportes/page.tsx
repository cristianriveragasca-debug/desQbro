import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { money, monthWeeks } from "@/lib/weeks";
import { DAY_LABELS, PROGRAM_LABEL } from "@/lib/schedule";
import { getEffectiveStatus } from "@/lib/status";
import { saveMonthlyGoal } from "./actions";

const PLAN_LABEL: Record<string, string> = { MENSUAL: "Mensual", TRIMESTRAL: "Trimestral", SEMESTRAL: "Semestral" };

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

export default async function ReportesPage({ searchParams }: { searchParams: Promise<{ month?: string; program?: string }> }) {
  const { month: monthParam, program: programFilter } = await searchParams;
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

  const validProgramFilter =
    programFilter === "DESQBRO_BEBES" || programFilter === "DESQBRO_AQUA" || programFilter === "GUAGUAS_SOCCER"
      ? programFilter
      : undefined;

  const expiringSubscriptions = await prisma.programSubscription.findMany({
    where: {
      status: { not: "INACTIVO" },
      dueDate: { gte: monthStart, lt: monthEnd },
      ...(validProgramFilter ? { program: validProgramFilter } : {}),
    },
    include: { client: true },
    orderBy: { dueDate: "asc" },
  });
  const today = new Date();

  const classGroups = await prisma.classGroup.findMany({
    include: { enrollments: { include: { client: true } } },
    orderBy: [{ program: "asc" }, { dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  const PROGRAMS = Object.keys(PROGRAM_LABEL) as ("DESQBRO_BEBES" | "DESQBRO_AQUA" | "GUAGUAS_SOCCER")[];

  const allHistoryEvents = await prisma.programHistoryEvent.findMany({ orderBy: { date: "asc" } });

  const activeCountAsOf = (asOfExclusive: Date, program: string) => {
    const net = new Map<string, number>();
    for (const e of allHistoryEvents) {
      if (e.date >= asOfExclusive) continue;
      if (e.program !== program) continue;
      net.set(e.clientId, (net.get(e.clientId) ?? 0) + (e.eventType === "ALTA" ? 1 : -1));
    }
    let count = 0;
    for (const v of net.values()) if (v > 0) count++;
    return count;
  };

  const allEventsUpToMonthEnd = allHistoryEvents.filter((e) => e.date < monthEnd);
  const activeCount = (program: string) => activeCountAsOf(monthEnd, program);

  // --- Cierre de mes: comparativo con el mes anterior ---
  const prevMonthIdx = month === 0 ? 11 : month - 1;
  const prevMonthYear = month === 0 ? year - 1 : year;
  const prevWeeks = monthWeeks(prevMonthYear, prevMonthIdx);
  const prevMonthStart = prevWeeks[0].start;
  const prevMonthEnd = new Date(prevWeeks[prevWeeks.length - 1].end);
  prevMonthEnd.setDate(prevMonthEnd.getDate() + 1);
  const prevMonthLabel = prevMonthStart.toLocaleDateString("es-CO", { month: "long", year: "numeric" });

  const prevPayments = await prisma.payment.findMany({
    where: { status: "PAGADO", paidAt: { gte: prevMonthStart, lt: prevMonthEnd } },
    include: { subscription: { select: { program: true } } },
  });

  const recaudoPorPrograma = (list: { amount: unknown; subscription: { program: string } }[], program: string) =>
    list.filter((p) => p.subscription.program === program).reduce((sum, p) => sum + Number(p.amount), 0);

  const monthlyClose = PROGRAMS.map((p) => {
    const prevRecaudo = recaudoPorPrograma(prevPayments, p);
    const currRecaudo = recaudoPorPrograma(payments, p);
    const varPct = prevRecaudo > 0 ? ((currRecaudo - prevRecaudo) / prevRecaudo) * 100 : currRecaudo > 0 ? 100 : 0;
    const prevActivos = activeCountAsOf(prevMonthEnd, p);
    const currActivos = activeCountAsOf(monthEnd, p);
    return { program: p, prevRecaudo, currRecaudo, varPct, prevActivos, currActivos, varActivos: currActivos - prevActivos };
  });
  const monthlyCloseTotals = {
    prevRecaudo: monthlyClose.reduce((s, r) => s + r.prevRecaudo, 0),
    currRecaudo: monthlyClose.reduce((s, r) => s + r.currRecaudo, 0),
    prevActivos: monthlyClose.reduce((s, r) => s + r.prevActivos, 0),
    currActivos: monthlyClose.reduce((s, r) => s + r.currActivos, 0),
  };
  const monthlyCloseTotalVarPct =
    monthlyCloseTotals.prevRecaudo > 0
      ? ((monthlyCloseTotals.currRecaudo - monthlyCloseTotals.prevRecaudo) / monthlyCloseTotals.prevRecaudo) * 100
      : 0;

  // --- Tracker semanal con meta del mes ---
  const monthlyGoal = await prisma.monthlyGoal.findUnique({ where: { year_month: { year, month: month + 1 } } });
  const realisticGoal = monthlyGoal ? Number(monthlyGoal.realistic) : 0;
  const aspirationalGoal = monthlyGoal ? Number(monthlyGoal.aspirational) : 0;
  let cumulative = 0;
  const weeklyTracker = weekRows.map((w, i) => {
    cumulative += w.total;
    const cumulativeTarget = realisticGoal > 0 ? (realisticGoal * (i + 1)) / weekRows.length : 0;
    const onTarget = realisticGoal > 0 ? cumulative >= cumulativeTarget : null;
    return { ...w, cumulative, pctVsRealistic: realisticGoal > 0 ? (cumulative / realisticGoal) * 100 : null, onTarget };
  });

  const monthEvents = allEventsUpToMonthEnd.filter((e) => e.date >= monthStart);
  const eventsByClient = new Map<string, typeof monthEvents>();
  for (const e of monthEvents) {
    const list = eventsByClient.get(e.clientId) ?? [];
    list.push(e);
    eventsByClient.set(e.clientId, list);
  }

  const newEnrollments: Record<string, number> = { DESQBRO_BEBES: 0, DESQBRO_AQUA: 0, GUAGUAS_SOCCER: 0 };
  const cancellations: Record<string, number> = { DESQBRO_BEBES: 0, DESQBRO_AQUA: 0, GUAGUAS_SOCCER: 0 };
  const programChanges: { clientName: string; from: string; to: string; date: Date }[] = [];

  for (const [, events] of eventsByClient) {
    const altas = events.filter((e) => e.eventType === "ALTA");
    const bajas = events.filter((e) => e.eventType === "BAJA");
    const matchedAltaIds = new Set<string>();
    const matchedBajaIds = new Set<string>();

    for (const baja of bajas) {
      const alta = altas.find((a) => !matchedAltaIds.has(a.id) && a.program !== baja.program);
      if (alta) {
        matchedAltaIds.add(alta.id);
        matchedBajaIds.add(baja.id);
        programChanges.push({ clientName: baja.clientName, from: baja.program, to: alta.program, date: alta.date });
      }
    }

    for (const a of altas) if (!matchedAltaIds.has(a.id)) newEnrollments[a.program]++;
    for (const b of bajas) if (!matchedBajaIds.has(b.id)) cancellations[b.program]++;
  }

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

      <h2 style={{ fontSize: "1.05rem", marginTop: 28, marginBottom: 4, color: "#3d0f30", textTransform: "capitalize" }}>
        Cierre de mes · {monthLabel} vs {prevMonthLabel}
      </h2>
      <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "0 0 12px" }}>
        Comparativo de recaudo y niños activos frente al mes anterior, por programa.
      </p>
      <div className="table-scroll" style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
              <th style={th}>Programa</th>
              <th style={{ ...th, textAlign: "right" }}>Recaudo {prevMonthLabel}</th>
              <th style={{ ...th, textAlign: "right" }}>Recaudo {monthLabel}</th>
              <th style={{ ...th, textAlign: "right" }}>Var. %</th>
              <th style={{ ...th, textAlign: "center" }}>Activos {prevMonthLabel}</th>
              <th style={{ ...th, textAlign: "center" }}>Activos {monthLabel}</th>
              <th style={{ ...th, textAlign: "center" }}>Var. Activos</th>
            </tr>
          </thead>
          <tbody>
            {monthlyClose.map((r) => (
              <tr key={r.program} style={{ borderTop: "1px solid #e2e8f0" }}>
                <td style={{ ...td, fontWeight: 600, color: "#3d0f30" }}>{PROGRAM_LABEL[r.program]}</td>
                <td style={{ ...td, textAlign: "right" }}>{money(r.prevRecaudo)}</td>
                <td style={{ ...td, textAlign: "right" }}>{money(r.currRecaudo)}</td>
                <td style={{ ...td, textAlign: "right", color: r.varPct >= 0 ? "#166534" : "#dc2626", fontWeight: 600 }}>
                  {r.varPct >= 0 ? "+" : ""}
                  {r.varPct.toFixed(1)}%
                </td>
                <td style={{ ...td, textAlign: "center" }}>{r.prevActivos}</td>
                <td style={{ ...td, textAlign: "center" }}>{r.currActivos}</td>
                <td style={{ ...td, textAlign: "center", color: r.varActivos > 0 ? "#166534" : r.varActivos < 0 ? "#dc2626" : "#64748b", fontWeight: 600 }}>
                  {r.varActivos > 0 ? "+" : ""}
                  {r.varActivos}
                </td>
              </tr>
            ))}
            <tr style={{ borderTop: "2px solid #cbd5e1", background: "#f8fafc" }}>
              <td style={{ ...td, fontWeight: 700, color: "#3d0f30" }}>Total</td>
              <td style={{ ...td, textAlign: "right", fontWeight: 700 }}>{money(monthlyCloseTotals.prevRecaudo)}</td>
              <td style={{ ...td, textAlign: "right", fontWeight: 700 }}>{money(monthlyCloseTotals.currRecaudo)}</td>
              <td style={{ ...td, textAlign: "right", fontWeight: 700, color: monthlyCloseTotalVarPct >= 0 ? "#166534" : "#dc2626" }}>
                {monthlyCloseTotalVarPct >= 0 ? "+" : ""}
                {monthlyCloseTotalVarPct.toFixed(1)}%
              </td>
              <td style={{ ...td, textAlign: "center", fontWeight: 700 }}>{monthlyCloseTotals.prevActivos}</td>
              <td style={{ ...td, textAlign: "center", fontWeight: 700 }}>{monthlyCloseTotals.currActivos}</td>
              <td style={{ ...td, textAlign: "center", fontWeight: 700 }}>
                {monthlyCloseTotals.currActivos - monthlyCloseTotals.prevActivos}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ fontSize: "1.05rem", margin: 0, color: "#3d0f30", textTransform: "capitalize" }}>
          Tracker semanal · {monthLabel}
        </h2>
        <form action={saveMonthlyGoal} style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
          <input type="hidden" name="year" value={year} />
          <input type="hidden" name="month" value={month + 1} />
          <div>
            <label style={{ display: "block", fontSize: "0.7rem", color: "#334155", marginBottom: 2 }}>Meta aspiracional</label>
            <input
              name="aspirational"
              type="number"
              min={0}
              step={100000}
              defaultValue={aspirationalGoal || ""}
              style={{ width: 120, padding: "0.3rem 0.5rem", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.8rem" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.7rem", color: "#334155", marginBottom: 2 }}>Meta realista</label>
            <input
              name="realistic"
              type="number"
              min={0}
              step={100000}
              defaultValue={realisticGoal || ""}
              style={{ width: 120, padding: "0.3rem 0.5rem", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.8rem" }}
            />
          </div>
          <button
            type="submit"
            style={{ background: "#166534", color: "#fff", border: "none", padding: "0.4rem 0.8rem", borderRadius: 6, fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}
          >
            Guardar meta
          </button>
        </form>
      </div>
      <div className="table-scroll" style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginTop: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead>
            <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
              <th style={th}>Semana</th>
              <th style={{ ...th, textAlign: "center" }}>Pagos</th>
              <th style={{ ...th, textAlign: "right" }}>Recaudo semana</th>
              <th style={{ ...th, textAlign: "right" }}>Acumulado</th>
              <th style={{ ...th, textAlign: "right" }}>% vs meta realista</th>
              <th style={{ ...th, textAlign: "center" }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {weeklyTracker.map((w, i) => (
              <tr key={w.start.toISOString()} style={{ borderTop: "1px solid #e2e8f0" }}>
                <td style={td}>
                  Semana {i + 1} · {w.start.toLocaleDateString("es-CO", { day: "numeric", month: "short" })} - {w.end.toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                </td>
                <td style={{ ...td, textAlign: "center" }}>{w.count}</td>
                <td style={{ ...td, textAlign: "right" }}>{money(w.total)}</td>
                <td style={{ ...td, textAlign: "right", fontWeight: 700 }}>{money(w.cumulative)}</td>
                <td style={{ ...td, textAlign: "right" }}>{w.pctVsRealistic !== null ? `${w.pctVsRealistic.toFixed(1)}%` : "—"}</td>
                <td style={{ ...td, textAlign: "center" }}>
                  {w.onTarget === null ? (
                    <span style={{ color: "#94a3b8" }}>Sin meta</span>
                  ) : (
                    <span
                      style={{
                        background: w.onTarget ? "#dcfce7" : "#fee2e2",
                        color: w.onTarget ? "#166534" : "#dc2626",
                        padding: "0.15rem 0.5rem",
                        borderRadius: 999,
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      {w.onTarget ? "En meta" : "Atrasado"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {realisticGoal > 0 && (
        <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 8 }}>
          Meta aspiracional: {money(aspirationalGoal)} · Meta realista: {money(realisticGoal)} · Avance del mes:{" "}
          {money(weeklyTracker[weeklyTracker.length - 1]?.cumulative ?? 0)} ({(((weeklyTracker[weeklyTracker.length - 1]?.cumulative ?? 0) / realisticGoal) * 100).toFixed(1)}% de la meta realista)
        </p>
      )}

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

      <h2 style={{ fontSize: "1.05rem", marginTop: 28, marginBottom: 4, color: "#3d0f30", textTransform: "capitalize" }}>
        Niños por programa y movimientos · {monthLabel}
      </h2>
      <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "0 0 12px" }}>
        El historial de movimientos se empezó a registrar el 14 de septiembre de 2026 — los meses anteriores a esa fecha no
        tienen cambios de programa ni bajas detectadas, solo los ingresos que ya existían.
      </p>
      <div className="table-scroll" style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead>
            <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
              <th style={th}>Programa</th>
              <th style={{ ...th, textAlign: "center" }}>Activos al cierre</th>
              <th style={{ ...th, textAlign: "center" }}>Nuevos ingresos</th>
              <th style={{ ...th, textAlign: "center" }}>Bajas</th>
            </tr>
          </thead>
          <tbody>
            {PROGRAMS.map((p) => (
              <tr key={p} style={{ borderTop: "1px solid #e2e8f0" }}>
                <td style={{ ...td, fontWeight: 600, color: "#3d0f30" }}>{PROGRAM_LABEL[p]}</td>
                <td style={{ ...td, textAlign: "center", fontWeight: 700 }}>{activeCount(p)}</td>
                <td style={{ ...td, textAlign: "center", color: "#166534" }}>{newEnrollments[p]}</td>
                <td style={{ ...td, textAlign: "center", color: "#dc2626" }}>{cancellations[p]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ fontSize: "0.9rem", marginTop: 16, marginBottom: 8, color: "#3d0f30" }}>
        Cambios de programa este mes ({programChanges.length})
      </h3>
      <div style={{ background: "#fff", borderRadius: 12, padding: "1rem 1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        {programChanges.length === 0 ? (
          <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: 0 }}>Sin cambios de programa este mes.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {programChanges.map((c, i) => (
              <div key={i} style={{ fontSize: "0.85rem", color: "#3d0f30" }}>
                <strong>{c.clientName}</strong>: {PROGRAM_LABEL[c.from as keyof typeof PROGRAM_LABEL]} → {PROGRAM_LABEL[c.to as keyof typeof PROGRAM_LABEL]}
                <span style={{ color: "#94a3b8", marginLeft: 6 }}>({c.date.toLocaleDateString("es-CO")})</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <h2 style={{ fontSize: "1.05rem", marginTop: 28, marginBottom: 4, color: "#3d0f30", textTransform: "capitalize" }}>
        Planes que vencen · {monthLabel} ({expiringSubscriptions.length})
      </h2>
      <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "0 0 12px" }}>
        Fecha de vencimiento del plan dentro de este mes (no cuenta inactivos). Útil para anticipar renovaciones.
      </p>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <Link
          href={`/reportes?month=${monthValue}`}
          style={{
            padding: "0.35rem 0.8rem",
            borderRadius: 999,
            fontSize: "0.8rem",
            textDecoration: "none",
            background: !validProgramFilter ? "#3d0f30" : "#f1f5f9",
            color: !validProgramFilter ? "#fff" : "#334155",
          }}
        >
          Todos
        </Link>
        {Object.entries(PROGRAM_LABEL).map(([value, label]) => (
          <Link
            key={value}
            href={`/reportes?month=${monthValue}&program=${value}`}
            style={{
              padding: "0.35rem 0.8rem",
              borderRadius: 999,
              fontSize: "0.8rem",
              textDecoration: "none",
              background: validProgramFilter === value ? "#3d0f30" : "#f1f5f9",
              color: validProgramFilter === value ? "#fff" : "#334155",
            }}
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="table-scroll" style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead>
            <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
              <th style={th}>Niño/a</th>
              <th style={th}>Programa</th>
              <th style={th}>Plan</th>
              <th style={th}>Vence</th>
              <th style={th}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {expiringSubscriptions.length === 0 && (
              <tr>
                <td colSpan={5} style={{ ...td, textAlign: "center", color: "#94a3b8" }}>
                  Ningún plan vence este mes.
                </td>
              </tr>
            )}
            {expiringSubscriptions.map((s) => {
              const effective = getEffectiveStatus(s.status, s.dueDate, today);
              const color = effective === "VENCIDO" ? "#dc2626" : "#166534";
              return (
                <tr key={s.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                  <td style={td}>
                    <Link href={`/clientes/${s.clientId}`} style={{ color: "#3d0f30", fontWeight: 600, textDecoration: "none" }}>
                      {s.client.fullName}
                    </Link>
                  </td>
                  <td style={td}>{PROGRAM_LABEL[s.program]}</td>
                  <td style={td}>{PLAN_LABEL[s.planType]}</td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>{s.dueDate.toLocaleDateString("es-CO")}</td>
                  <td style={{ ...td, color, fontWeight: 600 }}>{effective === "VENCIDO" ? "Ya vencido" : "Por vencer"}</td>
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
