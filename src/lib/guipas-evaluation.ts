export type SoccerAreaKey = "MOTRIZ" | "COGNITIVA" | "EMOCIONAL" | "SOCIAL";

export const SOCCER_AREAS: SoccerAreaKey[] = ["MOTRIZ", "COGNITIVA", "EMOCIONAL", "SOCIAL"];

export const SOCCER_AREA_LABEL: Record<SoccerAreaKey, string> = {
  MOTRIZ: "Motriz",
  COGNITIVA: "Cognitiva",
  EMOCIONAL: "Emocional",
  SOCIAL: "Social",
};

export const SOCCER_AREA_BADGE: Record<SoccerAreaKey, string> = {
  MOTRIZ: "⚽",
  COGNITIVA: "🧠",
  EMOCIONAL: "❤️",
  SOCIAL: "🤝",
};

export type SoccerSkill = { key: string; label: string; area: SoccerAreaKey; levels: [string, string, string, string] };

export const SOCCER_SKILLS: SoccerSkill[] = [
  {
    key: "control_inhibitorio",
    label: "Control inhibitorio",
    area: "COGNITIVA",
    levels: [
      "No frena ante señales incluso con práctica repetida",
      "Frena con retraso o de forma inconsistente",
      "Frena la mayoría de las veces con señal clara",
      "Frena consistentemente, incluso ante señales rápidas",
    ],
  },
  {
    key: "memoria_trabajo",
    label: "Memoria de trabajo",
    area: "COGNITIVA",
    levels: [
      "No recuerda instrucciones de 1 paso sin repetición",
      "Recuerda 1-2 pasos con apoyo visual",
      "Recuerda secuencia de 2-3 pasos autónomamente",
      "Recuerda 3-4 pasos y adapta si hay cambios",
    ],
  },
  {
    key: "flexibilidad_cognitiva",
    label: "Flexibilidad cognitiva",
    area: "COGNITIVA",
    levels: [
      "Resistencia intensa a cualquier cambio de actividad o rol",
      "Acepta cambios con apoyo del entrenador",
      "Cambia de rol con señal previa sin resistencia notable",
      "Cambia de perspectiva y rol fluidamente en el juego",
    ],
  },
  {
    key: "coordinacion_oculopedal",
    label: "Coordinación óculo-pedal",
    area: "MOTRIZ",
    levels: [
      "No contacta el balón en movimiento",
      "Contacta balón lento con pie dominante",
      "Coordina con balón moderado, pie dominante",
      "Coordina con ambos pies, diferentes velocidades",
    ],
  },
  {
    key: "equilibrio_dinamico",
    label: "Equilibrio dinámico",
    area: "MOTRIZ",
    levels: [
      "Cae frecuentemente al caminar en circuitos simples",
      "Completa circuitos con pausas para equilibrarse",
      "Completa circuitos con fluidez moderada",
      "Equilibrio sólido en circuitos complejos y con balón",
    ],
  },
  {
    key: "regulacion_emocional",
    label: "Regulación emocional",
    area: "EMOCIONAL",
    levels: [
      "Crisis frecuentes sin recuperación en la sesión",
      "Crisis ocasionales, recuperación con apoyo adulto",
      "Maneja frustraciones menores, busca apoyo en mayores",
      "Autorregula emociones básicas, nombra lo que siente",
    ],
  },
  {
    key: "vocabulario_emocional",
    label: "Vocabulario emocional",
    area: "EMOCIONAL",
    levels: [
      "No nombra ninguna emoción propia",
      "Nombra 1-2 emociones básicas (bien/mal)",
      "Usa 3-5 palabras emocionales con contexto",
      "Vocabulario emocional variado, describe sensaciones",
    ],
  },
  {
    key: "juego_social",
    label: "Juego social",
    area: "SOCIAL",
    levels: [
      "Juego exclusivamente solitario, evita interacción",
      "Juego paralelo, observa a los pares sin interactuar",
      "Interacción espontánea ocasional con pares",
      "Cooperación sostenida con objetivo común",
    ],
  },
  {
    key: "vinculo_entrenador",
    label: "Vínculo con el entrenador",
    area: "SOCIAL",
    levels: [
      "Evita contacto visual y físico, no busca al entrenador",
      "Acepta presencia del entrenador, inicio de confianza",
      "Busca al entrenador ante dificultades, muestra logros",
      "Vínculo sólido, usa al entrenador como base segura",
    ],
  },
  {
    key: "atencion_sostenida",
    label: "Atención sostenida",
    area: "SOCIAL",
    levels: [
      "Menos de 2 min en cualquier actividad dirigida",
      "2-4 min en actividades de su interés",
      "5-8 min en actividades diseñadas para su nivel",
      "8-12+ min, retoma tras distracción",
    ],
  },
];

export const SOCCER_LEVEL_LABEL = ["", "Emergente", "En desarrollo", "Consolidando", "Consolidado"];

export function skillsByArea(area: SoccerAreaKey): SoccerSkill[] {
  return SOCCER_SKILLS.filter((s) => s.area === area);
}

export function isAreaConsolidated(skills: Record<string, number>, area: SoccerAreaKey): boolean {
  const areaSkills = skillsByArea(area);
  return areaSkills.length > 0 && areaSkills.every((s) => (skills[s.key] ?? 0) >= 4);
}

export function computeEarnedBadges(skills: Record<string, number>): SoccerAreaKey[] {
  return SOCCER_AREAS.filter((area) => isAreaConsolidated(skills, area));
}

export function mergeBadges(existing: string[], newlyEarned: SoccerAreaKey[]): string[] {
  const set = new Set(existing);
  newlyEarned.forEach((b) => set.add(b));
  return Array.from(set);
}
