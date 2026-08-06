import { prisma } from "@/lib/prisma";
import { saveAttendance } from "./actions";
import { DAY_LABELS, PROGRAM_LABEL } from "@/lib/schedule";
import { toDateInputValue } from "@/lib/dates";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "PRESENTE", label: "Presente" },
  { value: "AUSENTE", label: "Ausente" },
  { value: "JUSTIFICADO", label: "Justificado" },
];

export default async function AsistenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ classGroupId?: string; date?: string; saved?: string }>;
}) {
  const { classGroupId, date, saved } = await searchParams;
  const classGroups = await prisma.classGroup.findMany({ orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] });

  const selectedDate = date ?? toDateInputValue(new Date());
  const selectedGroup = classGroupId ? classGroups.find((g) => g.id === classGroupId) : undefined;

  let enrolledClients: { id: string; fullName: string }[] = [];
  let existingStatus: Record<string, string> = {};

  if (selectedGroup) {
    const enrollments = await prisma.enrollment.findMany({
      where: { classGroupId: selectedGroup.id },
      include: { client: { select: { id: true, fullName: true } } },
      orderBy: { client: { fullName: "asc" } },
    });
    enrolledClients = enrollments.map((e) => e.client);

    const dateObj = new Date(`${selectedDate}T00:00:00`);
    const session = await prisma.classSession.findUnique({
      where: { classGroupId_date: { classGroupId: selectedGroup.id, date: dateObj } },
      include: { attendances: true },
    });
    if (session) {
      existingStatus = Object.fromEntries(session.attendances.map((a) => [a.clientId, a.status]));
    }
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Asistencia</h1>
      <p style={{ color: "#64748b" }}>Selecciona una clase y una fecha para tomar asistencia.</p>

      <form method="get" style={{ display: "flex", gap: 12, alignItems: "flex-end", marginTop: 16, flexWrap: "wrap" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", marginBottom: 6, color: "#334155" }}>Clase</label>
          <select name="classGroupId" defaultValue={classGroupId ?? ""} style={selectStyle}>
            <option value="" disabled>
              Selecciona una clase
            </option>
            {classGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} — {DAY_LABELS[g.dayOfWeek]} {g.startTime}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", marginBottom: 6, color: "#334155" }}>Fecha</label>
          <input type="date" name="date" defaultValue={selectedDate} style={selectStyle} />
        </div>
        <button
          type="submit"
          style={{
            background: "#5c1a4a",
            color: "#fff",
            border: "none",
            padding: "0.6rem 1.25rem",
            borderRadius: 8,
            fontWeight: 700,
            cursor: "pointer",
            height: 40,
          }}
        >
          Ver clase
        </button>
      </form>

      {saved === "1" && (
        <div style={{ marginTop: 16, background: "#dcfce7", color: "#166534", padding: "0.75rem 1rem", borderRadius: 8, fontSize: "0.9rem" }}>
          Asistencia guardada correctamente.
        </div>
      )}

      {selectedGroup && (
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: "1.1rem" }}>
            {selectedGroup.name} · {PROGRAM_LABEL[selectedGroup.program]} · {selectedDate}
          </h2>

          {enrolledClients.length === 0 ? (
            <p style={{ color: "#94a3b8" }}>Esta clase no tiene alumnos inscritos.</p>
          ) : (
            <form action={saveAttendance}>
              <input type="hidden" name="classGroupId" value={selectedGroup.id} />
              <input type="hidden" name="date" value={selectedDate} />

              <div className="table-scroll" style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                      <th style={th}>Alumno</th>
                      {STATUS_OPTIONS.map((opt) => (
                        <th key={opt.value} style={{ ...th, textAlign: "center" }}>
                          {opt.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {enrolledClients.map((c) => (
                      <tr key={c.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                        <td style={td}>{c.fullName}</td>
                        {STATUS_OPTIONS.map((opt) => (
                          <td key={opt.value} style={{ ...td, textAlign: "center" }}>
                            <input
                              type="radio"
                              name={`status_${c.id}`}
                              value={opt.value}
                              defaultChecked={(existingStatus[c.id] ?? "PRESENTE") === opt.value}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="submit"
                style={{
                  marginTop: 16,
                  background: "#ffc814",
                  color: "#3d0f30",
                  border: "none",
                  padding: "0.7rem 1.25rem",
                  borderRadius: 8,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Guardar asistencia
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

const th: React.CSSProperties = { padding: "0.75rem 1rem", fontWeight: 600, color: "#334155" };
const td: React.CSSProperties = { padding: "0.75rem 1rem", color: "#3d0f30" };
const selectStyle: React.CSSProperties = {
  padding: "0.5rem 0.75rem",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  fontSize: "0.9rem",
  height: 40,
  boxSizing: "border-box",
};
