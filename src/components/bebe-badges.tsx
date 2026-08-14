import { BEBE_AREAS, BEBE_AREA_BADGE, BEBE_AREA_LABEL, type BebeAreaKey } from "@/lib/bebes-evaluation";

export function BebeBadges({ earned }: { earned: string[] }) {
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      {BEBE_AREAS.map((area) => {
        const has = earned.includes(area);
        return (
          <div
            key={area}
            title={has ? `Insignia ${BEBE_AREA_LABEL[area]} obtenida` : `Insignia ${BEBE_AREA_LABEL[area]} pendiente`}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              padding: "0.4rem 0.6rem",
              borderRadius: 10,
              background: has ? "#ffedd5" : "#f1f5f9",
              opacity: has ? 1 : 0.5,
              minWidth: 64,
            }}
          >
            <span style={{ fontSize: "1.4rem" }}>{BEBE_AREA_BADGE[area as BebeAreaKey]}</span>
            <span style={{ fontSize: "0.65rem", color: has ? "#9a3412" : "#94a3b8", fontWeight: 600 }}>{BEBE_AREA_LABEL[area]}</span>
          </div>
        );
      })}
    </div>
  );
}
