import { prisma } from "@/lib/prisma";
import { createEvent, deleteEvent } from "./actions";
import { toDateInputValue } from "@/lib/dates";

const PROGRAM_LABEL: Record<string, string> = {
  DESQBRO_BEBES: "desQbro Bebés",
  DESQBRO_AQUA: "desQbro AQUA",
  GUAGUAS_SOCCER: "Güipas Soccer",
};

export default async function EventosPage() {
  const events = await prisma.specialEvent.findMany({ orderBy: { date: "asc" } });
  const today = new Date();

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Eventos especiales</h1>
      <p style={{ color: "#64748b" }}>Torneos, salidas y actividades puntuales que verán los padres en La Brújula.</p>

      <div className="two-col-stack" style={{ gridTemplateColumns: "1fr 1.4fr", marginTop: 24 }}>
        <div>
          <h2 style={{ fontSize: "1rem", marginTop: 0 }}>Nuevo evento</h2>
          <form
            action={createEvent}
            style={{ background: "#fff", padding: "1.25rem", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
          >
            <Field label="Título *">
              <input name="title" required style={input} placeholder="Ej: Torneo interclubes" />
            </Field>
            <Field label="Programa">
              <select name="program" defaultValue="" style={input}>
                <option value="">Todos los programas</option>
                {Object.entries(PROGRAM_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Fecha *">
              <input name="date" type="date" required defaultValue={toDateInputValue(today)} style={input} />
            </Field>
            <Field label="Descripción">
              <textarea name="description" style={{ ...input, minHeight: 70 }} />
            </Field>
            <button
              type="submit"
              style={{ background: "#ffc814", color: "#3d0f30", border: "none", padding: "0.7rem 1.25rem", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
            >
              Crear evento
            </button>
          </form>
        </div>

        <div>
          <h2 style={{ fontSize: "1rem", marginTop: 0 }}>Próximos y pasados</h2>
          <div className="table-scroll" style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                  <th style={th}>Fecha</th>
                  <th style={th}>Título</th>
                  <th style={th}>Programa</th>
                  <th style={th}></th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ ...td, textAlign: "center", color: "#94a3b8" }}>
                      Aún no hay eventos creados.
                    </td>
                  </tr>
                )}
                {events.map((e) => {
                  const past = e.date < today;
                  return (
                    <tr key={e.id} style={{ borderTop: "1px solid #e2e8f0", opacity: past ? 0.5 : 1 }}>
                      <td style={{ ...td, whiteSpace: "nowrap" }}>{e.date.toLocaleDateString("es-CO")}</td>
                      <td style={td}>
                        {e.title}
                        {e.description && <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{e.description}</div>}
                      </td>
                      <td style={td}>{e.program ? PROGRAM_LABEL[e.program] : "Todos"}</td>
                      <td style={{ ...td, textAlign: "right" }}>
                        <form action={deleteEvent}>
                          <input type="hidden" name="id" value={e.id} />
                          <button type="submit" style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "0.85rem" }}>
                            Eliminar
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ display: "block", fontSize: "0.85rem", marginBottom: 6, color: "#334155" }}>{label}</label>
      {children}
    </div>
  );
}

const input: React.CSSProperties = {
  width: "100%",
  padding: "0.6rem 0.75rem",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  fontSize: "0.95rem",
  boxSizing: "border-box",
  fontFamily: "inherit",
};
const th: React.CSSProperties = { padding: "0.75rem 1rem", fontWeight: 600, color: "#334155" };
const td: React.CSSProperties = { padding: "0.75rem 1rem", color: "#3d0f30" };
