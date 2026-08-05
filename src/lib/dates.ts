export type Age = { years: number; months: number; days: number; totalDays: number };

export function computeAge(birthDate: Date, at: Date = new Date()): Age {
  let years = at.getFullYear() - birthDate.getFullYear();
  let months = at.getMonth() - birthDate.getMonth();
  let days = at.getDate() - birthDate.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(at.getFullYear(), at.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalDays = Math.floor((at.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));

  return { years, months, days, totalDays };
}

export function formatAge(age: Age): string {
  if (age.years === 0 && age.months === 0) return `${age.days} días`;
  if (age.years === 0) return `${age.months} meses`;
  return `${age.years} años, ${age.months} meses`;
}

const PLAN_MONTHS: Record<string, number> = {
  MENSUAL: 1,
  TRIMESTRAL: 3,
  SEMESTRAL: 6,
};

export function computeDueDate(paymentDate: Date, planType: string): Date {
  const months = PLAN_MONTHS[planType] ?? 1;
  const due = new Date(paymentDate);
  due.setMonth(due.getMonth() + months);
  return due;
}

export function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}
