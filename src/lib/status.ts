export type EffectiveStatus = "ACTIVO" | "VENCIDO" | "INACTIVO";

export function getEffectiveStatus(status: string, dueDate: Date, today: Date = new Date()): EffectiveStatus {
  if (status === "INACTIVO") return "INACTIVO";
  return dueDate < today ? "VENCIDO" : "ACTIVO";
}
