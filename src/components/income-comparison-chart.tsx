const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const SERIES = [
  { key: "DESQBRO_BEBES", label: "desQbro Bebés", color: "#c2410c" },
  { key: "DESQBRO_AQUA", label: "desQbro AQUA", color: "#0369a1" },
  { key: "GUAGUAS_SOCCER", label: "Güipas Soccer", color: "#166534" },
] as const;

export function IncomeComparisonChart({ data }: { data: Record<string, number>[] }) {
  const maxValue = Math.max(1, ...data.flatMap((m) => SERIES.map((s) => m[s.key] ?? 0)));
  const width = 900;
  const height = 280;
  const padding = { top: 10, right: 10, bottom: 30, left: 60 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const monthSlot = plotWidth / data.length;
  const barWidth = monthSlot / (SERIES.length + 1.5);

  const yTicks = 4;
  const tickValues = Array.from({ length: yTicks + 1 }, (_, i) => (maxValue / yTicks) * i);

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", display: "block" }}>
        {tickValues.map((v, i) => {
          const y = padding.top + plotHeight - (v / maxValue) * plotHeight;
          return (
            <g key={i}>
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#e2e8f0" strokeWidth={1} />
              <text x={padding.left - 8} y={y + 4} fontSize={10} fill="#94a3b8" textAnchor="end">
                {v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${Math.round(v / 1000)}k`}
              </text>
            </g>
          );
        })}

        {data.map((m, monthIdx) => {
          const groupX = padding.left + monthIdx * monthSlot;
          return (
            <g key={monthIdx}>
              {SERIES.map((s, seriesIdx) => {
                const value = m[s.key] ?? 0;
                const barHeight = (value / maxValue) * plotHeight;
                const x = groupX + seriesIdx * (barWidth + 4) + monthSlot / 2 - (SERIES.length * (barWidth + 4)) / 2;
                const y = padding.top + plotHeight - barHeight;
                return <rect key={s.key} x={x} y={y} width={barWidth} height={barHeight} fill={s.color} rx={2} />;
              })}
              <text x={groupX + monthSlot / 2} y={height - padding.bottom + 16} fontSize={11} fill="#334155" textAnchor="middle">
                {MONTH_LABELS[monthIdx]}
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8, flexWrap: "wrap" }}>
        {SERIES.map((s) => (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "#334155" }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, display: "inline-block" }} />
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}
