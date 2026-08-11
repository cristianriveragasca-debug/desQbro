export const PROGRESS_LEVELS = ["INICIACION", "BASICO", "INTERMEDIO", "AVANZADO", "EXPERTO"] as const;

export const PROGRESS_LABEL: Record<string, string> = {
  INICIACION: "Iniciación",
  BASICO: "Básico",
  INTERMEDIO: "Intermedio",
  AVANZADO: "Avanzado",
  EXPERTO: "Experto",
};

export const PROGRESS_BADGE: Record<string, string> = {
  INICIACION: "🌱",
  BASICO: "⭐",
  INTERMEDIO: "🥉",
  AVANZADO: "🥈",
  EXPERTO: "🥇",
};

export function progressPercent(level: string): number {
  const idx = PROGRESS_LEVELS.indexOf(level as (typeof PROGRESS_LEVELS)[number]);
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / PROGRESS_LEVELS.length) * 100);
}
