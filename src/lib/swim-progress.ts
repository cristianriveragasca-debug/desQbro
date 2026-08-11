export const SWIM_LEVELS = ["EXPLORACION", "DESARROLLO", "EXPERTOS", "EGRESADO"] as const;
export type SwimLevelValue = (typeof SWIM_LEVELS)[number];

export const SWIM_LEVEL_LABEL: Record<SwimLevelValue, string> = {
  EXPLORACION: "Exploración",
  DESARROLLO: "Desarrollo",
  EXPERTOS: "Expertos",
  EGRESADO: "Egresado",
};

export const SWIM_LEVEL_BADGE: Record<SwimLevelValue, string> = {
  EXPLORACION: "🌊",
  DESARROLLO: "🏊",
  EXPERTOS: "🥇",
  EGRESADO: "🏆",
};

export type SwimCriterion = { key: string; label: string };

// Criterios que se evalúan para PASAR del nivel actual al siguiente.
// EGRESADO no tiene criterios: es el nivel final, no hay transición posterior.
export const SWIM_CRITERIA: Record<SwimLevelValue, SwimCriterion[]> = {
  EXPLORACION: [
    { key: "flotacion_dorsal_8s", label: "Flotación dorsal 8 seg autónoma" },
    { key: "desplazamiento_10m", label: "Desplazamiento 10 m pateo libre" },
    { key: "inmersion_cabeza", label: "Inmersión cabeza completa voluntaria" },
    { key: "entrada_autonoma", label: "Entrada autónoma desde el borde" },
    { key: "interaccion_cooperativa", label: "Interacción cooperativa con pares" },
    { key: "concentracion_4min", label: "Concentración 4 min en consigna" },
  ],
  DESARROLLO: [
    { key: "crol_25m", label: "Crol 25 m con respiración bilateral" },
    { key: "espalda_25m", label: "Espalda 25 m posición correcta" },
    { key: "flotacion_dorsal_15s", label: "Flotación dorsal 15 seg autónoma" },
    { key: "apnea_8s_subacuatico", label: "Apnea 8 seg + nado subacuático 4 m" },
    { key: "viraje_crol", label: "Viraje de toque en crol" },
    { key: "liderazgo_actividad", label: "Liderazgo en al menos 1 actividad grupal" },
  ],
  EXPERTOS: [
    { key: "cuatro_estilos_25m", label: "4 estilos básicos 25 m c/u" },
    { key: "400m_continuos", label: "400 m continuos estilo libre" },
    { key: "apnea_dinamica_15m", label: "Apnea dinámica 15 m" },
    { key: "salida_bloque_viraje", label: "Salida de bloque + viraje encadenado" },
    { key: "mentoria_exploracion", label: "Mentoría a nivel Exploración" },
    { key: "portafolio_presentado", label: "Portafolio de aprendizaje presentado" },
  ],
  EGRESADO: [],
};

export const SWIM_TRANSITION_LABEL: Record<SwimLevelValue, string> = {
  EXPLORACION: "Exploración → Desarrollo",
  DESARROLLO: "Desarrollo → Expertos",
  EXPERTOS: "Egreso Nivel Expertos",
  EGRESADO: "—",
};

export function swimLevelIndex(level: SwimLevelValue): number {
  return SWIM_LEVELS.indexOf(level);
}

export function swimProgressPercent(level: SwimLevelValue): number {
  return (swimLevelIndex(level) / (SWIM_LEVELS.length - 1)) * 100;
}

export function nextSwimLevel(level: SwimLevelValue): SwimLevelValue | null {
  const idx = swimLevelIndex(level);
  return idx < SWIM_LEVELS.length - 1 ? SWIM_LEVELS[idx + 1] : null;
}

export function isChecklistChecked(checklist: unknown, key: string): boolean {
  if (!checklist || typeof checklist !== "object") return false;
  return (checklist as Record<string, boolean>)[key] === true;
}

export function countChecked(checklist: unknown, criteria: SwimCriterion[]): number {
  return criteria.filter((c) => isChecklistChecked(checklist, c.key)).length;
}
