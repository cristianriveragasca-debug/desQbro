type Goal = { label: string; current: number; goal: number; color: string };

export function GoalProgressBars({ goals }: { goals: Goal[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
      {goals.map((g) => {
        const percent = Math.min(100, Math.round((g.current / g.goal) * 100));
        return (
          <div key={g.label} style={{ background: "#fff", borderRadius: 12, padding: "1.1rem 1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <span style={{ fontWeight: 600, color: "#3d0f30", fontSize: "0.9rem" }}>{g.label}</span>
              <span style={{ fontSize: "0.85rem", color: g.color, fontWeight: 700 }}>
                {g.current} / {g.goal}
              </span>
            </div>
            <div style={{ background: "#f1f5f9", borderRadius: 999, height: 12, overflow: "hidden" }}>
              <div style={{ width: `${percent}%`, background: g.color, height: "100%", borderRadius: 999, transition: "width 0.3s" }} />
            </div>
            <div style={{ textAlign: "right", fontSize: "0.75rem", color: "#94a3b8", marginTop: 4 }}>{percent}% de la meta</div>
          </div>
        );
      })}
    </div>
  );
}
