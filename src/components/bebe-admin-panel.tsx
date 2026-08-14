import { updateBebeEvaluation } from "@/app/(dashboard)/clientes/brujula-actions";
import { BEBE_SKILLS, BEBE_STAGE_LABEL, BEBE_AREA_LABEL } from "@/lib/bebes-evaluation";
import { BebeBadges } from "@/components/bebe-badges";
import { BebeTrack } from "@/components/bebe-track";

type BebeSubscription = {
  id: string;
  babySkills: unknown;
  babyBadges: unknown;
  specialistNotes: string | null;
};

export function BebeAdminPanel({ subscription: sub, clientId }: { subscription: BebeSubscription; clientId: string }) {
  const skills = (sub.babySkills as Record<string, number> | null) ?? {};
  const badges = (sub.babyBadges as string[] | null) ?? [];

  return (
    <div style={{ marginTop: 12 }}>
      <BebeBadges earned={badges} />
      <BebeTrack skills={skills} />

      <details style={{ marginTop: 12 }}>
        <summary style={{ cursor: "pointer", fontSize: "0.8rem", color: "#c2410c", fontWeight: 600 }}>
          Formato de valoración
        </summary>

        <form
          action={updateBebeEvaluation.bind(null, sub.id, clientId)}
          style={{ marginTop: 10, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "0.9rem 1rem", display: "flex", flexDirection: "column", gap: 10 }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
            {BEBE_SKILLS.map((skill) => (
              <div key={skill.key}>
                <label style={{ ...label, fontSize: "0.75rem" }}>
                  {skill.label} <span style={{ color: "#94a3b8" }}>({BEBE_AREA_LABEL[skill.area]})</span>
                </label>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginBottom: 4 }}>{skill.description}</div>
                <select name={`skill_${skill.key}`} defaultValue={skills[skill.key] ?? 1} style={input}>
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl} · {BEBE_STAGE_LABEL[lvl]}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <p style={{ fontSize: "0.7rem", color: "#94a3b8", margin: 0 }}>
            Cuando todas las habilidades de un área llegan a Consolidado (5), se desbloquea la insignia de esa área.
          </p>
          <div>
            <label style={label}>Observaciones del especialista</label>
            <textarea name="specialistNotes" defaultValue={sub.specialistNotes ?? ""} style={{ ...input, minHeight: 80, fontFamily: "inherit" }} />
          </div>
          <button
            type="submit"
            style={{ background: "#c2410c", color: "#fff", border: "none", padding: "0.55rem 1rem", borderRadius: 8, fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", alignSelf: "flex-start" }}
          >
            Guardar valoración
          </button>
        </form>
      </details>
    </div>
  );
}

const label: React.CSSProperties = { display: "block", fontSize: "0.75rem", color: "#334155", marginBottom: 4 };
const input: React.CSSProperties = { padding: "0.4rem 0.6rem", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.85rem", boxSizing: "border-box", width: "100%" };
