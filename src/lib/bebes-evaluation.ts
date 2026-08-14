export type BebeAreaKey = "COGNITIVA" | "SOCIAL" | "MOTRIZ";

export const BEBE_AREAS: BebeAreaKey[] = ["COGNITIVA", "SOCIAL", "MOTRIZ"];

export const BEBE_AREA_LABEL: Record<BebeAreaKey, string> = {
  COGNITIVA: "Cognitiva",
  SOCIAL: "Social",
  MOTRIZ: "Motriz",
};

export const BEBE_AREA_BADGE: Record<BebeAreaKey, string> = {
  COGNITIVA: "🧠",
  SOCIAL: "🤝",
  MOTRIZ: "🏊",
};

export type BebeSkill = { key: string; label: string; description: string; area: BebeAreaKey };

export const BEBE_SKILLS: BebeSkill[] = [
  {
    key: "concentracion",
    label: "Concentración",
    description: "Capacidad de escucha activa y seguimiento de instrucciones.",
    area: "COGNITIVA",
  },
  {
    key: "interaccion",
    label: "Interacción con los demás",
    description: "Nivel de socialización, conexión y respeto con el padre o cuidadora.",
    area: "SOCIAL",
  },
  {
    key: "entrada_agua",
    label: "Entrada al Agua",
    description: "Seguridad y autonomía en el ingreso a la piscina.",
    area: "MOTRIZ",
  },
  {
    key: "flotacion",
    label: "Flotación",
    description: "Control corporal y equilibrio hidrostático.",
    area: "MOTRIZ",
  },
  {
    key: "desplazamiento",
    label: "Desplazamiento",
    description: "Habilidad de locomoción y coordinación en el agua.",
    area: "MOTRIZ",
  },
  {
    key: "inmersiones",
    label: "Pequeñas Inmersiones",
    description: "Gestión de la apnea y confianza bajo la superficie.",
    area: "MOTRIZ",
  },
];

export const BEBE_STAGE_LABEL = ["", "Inicial", "En desarrollo", "Practicando", "Avanzando", "Consolidado"];

export function skillsByBebeArea(area: BebeAreaKey): BebeSkill[] {
  return BEBE_SKILLS.filter((s) => s.area === area);
}

export function isBebeAreaConsolidated(skills: Record<string, number>, area: BebeAreaKey): boolean {
  const areaSkills = skillsByBebeArea(area);
  return areaSkills.length > 0 && areaSkills.every((s) => (skills[s.key] ?? 0) >= 5);
}

export function computeBebeEarnedBadges(skills: Record<string, number>): BebeAreaKey[] {
  return BEBE_AREAS.filter((area) => isBebeAreaConsolidated(skills, area));
}

export function mergeBebeBadges(existing: string[], newlyEarned: BebeAreaKey[]): string[] {
  const set = new Set(existing);
  newlyEarned.forEach((b) => set.add(b));
  return Array.from(set);
}

export function averageBebeLevel(skills: Record<string, number>): number {
  const values = BEBE_SKILLS.map((s) => skills[s.key] ?? 1);
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round(sum / values.length);
}

export function bebeProgressPercent(skills: Record<string, number>): number {
  const level = averageBebeLevel(skills);
  return ((level - 1) / 4) * 100;
}
