import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { enrollClient, unenrollClient } from "../actions";
import { DAY_LABELS, PROGRAM_LABEL } from "@/lib/schedule";

export default async function ClaseDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const classGroup = await prisma.classGroup.findUnique({
    where: { id },
    include: { enrollments: { include: { client: true }, orderBy: { client: { fullName: "asc" } } } },
  });
  if (!classGroup) notFound();

  const enrolledIds = classGroup.enrollments.map((e) => e.clientId);
  const availableClients = await prisma.client.findMany({
    where: { id: { notIn: enrolledIds }, status: { not: "INACTIVO" } },
    orderBy: { fullName: "asc" },
  });

  return (
    <div>
      <Link href="/clases" style={{ color: "#5c1a4a", fontSize: "0.85rem" }}>
        ← Volver a clases
      </Link>
      <h1 style={{ marginTop: 8 }}>{classGroup.name}</h1>
      <p style={{ color: "#64748b" }}>
        {PROGRAM_LABEL[classGroup.program]} · {DAY_LABELS[classGroup.dayOfWeek]} · {classGroup.startTime} - {classGroup.endTime} · Cupo{" "}
        {classGroup.enrollments.length}/{classGroup.capacity}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 24 }}>
        <div>
          <h2 style={{ fontSize: "1rem" }}>Inscritos ({classGroup.enrollments.length})</h2>
          <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "hidden" }}>
            {classGroup.enrollments.length === 0 && (
              <div style={{ padding: "1rem", color: "#94a3b8", fontSize: "0.85rem" }}>Sin alumnos inscritos aún.</div>
            )}
            {classGroup.enrollments.map((e) => (
              <div
                key={e.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.75rem 1rem",
                  borderTop: "1px solid #e2e8f0",
                  fontSize: "0.9rem",
                }}
              >
                <span>{e.client.fullName}</span>
                <form action={unenrollClient}>
                  <input type="hidden" name="classGroupId" value={classGroup.id} />
                  <input type="hidden" name="clientId" value={e.clientId} />
                  <button
                    type="submit"
                    style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "0.85rem" }}
                  >
                    Quitar
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: "1rem" }}>Agregar alumno</h2>
          <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", padding: "1rem" }}>
            {availableClients.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: 0 }}>No hay clientes disponibles para inscribir.</p>
            ) : (
              <form action={enrollClient} style={{ display: "flex", gap: 8 }}>
                <input type="hidden" name="classGroupId" value={classGroup.id} />
                <select name="clientId" required style={{ flex: 1, padding: "0.5rem", borderRadius: 8, border: "1px solid #cbd5e1" }}>
                  {availableClients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({PROGRAM_LABEL[c.program]})
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  style={{
                    background: "#ffc814",
                    color: "#3d0f30",
                    border: "none",
                    padding: "0.5rem 1rem",
                    borderRadius: 8,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Inscribir
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
