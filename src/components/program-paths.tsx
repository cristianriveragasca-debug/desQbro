import { PATH_THEMES, ProgressPath, type PathStep } from "@/components/progress-path";
import { BebeBadges } from "@/components/bebe-badges";
import { BEBE_STAGE_LABEL, averageBebeLevel } from "@/lib/bebes-evaluation";
import { SOCCER_AREAS, SOCCER_AREA_BADGE, SOCCER_AREA_LABEL } from "@/lib/guipas-evaluation";
import {
  SWIM_CRITERIA,
  SWIM_LEVELS,
  SWIM_LEVEL_LABEL,
  countChecked,
  isChecklistChecked,
  nextSwimLevel,
  swimLevelIndex,
  type SwimLevelValue,
} from "@/lib/swim-progress";

const ISLAND_ICON: Record<SwimLevelValue, string> = {
  EXPLORACION: "🏝️",
  DESARROLLO: "🌴",
  EXPERTOS: "🐬",
  EGRESADO: "🏆",
};

export function AquaIslandPath({ level, checklist }: { level: SwimLevelValue; checklist: unknown }) {
  const currentIdx = swimLevelIndex(level);
  const steps: PathStep[] = SWIM_LEVELS.map((lvl, i) => ({
    key: lvl,
    label: lvl === "EGRESADO" ? "Egresado" : `Isla ${SWIM_LEVEL_LABEL[lvl]}`,
    icon: ISLAND_ICON[lvl],
    reached: i <= currentIdx,
  }));

  const criteria = SWIM_CRITERIA[level];
  const checked = countChecked(checklist, criteria);
  const next = nextSwimLevel(level);

  let caption: string;
  if (!next) {
    caption = "🏆 ¡Llegó a la última isla! Egresado del programa";
  } else {
    const needed = Math.max(0, 4 - checked);
    caption =
      needed <= 1
        ? `¡Le falta solo 1 criterio para llegar a la isla ${SWIM_LEVEL_LABEL[next]}!`
        : `Lleva ${checked} de 4 criterios para llegar a la isla ${SWIM_LEVEL_LABEL[next]}`;
  }

  return (
    <div>
      <ProgressPath steps={steps} theme={PATH_THEMES.AQUA} walker="🏊‍♂️" caption={caption} />
      {next && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#075985", marginBottom: 4 }}>Habilidades de esta isla</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {criteria.map((c) => {
              const done = isChecklistChecked(checklist, c.key);
              return (
                <span
                  key={c.key}
                  style={{
                    fontSize: "0.72rem",
                    padding: "0.2rem 0.55rem",
                    borderRadius: 999,
                    background: done ? "#dbeafe" : "#f1f5f9",
                    color: done ? "#075985" : "#94a3b8",
                    fontWeight: done ? 700 : 500,
                  }}
                >
                  {done ? "✔" : "○"} {c.label}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function BebeFootprintPath({ skills, badges }: { skills: Record<string, number>; badges: string[] }) {
  const level = averageBebeLevel(skills);
  const steps: PathStep[] = [1, 2, 3, 4, 5].map((stage) => ({
    key: String(stage),
    label: BEBE_STAGE_LABEL[stage],
    icon: stage === 5 ? "🌟" : "👣",
    reached: stage <= level,
  }));

  const caption =
    level >= 5
      ? "🌟 ¡Etapa Consolidado alcanzada!"
      : `Va en "${BEBE_STAGE_LABEL[level]}" — ¡el siguiente paso es "${BEBE_STAGE_LABEL[level + 1]}"!`;

  return (
    <div>
      <ProgressPath steps={steps} theme={PATH_THEMES.BEBES} walker="👶" caption={caption} />
      <div style={{ marginTop: 8 }}>
        <BebeBadges earned={badges} />
      </div>
    </div>
  );
}

export function SoccerFieldPath({ earned }: { earned: string[] }) {
  const earnedCount = SOCCER_AREAS.filter((a) => earned.includes(a)).length;
  const steps: PathStep[] = [
    ...SOCCER_AREAS.map((area) => ({
      key: area,
      label: SOCCER_AREA_LABEL[area],
      icon: SOCCER_AREA_BADGE[area],
      reached: earned.includes(area),
    })),
    { key: "TROFEO", label: "Trofeo", icon: "🏆", reached: earnedCount === SOCCER_AREAS.length },
  ];

  const remaining = SOCCER_AREAS.length - earnedCount;
  const caption =
    remaining === 0
      ? "🏆 ¡Completó todas las insignias!"
      : remaining === 1
        ? "¡Solo le falta 1 insignia para el trofeo!"
        : `Lleva ${earnedCount} de ${SOCCER_AREAS.length} insignias — ¡faltan ${remaining} para el trofeo!`;

  return <ProgressPath steps={steps} theme={PATH_THEMES.SOCCER} caption={caption} />;
}
