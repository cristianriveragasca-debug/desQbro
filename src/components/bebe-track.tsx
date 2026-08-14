import { BEBE_STAGE_LABEL, averageBebeLevel } from "@/lib/bebes-evaluation";

export function BebeTrack({ skills }: { skills: Record<string, number> }) {
  const level = averageBebeLevel(skills);
  const percent = ((level - 1) / 4) * 100;
  const stops = [1, 2, 3, 4, 5];

  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ position: "relative", height: 36, margin: "0 10px" }}>
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 0,
            right: 0,
            height: 6,
            borderRadius: 999,
            background: "linear-gradient(90deg, #fde68a, #fb923c)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 0,
            width: `${percent}%`,
            height: 6,
            borderRadius: 999,
            background: "#c2410c",
          }}
        />
        {stops.map((stop, idx) => (
          <div
            key={stop}
            title={BEBE_STAGE_LABEL[stop]}
            style={{
              position: "absolute",
              top: 8,
              left: `calc(${(idx / (stops.length - 1)) * 100}% - 11px)`,
              width: 22,
              height: 22,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.7rem",
              fontWeight: 700,
              background: stop <= level ? "#fff" : "#f1f5f9",
              border: stop <= level ? "2px solid #c2410c" : "2px solid #e2e8f0",
              color: stop <= level ? "#c2410c" : "#94a3b8",
              opacity: stop <= level ? 1 : 0.6,
            }}
          >
            {stop}
          </div>
        ))}
        <div
          style={{
            position: "absolute",
            top: -6,
            left: `calc(${percent}% - 12px)`,
            fontSize: "1.4rem",
            transition: "left 0.3s",
          }}
        >
          👶
        </div>
      </div>
      <div style={{ textAlign: "center", marginTop: 2, fontSize: "0.75rem", color: "#c2410c", fontWeight: 700 }}>
        {BEBE_STAGE_LABEL[level]}
      </div>
    </div>
  );
}
