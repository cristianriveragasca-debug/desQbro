import { SOCCER_AREAS, SOCCER_AREA_BADGE, SOCCER_AREA_LABEL, type SoccerAreaKey } from "@/lib/guipas-evaluation";

export function GuipasBadges({ earned }: { earned: string[] }) {
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      {SOCCER_AREAS.map((area) => {
        const has = earned.includes(area);
        return (
          <div
            key={area}
            title={has ? `Insignia ${SOCCER_AREA_LABEL[area]} obtenida` : `Insignia ${SOCCER_AREA_LABEL[area]} pendiente`}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              padding: "0.4rem 0.6rem",
              borderRadius: 10,
              background: has ? "#fef9c3" : "#f1f5f9",
              opacity: has ? 1 : 0.5,
              minWidth: 64,
            }}
          >
            <span style={{ fontSize: "1.4rem" }}>{SOCCER_AREA_BADGE[area as SoccerAreaKey]}</span>
            <span style={{ fontSize: "0.65rem", color: has ? "#854d0e" : "#94a3b8", fontWeight: 600 }}>{SOCCER_AREA_LABEL[area]}</span>
          </div>
        );
      })}
    </div>
  );
}
