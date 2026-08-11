import { SWIM_LEVELS, SWIM_LEVEL_BADGE, SWIM_LEVEL_LABEL, swimLevelIndex, type SwimLevelValue } from "@/lib/swim-progress";

export function SwimTrack({ level }: { level: SwimLevelValue }) {
  const currentIdx = swimLevelIndex(level);
  const swimmerPercent = (currentIdx / (SWIM_LEVELS.length - 1)) * 100;

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
            background: "linear-gradient(90deg, #bae6fd, #38bdf8)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 0,
            width: `${swimmerPercent}%`,
            height: 6,
            borderRadius: 999,
            background: "#0369a1",
          }}
        />
        {SWIM_LEVELS.map((lvl, idx) => (
          <div
            key={lvl}
            title={SWIM_LEVEL_LABEL[lvl]}
            style={{
              position: "absolute",
              top: 8,
              left: `calc(${(idx / (SWIM_LEVELS.length - 1)) * 100}% - 11px)`,
              width: 22,
              height: 22,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: idx <= currentIdx ? "1rem" : "0.85rem",
              background: idx <= currentIdx ? "#fff" : "#f1f5f9",
              border: idx <= currentIdx ? "2px solid #0369a1" : "2px solid #e2e8f0",
              opacity: idx <= currentIdx ? 1 : 0.5,
            }}
          >
            {SWIM_LEVEL_BADGE[lvl]}
          </div>
        ))}
        <div
          style={{
            position: "absolute",
            top: -6,
            left: `calc(${swimmerPercent}% - 12px)`,
            fontSize: "1.4rem",
            transition: "left 0.3s",
          }}
        >
          🏊‍♂️
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", margin: "2px 10px 0" }}>
        {SWIM_LEVELS.map((lvl, idx) => (
          <span key={lvl} style={{ fontSize: "0.65rem", color: idx <= currentIdx ? "#0369a1" : "#94a3b8", fontWeight: idx === currentIdx ? 700 : 400 }}>
            {SWIM_LEVEL_LABEL[lvl]}
          </span>
        ))}
      </div>
    </div>
  );
}
