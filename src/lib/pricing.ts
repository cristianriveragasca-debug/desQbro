export const PLAN_PRICE: Record<string, number> = {
  MENSUAL: 199000,
  TRIMESTRAL: 450000,
  SEMESTRAL: 780000,
};

const PLAN_MONTHS: Record<string, number> = {
  MENSUAL: 1,
  TRIMESTRAL: 3,
  SEMESTRAL: 6,
};

const PLAN_LABEL: Record<string, string> = {
  MENSUAL: "Plan Mensual",
  TRIMESTRAL: "Plan Trimestral",
  SEMESTRAL: "Plan Semestral",
};

export type GeneratedInstallment = {
  amount: number;
  concept: string;
  dueDate: Date;
  status: "PENDIENTE" | "PAGADO";
  paidAt: Date | null;
};

export function generateInstallments(
  planType: string,
  installments: number,
  paymentDate: Date
): GeneratedInstallment[] {
  const total = PLAN_PRICE[planType] ?? 0;
  const months = PLAN_MONTHS[planType] ?? 1;
  const label = PLAN_LABEL[planType] ?? "Plan";
  const n = Math.max(installments, 1);

  const baseAmount = Math.floor(total / n / 1000) * 1000;
  const remainder = total - baseAmount * n;

  const intervalMonths = months / n;

  return Array.from({ length: n }, (_, i) => {
    const dueDate = new Date(paymentDate);
    dueDate.setMonth(dueDate.getMonth() + Math.round(intervalMonths * i));

    const amount = i === n - 1 ? baseAmount + remainder : baseAmount;
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
