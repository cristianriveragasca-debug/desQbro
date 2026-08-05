import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteClassGroup } from "./actions";
import { DAY_LABELS, PROGRAM_LABEL } from "@/lib/schedule";

export default async function ClasesPage() {
  const classGroups = await prisma.classGroup.findMany({
    include: { _count: { select: { enrollments: true } } },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

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

      <div style={{ marginTop: 24, background: "#fff", borderRadius: 12, overflow: "auto", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
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

const th: React.CSSProperties = { padding: "0.75rem 1rem", fontWeight: 600, color: "#334155" };
const td: React.CSSProperties = { padding: "0.75rem 1rem", color: "#3d0f30" };
