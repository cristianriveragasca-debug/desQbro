import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeAge, formatAge } from "@/lib/dates";
import { getEffectiveStatus } from "@/lib/status";
import { DAY_LABELS } from "@/lib/schedule";
import { PROGRESS_BADGE, PROGRESS_LABEL, progressPercent } from "@/lib/progress";

const PROGRAM_LABEL: Record<string, string> = {
  DESQBRO_BEBES: "desQbro Bebés",
  DESQBRO_AQUA: "desQbro AQUA",
  GUAGUAS_SOCCER: "Güipas Soccer",
};
const PLAN_LABEL: Record<string, string> = {
  MENSUAL: "Mensual",
  TRIMESTRAL: "Trimestral",
  SEMESTRAL: "Semestral",
};
const STATUS_LABEL: Record<string, string> = { ACTIVO: "Activo", INACTIVO: "Inactivo", VENCIDO: "Vencido" };
const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  ACTIVO: { bg: "#dcfce7", fg: "#166534" },
  VENCIDO: { bg: "#fee2e2", fg: "#dc2626" },
  INACTIVO: { bg: "#f1f5f9", fg: "#64748b" },
};

function money(n: number) {
  return n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

export default async function BrujulaChildPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/brujula/login");

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      subscriptions: {
        include: { payments: { orderBy: { dueDate: "desc" } }, coachNotes: { orderBy: { date: "desc" } } },
        orderBy: { createdAt: "asc" },
      },
      enrollments: { include: { classGroup: true } },
      attendances: { include: { classSession: { include: { classGroup: true } } } },
    },
  });
  if (!client) notFound();
  if (client.parentAccountId !== userId) redirect("/brujula");

  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const attendanceMonth = client.attendances.filter((a) => a.classSession.date >= startOfMonth);
  const attendanceCount = (list: typeof client.attendances, status: string) => list.filter((a) => a.status === status).length;

  const programs = client.subscriptions.map((s) => s.program);
  const events = await prisma.specialEvent.findMany({
    where: { date: { gte: today }, OR: [{ program: null }, { program: { in: programs } }] },
    orderBy: { date: "asc" },
    take: 10,
  });

  return (
    <div>
      <Link href="/brujula" style={{ color: "#5c1a4a", fontSize: "0.85rem" }}>
        ← Ver otros hijos
      </Link>
      <h1 style={{ marginTop: 8, color: "#3d0f30" }}>{client.fullName}</h1>
      <p style={{ color: "#64748b" }}>{formatAge(computeAge(client.birthDate))}</p>

      {/* Programas y progreso */}
      <h2 style={sectionTitle}>Programas y progreso</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {client.subscriptions.map((sub) => {
          const effectiveStatus = getEffectiveStatus(sub.status, sub.dueDate, today);
          const statusColor = STATUS_COLOR[effectiveStatus];
          const nextPending = sub.payments.filter((p) => p.status === "PENDIENTE").sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0];

          return (
            <div key={sub.id} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <strong style={{ color: "#3d0f30" }}>{PROGRAM_LABEL[sub.program]}</strong>
                <span style={{ ...badge, background: statusColor.bg, color: statusColor.fg }}>{STATUS_LABEL[effectiveStatus]}</span>
              </div>
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "6px 0" }}>
                Plan {PLAN_LABEL[sub.planType]} · Próximo pago: {nextPending ? `${money(Number(nextPending.amount))} el ${nextPending.dueDate.toLocaleDateString("es-CO")}` : `al día (vence ${sub.dueDate.toLocaleDateString("es-CO")})`}
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
                <span style={{ fontSize: "1.5rem" }}>{PROGRESS_BADGE[sub.progressLevel]}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: 4 }}>{PROGRESS_LABEL[sub.progressLevel]}</div>
                  <div style={{ background: "#f1f5f9", borderRadius: 999, height: 8, overflow: "hidden" }}>
                    <div style={{ width: `${progressPercent(sub.progressLevel)}%`, background: "#ffc814", height: "100%", borderRadius: 999 }} />
                  </div>
                </div>
              </div>

              {sub.coachNotes.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#5c1a4a" }}>Comentarios del formador</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                    {sub.coachNotes.slice(0, 3).map((n) => (
                      <div key={n.id} style={{ background: "#f8fafc", borderRadius: 8, padding: "0.5rem 0.75rem" }}>
                        <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{n.date.toLocaleDateString("es-CO")}</div>
                        <div style={{ fontSize: "0.85rem", color: "#3d0f30" }}>{n.note}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {client.subscriptions.length === 0 && <p style={{ color: "#94a3b8" }}>Sin programas inscritos.</p>}
      </div>

      {/* Horario de clases */}
      <h2 style={sectionTitle}>Horario de clases</h2>
      <div style={card}>
        {client.enrollments.length === 0 ? (
          <p style={{ color: "#94a3b8", margin: 0, fontSize: "0.9rem" }}>Aún no está inscrito en ninguna clase.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {client.enrollments.map((e) => (
              <div key={e.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                <span style={{ color: "#3d0f30", fontWeight: 600 }}>{e.classGroup.name}</span>
                <span style={{ color: "#64748b" }}>
                  {DAY_LABELS[e.classGroup.dayOfWeek]} · {e.classGroup.startTime} - {e.classGroup.endTime}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Asistencia */}
      <h2 style={sectionTitle}>Asistencia</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        <div style={card}>
          <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Este mes — Presente</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#166534" }}>{attendanceCount(attendanceMonth, "PRESENTE")}</div>
        </div>
        <div style={card}>
          <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Este mes — Ausente</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#dc2626" }}>{attendanceCount(attendanceMonth, "AUSENTE")}</div>
        </div>
        <div style={card}>
          <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Este mes — Justificado</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#92400e" }}>{attendanceCount(attendanceMonth, "JUSTIFICADO")}</div>
        </div>
        <div style={card}>
          <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Acumulado — Presente</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#3d0f30" }}>{attendanceCount(client.attendances, "PRESENTE")}</div>
        </div>
      </div>

      {/* Facturación */}
      <h2 style={sectionTitle}>Facturación histórica</h2>
      <div className="table-scroll" style={{ ...card, padding: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
              <th style={th}>Concepto</th>
              <th style={th}>Valor</th>
              <th style={th}>Fecha</th>
              <th style={th}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {client.subscriptions.flatMap((s) => s.payments).length === 0 && (
              <tr>
                <td colSpan={4} style={{ ...td, textAlign: "center", color: "#94a3b8" }}>
                  Sin pagos registrados.
                </td>
              </tr>
            )}
            {client.subscriptions
              .flatMap((s) => s.payments.map((p) => ({ ...p, program: s.program })))
              .sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime())
              .map((p) => (
                <tr key={p.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                  <td style={td}>
                    {p.concept} <span style={{ color: "#94a3b8" }}>({PROGRAM_LABEL[p.program]})</span>
                  </td>
                  <td style={td}>{money(Number(p.amount))}</td>
                  <td style={td}>{(p.paidAt ?? p.dueDate).toLocaleDateString("es-CO")}</td>
                  <td style={td}>
                    <span style={{ ...badge, background: p.status === "PAGADO" ? "#dcfce7" : "#fef3c7", color: p.status === "PAGADO" ? "#166534" : "#92400e" }}>
                      {p.status === "PAGADO" ? "Pagado" : "Pendiente"}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Eventos especiales */}
      <h2 style={sectionTitle}>Próximas actividades</h2>
      <div style={card}>
        {events.length === 0 ? (
          <p style={{ color: "#94a3b8", margin: 0, fontSize: "0.9rem" }}>No hay actividades programadas por ahora.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {events.map((e) => (
              <div key={e.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 600, color: "#3d0f30", fontSize: "0.9rem" }}>{e.title}</div>
                  {e.description && <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{e.description}</div>}
                </div>
                <div style={{ fontSize: "0.85rem", color: "#5c1a4a", fontWeight: 600, whiteSpace: "nowrap" }}>
                  {e.date.toLocaleDateString("es-CO")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const sectionTitle: React.CSSProperties = { fontSize: "1.05rem", marginTop: 28, marginBottom: 12, color: "#3d0f30" };
const card: React.CSSProperties = { background: "#fff", borderRadius: 12, padding: "1.1rem 1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" };
const badge: React.CSSProperties = { padding: "0.2rem 0.6rem", borderRadius: 999, fontSize: "0.75rem", fontWeight: 600 };
const th: React.CSSProperties = { padding: "0.75rem 1rem", fontWeight: 600, color: "#334155" };
const td: React.CSSProperties = { padding: "0.75rem 1rem", color: "#3d0f30" };
