export type PathStep = { key: string; label: string; icon: string; reached: boolean };

export type PathTheme = {
  background: string;
  done: string;
  line: string;
  lockedLine: string;
  text: string;
};

export const PATH_THEMES: Record<"AQUA" | "BEBES" | "SOCCER", PathTheme> = {
  AQUA: { background: "linear-gradient(180deg, #e0f2fe 0%, #bae6fd 100%)", done: "#0369a1", line: "#0369a1", lockedLine: "#7dd3fc", text: "#075985" },
  BEBES: { background: "linear-gradient(180deg, #fff7ed 0%, #fed7aa 100%)", done: "#c2410c", line: "#c2410c", lockedLine: "#fdba74", text: "#9a3412" },
  SOCCER: { background: "linear-gradient(180deg, #f0fdf4 0%, #bbf7d0 100%)", done: "#166534", line: "#166534", lockedLine: "#86efac", text: "#14532d" },
};

const WIDTH = 600;
const HEIGHT = 140;
const R = 20;

export function ProgressPath({
  steps,
  theme,
  walker,
  caption,
}: {
  steps: PathStep[];
  theme: PathTheme;
  walker?: string;
  caption?: string;
}) {
  const n = steps.length;
  const points = steps.map((_, i) => ({
    x: n === 1 ? WIDTH / 2 : 50 + (i * (WIDTH - 100)) / (n - 1),
    y: i % 2 === 0 ? 88 : 48,
  }));

  const lastReached = steps.reduce((acc, s, i) => (s.reached ? i : acc), -1);
  const nextIdx = steps.findIndex((s) => !s.reached);

  return (
    <div style={{ background: theme.background, borderRadius: 14, padding: "0.75rem 0.5rem 0.5rem", marginTop: 10 }}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="Camino de progreso">
        {points.slice(0, -1).map((p, i) => {
          const q = points[i + 1];
          const mx = (p.x + q.x) / 2;
          const done = steps[i + 1].reached;
          return (
            <path
              key={i}
              d={`M ${p.x} ${p.y} C ${mx} ${p.y}, ${mx} ${q.y}, ${q.x} ${q.y}`}
              fill="none"
              stroke={done ? theme.line : theme.lockedLine}
              strokeWidth={done ? 6 : 4}
              strokeLinecap="round"
              strokeDasharray={done ? undefined : "2 9"}
            />
          );
        })}

        {steps.map((s, i) => {
          const { x, y } = points[i];
          const isNext = i === nextIdx;
          return (
            <g key={s.key}>
              {isNext && (
                <circle cx={x} cy={y} r={R} fill="none" stroke={theme.done} strokeWidth={3}>
                  <animate attributeName="r" values={`${R};${R + 7};${R}`} dur="1.6s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.9;0.15;0.9" dur="1.6s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                cx={x}
                cy={y}
                r={R}
                fill={s.reached ? theme.done : "#ffffff"}
                stroke={s.reached ? "#ffffff" : theme.lockedLine}
                strokeWidth={s.reached ? 3 : 2.5}
                strokeDasharray={s.reached ? undefined : "4 3"}
                opacity={s.reached || isNext ? 1 : 0.7}
              />
              <text
                x={x}
                y={y + 7}
                textAnchor="middle"
                fontSize={20}
                opacity={s.reached ? 1 : isNext ? 0.9 : 0.35}
              >
                {s.icon}
              </text>
              <text
                x={x}
                y={y + 38}
                textAnchor="middle"
                fontSize={12}
                fontWeight={s.reached || isNext ? 700 : 500}
                fill={s.reached || isNext ? theme.text : "#64748b"}
                stroke="#ffffff"
                strokeWidth={3}
                paintOrder="stroke"
                strokeLinejoin="round"
              >
                {s.label}
              </text>
              {walker && i === lastReached && (
                <text x={x} y={y - 26} textAnchor="middle" fontSize={22}>
                  {walker}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {caption && (
        <p style={{ textAlign: "center", margin: "2px 8px 6px", fontSize: "0.82rem", fontWeight: 700, color: theme.text }}>{caption}</p>
      )}
    </div>
  );
}
