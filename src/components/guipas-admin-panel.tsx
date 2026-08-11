import { addMonthlyEvaluation, addPortfolioMoment, deletePortfolioMoment, saveClosingLetter } from "@/app/(dashboard)/clientes/brujula-actions";
import { toDateInputValue } from "@/lib/dates";
import { SOCCER_SKILLS, SOCCER_LEVEL_LABEL, SOCCER_AREA_LABEL } from "@/lib/guipas-evaluation";
import { GuipasBadges } from "@/components/guipas-badges";

type MonthlyEvaluation = {
  id: string;
  month: Date;
  skills: unknown;
  sessionsAttended: number;
  sessionsTotal: number;
  strength: string;
  focusArea: string;
  specialNote: string | null;
  nextGoal: string;
  parentPhrase: string;
};

type PortfolioMoment = {
  id: string;
  date: Date;
  title: string;
  description: string | null;
};

type GuipasSubscription = {
  id: string;
  soccerBadges: unknown;
  closingLetter: string | null;
  monthlyEvaluations: MonthlyEvaluation[];
  portfolioMoments: PortfolioMoment[];
};

function monthInputValue(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function GuipasAdminPanel({ subscription: sub, clientId }: { subscription: GuipasSubscription; clientId: string }) {
  const badges = (sub.soccerBadges as string[] | null) ?? [];
  const currentMonth = monthInputValue(new Date());

  return (
    <div style={{ marginTop: 12 }}>
      <GuipasBadges earned={badges} />

      <details style={{ marginTop: 12 }}>
        <summary style={{ cursor: "pointer", fontSize: "0.8rem", color: "#166534", fontWeight: 600 }}>
          Ficha de observación mensual ({sub.monthlyEvaluations.length})
        </summary>

        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          {sub.monthlyEvaluations.length === 0 && <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: 0 }}>Sin fichas registradas aún.</p>}
          {sub.monthlyEvaluations.map((ev) => (
            <div key={ev.id} style={{ background: "#f8fafc", borderRadius: 8, padding: "0.6rem 0.8rem" }}>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                {ev.month.toLocaleDateString("es-CO", { year: "numeric", month: "long" })} · Asistencia: {ev.sessionsAttended}/{ev.sessionsTotal}
              </div>
              <div style={{ fontSize: "0.85rem", color: "#3d0f30", marginTop: 4 }}>
                <strong>Floreció:</strong> {ev.strength}
              </div>
              <div style={{ fontSize: "0.85rem", color: "#3d0f30" }}>
                <strong>Construyendo:</strong> {ev.focusArea}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#5c1a4a", marginTop: 4, fontStyle: "italic" }}>&ldquo;{ev.parentPhrase}&rdquo;</div>
            </div>
          ))}
        </div>

        <form
          action={addMonthlyEvaluation.bind(null, sub.id, clientId)}
          style={{ marginTop: 14, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "0.9rem 1rem", display: "flex", flexDirection: "column", gap: 10 }}
        >
          <div className="form-row">
            <div>
              <label style={label}>Mes</label>
              <input name="month" type="month" required defaultValue={currentMonth} style={input} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div>
                <label style={label}>Sesiones asistidas</label>
                <input name="sessionsAttended" type="number" min={0} required style={{ ...input, width: 90 }} />
              </div>
              <div>
                <label style={label}>Sesiones totales</label>
                <input name="sessionsTotal" type="number" min={0} required style={{ ...input, width: 90 }} />
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#166534", marginBottom: 6 }}>
              Escala de observación (10 habilidades, 4 niveles)
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
              {SOCCER_SKILLS.map((skill) => (
                <div key={skill.key}>
                  <label style={{ ...label, fontSize: "0.75rem" }}>
                    {skill.label} <span style={{ color: "#94a3b8" }}>({SOCCER_AREA_LABEL[skill.area]})</span>
                  </label>
                  <select name={`skill_${skill.key}`} defaultValue="1" style={input}>
                    {[1, 2, 3, 4].map((lvl) => (
                      <option key={lvl} value={lvl} title={skill.levels[lvl - 1]}>
                        {lvl} · {SOCCER_LEVEL_LABEL[lvl]}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <p style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: 4 }}>
              Cuando las habilidades de un área llegan todas a Consolidado, se desbloquea la insignia de esa área.
            </p>
          </div>

          <div>
            <label style={label}>Fortaleza del mes</label>
            <input name="strength" required placeholder="Ej: Completó el circuito de 4 pasos sin repetición de instrucciones" style={input} />
          </div>
          <div>
            <label style={label}>Área de atención</label>
            <input name="focusArea" required placeholder="Ej: Seguimos trabajando en la flexibilidad cognitiva ante cambios" style={input} />
          </div>
          <div>
            <label style={label}>Observación especial (opcional)</label>
            <input name="specialNote" placeholder="Cambios notables, señales de alerta, contexto familiar..." style={input} />
          </div>
          <div>
            <label style={label}>Objetivo próximo ciclo</label>
            <input name="nextGoal" required placeholder="Habilidad a priorizar el próximo mes" style={input} />
          </div>
          <div>
            <label style={label}>Frase para padres</label>
            <input name="parentPhrase" required placeholder='Ej: "Sofía es una niña que piensa dos veces antes de actuar..."' style={input} />
          </div>

          <button
            type="submit"
            style={{ background: "#166534", color: "#fff", border: "none", padding: "0.55rem 1rem", borderRadius: 8, fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", alignSelf: "flex-start" }}
          >
            Guardar ficha del mes
          </button>
        </form>
      </details>

      <details style={{ marginTop: 8 }}>
        <summary style={{ cursor: "pointer", fontSize: "0.8rem", color: "#166534", fontWeight: 600 }}>
          Portafolio · momentos significativos ({sub.portfolioMoments.length})
        </summary>
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
          {sub.portfolioMoments.length === 0 && <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: 0 }}>Sin momentos registrados aún.</p>}
          {sub.portfolioMoments.map((m) => (
            <div key={m.id} style={{ background: "#f8fafc", borderRadius: 8, padding: "0.5rem 0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{m.date.toLocaleDateString("es-CO")}</span>
                <form action={deletePortfolioMoment}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="clientId" value={clientId} />
                  <button type="submit" style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "0.75rem" }}>
                    Eliminar
                  </button>
                </form>
              </div>
              <p style={{ fontSize: "0.85rem", color: "#3d0f30", margin: "4px 0 0", fontWeight: 600 }}>{m.title}</p>
              {m.description && <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "2px 0 0" }}>{m.description}</p>}
            </div>
          ))}
        </div>

        <form
          action={addPortfolioMoment.bind(null, sub.id, clientId)}
          style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap", marginTop: 12 }}
        >
          <div>
            <label style={label}>Fecha</label>
            <input name="date" type="date" required defaultValue={toDateInputValue(new Date())} style={input} />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={label}>Título</label>
            <input name="title" required placeholder="Ej: Primer pase intencional a un compañero" style={{ ...input, width: "100%" }} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={label}>Descripción (opcional)</label>
            <input name="description" style={{ ...input, width: "100%" }} />
          </div>
          <button type="submit" style={{ background: "#ffc814", color: "#3d0f30", border: "none", padding: "0.45rem 0.9rem", borderRadius: 6, fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
            Agregar momento
          </button>
        </form>
      </details>

      <details style={{ marginTop: 8 }}>
        <summary style={{ cursor: "pointer", fontSize: "0.8rem", color: "#166534", fontWeight: 600 }}>Carta de cierre del entrenador</summary>
        <form action={saveClosingLetter.bind(null, sub.id, clientId)} style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
          <textarea
            name="closingLetter"
            defaultValue={sub.closingLetter ?? ""}
            placeholder="Escribe directamente al niño: quién es, cómo creció, qué se lleva consigo..."
            style={{ ...input, minHeight: 140, fontFamily: "inherit" }}
          />
          <button type="submit" style={{ background: "#166534", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: 8, fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", alignSelf: "flex-start" }}>
            Guardar carta
          </button>
        </form>
      </details>
    </div>
  );
}

const label: React.CSSProperties = { display: "block", fontSize: "0.75rem", color: "#334155", marginBottom: 4 };
const input: React.CSSProperties = { padding: "0.4rem 0.6rem", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.85rem", boxSizing: "border-box", width: "100%" };
