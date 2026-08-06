import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteClassGroup } from "./actions";
import { DAY_LABELS, PROGRAM_LABEL } from "@/lib/schedule";

// DAY_LABELS[0] = Domingo (coincide con dayOfWeek guardado). Para mostrar
// el calendario de lunes a domingo, solo reordenamos el orden de recorrido.
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

function occupancyColor(enrolled: number, capacity: number) {
  const ratio = capacity > 0 ? enrolled / capacity : 0;
  if (ratio >= 1) return { bg: "#fee2e2", fg: "#dc2626", border: "#fca5a5" };
  if (ratio >= 0.7) return { bg: "#fef3c7", fg: "#92400e", border: "#fcd34d" };
  return { bg: "#dcfce7", fg: "#166534", border: "#86efac" };
}

export default async function ClasesPage() {
  const classGroups = await prisma.classGroup.findMany({
    include: { _count: { select: { enrollments: true } } },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  const byDay: Record<number, typeof classGroups> = {};
  for (const g of classGroups) {
    (byDay[g.dayOfWeek] ??= []).push(g);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Agendamiento de Clases</h1>
        <Link
          href="/clases/nuevo"
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
          + Nueva clase
        </Link>
      </div>

      <h2 style={{ fontSize: "1rem", marginTop: 24 }}>Calendario semanal</h2>
      <div
        style={{
          marginTop: 12,
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(140px, 1fr))",
          gap: 12,
          overflowX: "auto",
        }}
      >
        {WEEK_ORDER.map((dayIdx) => (
          <div key={dayIdx} style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", minHeight: 120 }}>
            <div
              style={{
                background: "#5c1a4a",
                color: "#fff",
                fontSize: "0.8rem",
                fontWeight: 700,
                padding: "0.5rem",
                borderRadius: "12px 12px 0 0",
                textAlign: "center",
              }}
            >
              {DAY_LABELS[dayIdx]}
            </div>
            <div style={{ padding: "0.5rem", display: "flex", flexDirection: "column", gap: 6 }}>
              {(byDay[dayIdx] ?? []).length === 0 && (
                <div style={{ fontSize: "0.75rem", color: "#cbd5e1", textAlign: "center", padding: "0.5rem 0" }}>—</div>
              )}
              {(byDay[dayIdx] ?? []).map((g) => {
                const enrolled = g._count.enrollments;
                const color = occupancyColor(enrolled, g.capacity);
                return (
                  <Link
                    key={g.id}
                    href={`/clases/${g.id}`}
                    style={{
                      display: "block",
                      background: color.bg,
                      border: `1px solid ${color.border}`,
                      borderRadius: 8,
                      padding: "0.4rem 0.5rem",
                      textDecoration: "none",
                    }}
                  >
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#3d0f30" }}>{g.name}</div>
                    <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
                      {g.startTime} - {g.endTime}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#64748b" }}>{PROGRAM_LABEL[g.program]}</div>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: color.fg, marginTop: 2 }}>
                      {enrolled} / {g.capacity} cupos
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: "0.75rem", color: "#64748b" }}>
        <LegendDot color="#166534" bg="#dcfce7" label="Disponible" />
        <LegendDot color="#92400e" bg="#fef3c7" label="Casi lleno (≥70%)" />
        <LegendDot color="#dc2626" bg="#fee2e2" label="Cupo lleno" />
      </div>

      <h2 style={{ fontSize: "1rem", marginTop: 32 }}>Administrar clases</h2>
      <div className="table-scroll" style={{ marginTop: 12, background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
              <th style={th}>Clase</th>
              <th style={th}>Programa</th>
              <th style={th}>Día</th>
              <th style={th}>Horario</th>
              <th style={th}>Inscritos</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {classGroups.length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...td, textAlign: "center", color: "#94a3b8" }}>
                  Aún no hay clases creadas.
                </td>
              </tr>
            )}
            {classGroups.map((g) => (
              <tr key={g.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                <td style={td}>
                  <Link href={`/clases/${g.id}`} style={{ color: "#5c1a4a", fontWeight: 600 }}>
                    {g.name}
                  </Link>
                </td>
                <td style={td}>{PROGRAM_LABEL[g.program]}</td>
                <td style={td}>{DAY_LABELS[g.dayOfWeek]}</td>
                <td style={td}>
                  {g.startTime} - {g.endTime}
                </td>
                <td style={td}>
                  {g._count.enrollments} / {g.capacity}
                </td>
                <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                  <Link href={`/clases/${g.id}/editar`} style={{ color: "#5c1a4a", fontWeight: 600, marginRight: 12, fontSize: "0.85rem" }}>
                    Editar
                  </Link>
                  <form action={deleteClassGroup} style={{ display: "inline" }}>
                    <input type="hidden" name="id" value={g.id} />
                    <button
                      type="submit"
                      style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "0.85rem" }}
                    >
                      Eliminar
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LegendDot({ color, bg, label }: { color: string; bg: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 10, height: 10, borderRadius: 999, background: bg, border: `1px solid ${color}` }} />
      {label}
    </div>
  );
}

const th: React.CSSProperties = { padding: "0.75rem 1rem", fontWeight: 600, color: "#334155" };
const td: React.CSSProperties = { padding: "0.75rem 1rem", color: "#3d0f30" };
