export const PLAN_PRICE: Record<string, number> = {
  MENSUAL: 199000,
  TRIMESTRAL: 450000,
  SEMESTRAL: 780000,
};

// Precios especiales por programa que sobreescriben PLAN_PRICE.
export const PROGRAM_PLAN_PRICE: Record<string, Partial<Record<string, number>>> = {
  GUAGUAS_SOCCER: { MENSUAL: 90000 },
};

// Programas que solo permiten plan mensual.
export const PROGRAM_ONLY_MONTHLY: Record<string, boolean> = {
  GUAGUAS_SOCCER: true,
};

export function getPlanPrice(program: string, planType: string): number {
  return PROGRAM_PLAN_PRICE[program]?.[planType] ?? PLAN_PRICE[planType] ?? 0;
}

export function getEffectivePlanAmount(program: string, planType: string, customAmount?: number | null): number {
  return customAmount ?? getPlanPrice(program, planType);
}

export const ONE_TIME_FEES: { key: string; label: string; amount: number; programs: string[] }[] = [
  { key: "inscripcion", label: "Inscripción / matrícula anual", amount: 50000, programs: ["GUAGUAS_SOCCER"] },
  { key: "uniforme", label: "Uniforme", amount: 85000, programs: ["GUAGUAS_SOCCER"] },
];

export const PLAN_MONTHS: Record<string, number> = {
  MENSUAL: 1,
  TRIMESTRAL: 3,
  SEMESTRAL: 6,
};

export const PLAN_LABEL: Record<string, string> = {
  MENSUAL: "Plan Mensual",
  TRIMESTRAL: "Plan Trimestral",
  SEMESTRAL: "Plan Semestral",
};

export const CASH_DISTRIBUTION: { key: string; label: string; pct: number }[] = [
  { key: "operacion", label: "Operación", pct: 0.55 },
  { key: "marketing", label: "Marketing", pct: 0.1 },
  { key: "reserva", label: "Reserva", pct: 0.15 },
  { key: "utilidad", label: "Utilidad / Fundador", pct: 0.2 },
];

export type GeneratedInstallment = {
  amount: number;
  concept: string;
  dueDate: Date;
  status: "PENDIENTE" | "PAGADO";
  paidAt: Date | null;
};

export function generateInstallments(
  program: string,
  planType: string,
  installments: number,
  paymentDate: Date,
  customAmount?: number | null,
  explicitAmounts?: number[] | null
): GeneratedInstallment[] {
  const months = PLAN_MONTHS[planType] ?? 1;
  const label = PLAN_LABEL[planType] ?? "Plan";
  const n = explicitAmounts?.length ? explicitAmounts.length : Math.max(installments, 1);

  const total = explicitAmounts?.length
    ? explicitAmounts.reduce((sum, a) => sum + a, 0)
    : customAmount ?? getPlanPrice(program, planType);

  const baseAmount = Math.floor(total / n / 1000) * 1000;
  const remainder = total - baseAmount * n;

  const intervalMonths = months / n;

  return Array.from({ length: n }, (_, i) => {
    const dueDate = new Date(paymentDate);
    dueDate.setMonth(dueDate.getMonth() + Math.round(intervalMonths * i));

    const amount = explicitAmounts?.length ? explicitAmounts[i] : i === n - 1 ? baseAmount + remainder : baseAmount;
    const concept = n === 1 ? label : `${label} - Cuota ${i + 1}/${n}`;

    return {
      amount,
      concept,
      dueDate,
      status: i === 0 ? "PAGADO" : "PENDIENTE",
      paidAt: i === 0 ? paymentDate : null,
    } as GeneratedInstallment;
  });
}
