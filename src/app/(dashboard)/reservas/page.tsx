import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { computeAge, formatAge } from "@/lib/dates";
import { PROGRAM_LABEL } from "@/lib/schedule";
import { updateLeadStatus, deleteLead } from "./actions";

const PROGRAM_BADGE_COLOR: Record<string, { bg: string; fg: string }> = {
  DESQBRO_BEBES: { bg: "#ffedd5", fg: "#9a3412" },
  DESQBRO_AQUA: { bg: "#dbeafe", fg: "#0369a1" },
  GUAGUAS_SOCCER: { bg: "#dcfce7", fg: "#166534" },
};

const STATUS_LABEL: Record<string, string> = {
  NUEVO: "Nuevo",
  CONTACTADO: "Contactado",
  AGENDADO: "Agendado",
  DESCARTADO: "Descartado",
  CONVERTIDO: "Convertido",
};
const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  NUEVO: { bg: "#fef3c7", fg: "#92400e" },
  CONTACTADO: { bg: "#dbeafe", fg: "#1e40af" },
  AGENDADO: { bg: "#ede9fe", fg: "#6d28d9" },
  DESCARTADO: { bg: "#f1f5f9", fg: "#64748b" },
  CONVERTIDO: { bg: "#dcfce7", fg: "#166534" },
};

export default async function ReservasPage({ searchParams }: { searchParams: Promise<{ program?: string }> }) {
  const { program: programFilter } = await searchParams;
  const leads = await prisma.trialRequest.findMany({
    where: programFilter ? { program: programFilter as "DESQBRO_BEBES" | "DESQBRO_AQUA" | "GUAGUAS_SOCCER" } : undefined,
    orderBy: { createdAt: "desc" },
  });
  const today = new Date();

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Reservas · Clase de experiencia</h1>
      <p style={{ color: "#64748b" }}>Solicitudes de padres interesados en una clase de experiencia.</p>

      <div style={{ background: "#fff", borderRadius: 12, padding: "1rem 1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginTop: 16, maxWidth: 520 }}>
        <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>Comparte este enlace con los padres interesados:</p>
        <p style={{ fontSize: "0.95rem", color: "#5c1a4a", fontWeight: 700, margin: "6px 0 0", wordBreak: "break-all" }}>
          desqbro.online/reserva
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        <Link
          href="/reservas"
          style={{
            padding: "0.35rem 0.8rem",
            borderRadius: 999,
            fontSize: "0.8rem",
            textDecoration: "none",
            background: !programFilter ? "#3d0f30" : "#f1f5f9",
            color: !programFilter ? "#fff" : "#334155",
          }}
        >
          Todos
        </Link>
        {Object.entries(PROGRAM_LABEL).map(([value, label]) => (
          <Link
            key={value}
            href={`/reservas?program=${value}`}
            style={{
              padding: "0.35rem 0.8rem",
              borderRadius: 999,
              fontSize: "0.8rem",
              textDecoration: "none",
              background: programFilter === value ? "#3d0f30" : "#f1f5f9",
              color: programFilter === value ? "#fff" : "#334155",
            }}
          >
            {label}
          </Link>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
        {leads.length === 0 && (
          <p style={{ fontSize: "0.85rem", color: "#94a3b8", background: "#fff", borderRadius: 12, padding: "1rem" }}>
            Aún no hay reservas registradas.
          </p>
        )}
        {leads.map((lead) => {
          const statusColor = STATUS_COLOR[lead.status];
          const programColor = PROGRAM_BADGE_COLOR[lead.program];
          return (
            <div key={lead.id} style={{ background: "#fff", borderRadius: 12, padding: "1rem 1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <span style={{ background: programColor.bg, color: programColor.fg, padding: "0.15rem 0.55rem", borderRadius: 999, fontSize: "0.7rem", fontWeight: 700 }}>
                    {PROGRAM_LABEL[lead.program]}
                  </span>
                  <br />
                  <strong style={{ color: "#3d0f30" }}>{lead.babyName}</strong>
                  <span style={{ color: "#64748b", marginLeft: 8, fontSize: "0.85rem" }}>{formatAge(computeAge(lead.birthDate, today))}</span>
                  <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: 2 }}>
                    Acudiente: {lead.guardianName} · {lead.phone}
                    {lead.email ? ` · ${lead.email}` : ""}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: 2 }}>{lead.address}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <span style={{ background: statusColor.bg, color: statusColor.fg, padding: "0.2rem 0.6rem", borderRadius: 999, fontSize: "0.75rem", fontWeight: 600 }}>
                    {STATUS_LABEL[lead.status]}
                  </span>
                  <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{lead.createdAt.toLocaleDateString("es-CO")}</span>
                </div>
              </div>

              <form action={updateLeadStatus.bind(null, lead.id)} style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap", marginTop: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "#334155", marginBottom: 4 }}>Estado</label>
                  <select name="status" defaultValue={lead.status} style={{ padding: "0.4rem 0.6rem", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.85rem" }}>
                    {Object.entries(STATUS_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "#334155", marginBottom: 4 }}>Nota de seguimiento</label>
                  <input
                    name="notes"
                    defaultValue={lead.notes ?? ""}
                    placeholder="Ej: Llamé el martes, agendó para el sábado 10am"
                    style={{ width: "100%", padding: "0.4rem 0.6rem", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.85rem", boxSizing: "border-box" }}
                  />
                </div>
                <button
                  type="submit"
                  style={{ background: "#f1f5f9", border: "none", borderRadius: 6, padding: "0.4rem 0.8rem", fontSize: "0.8rem", cursor: "pointer", color: "#334155" }}
                >
                  Guardar
                </button>
                <button
                  type="submit"
                  formAction={deleteLead}
                  name="id"
                  value={lead.id}
                  style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "0.8rem" }}
                >
                  Eliminar
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
