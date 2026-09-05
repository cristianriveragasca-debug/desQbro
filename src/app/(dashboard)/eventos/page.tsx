import { prisma } from "@/lib/prisma";
import { createEvent, deleteEvent, updateEventCallUps } from "./actions";
import { toDateInputValue } from "@/lib/dates";

const PROGRAM_LABEL: Record<string, string> = {
  DESQBRO_BEBES: "desQbro Bebés",
  DESQBRO_AQUA: "desQbro AQUA",
  GUAGUAS_SOCCER: "Güipas Soccer",
};

export default async function EventosPage() {
  const [events, soccerClients] = await Promise.all([
    prisma.specialEvent.findMany({ orderBy: { date: "asc" }, include: { callUps: { include: { client: true } } } }),
    prisma.client.findMany({
      where: { subscriptions: { some: { program: "GUAGUAS_SOCCER" } } },
      orderBy: { fullName: "asc" },
    }),
  ]);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Eventos especiales</h1>
      <p style={{ color: "#64748b" }}>Torneos, salidas, partidos y actividades puntuales que verán los padres en La Brújula.</p>

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

            <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" name="isMatch" id="isMatch" style={{ width: 16, height: 16 }} />
              <label htmlFor="isMatch" style={{ fontSize: "0.85rem", color: "#334155" }}>
                Es un partido de Güipas Soccer
              </label>
            </div>

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

            <Field label="Niños convocados (solo si es partido)">
              <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid #cbd5e1", borderRadius: 8, padding: "0.5rem 0.75rem" }}>
                {soccerClients.length === 0 && <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: 0 }}>No hay niños inscritos en Güipas Soccer.</p>}
                {soccerClients.map((c) => (
                  <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", padding: "0.2rem 0" }}>
                    <input type="checkbox" name="callUpClientId" value={c.id} style={{ width: 14, height: 14 }} />
                    {c.fullName}
                  </label>
                ))}
              </div>
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
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {events.length === 0 && (
              <p style={{ fontSize: "0.85rem", color: "#94a3b8", background: "#fff", borderRadius: 12, padding: "1rem" }}>
                Aún no hay eventos creados.
              </p>
            )}
            {events.map((e) => {
              const past = e.date < startOfToday;
              return (
                <div key={e.id} style={{ background: "#fff", borderRadius: 12, padding: "1rem 1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", opacity: past ? 0.6 : 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontWeight: 600, color: "#3d0f30" }}>
                        {e.isMatch && <span style={{ marginRight: 6 }}>⚽</span>}
                        {e.title}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                        {e.date.toLocaleDateString("es-CO")} · {e.isMatch ? "Partido Güipas Soccer" : e.program ? PROGRAM_LABEL[e.program] : "Todos"}
                      </div>
                      {e.description && <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: 4 }}>{e.description}</div>}
                    </div>
                    <form action={deleteEvent}>
                      <input type="hidden" name="id" value={e.id} />
                      <button type="submit" style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "0.8rem" }}>
                        Eliminar
                      </button>
                    </form>
                  </div>

                  {e.isMatch && (
                    <details style={{ marginTop: 10 }}>
                      <summary style={{ cursor: "pointer", fontSize: "0.8rem", color: "#5c1a4a", fontWeight: 600 }}>
                        Convocados ({e.callUps.length})
                      </summary>
                      <form action={updateEventCallUps.bind(null, e.id)} style={{ marginTop: 8 }}>
                        <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: 8, padding: "0.5rem 0.75rem" }}>
                          {soccerClients.map((c) => {
                            const checked = e.callUps.some((cu) => cu.clientId === c.id);
                            return (
                              <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", padding: "0.2rem 0" }}>
                                <input type="checkbox" name="callUpClientId" value={c.id} defaultChecked={checked} style={{ width: 14, height: 14 }} />
                                {c.fullName}
                              </label>
                            );
                          })}
                        </div>
                        <button
                          type="submit"
                          style={{ marginTop: 8, background: "#f1f5f9", border: "none", borderRadius: 6, padding: "0.35rem 0.8rem", fontSize: "0.8rem", cursor: "pointer", color: "#334155" }}
                        >
                          Guardar convocados
                        </button>
                      </form>
                    </details>
                  )}
                </div>
              );
            })}
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
