export function money(n: number) {
  return n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

// Semanas ancladas al mes: la primera semana va del día 1 hasta el domingo que cierra
// la primera semana Lunes-Domingo completa (por eso puede durar más de 7 días),
// luego siguen semanas normales de Lunes a Domingo hasta el fin de mes.
export function monthWeeks(year: number, month: number) {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const dow = monthStart.getDay(); // 0=Dom..6=Sáb
  const daysToMonday = dow === 1 ? 0 : (8 - dow) % 7;

  const weeks: { start: Date; end: Date }[] = [];
  let firstWeekEnd = new Date(monthStart);
  firstWeekEnd.setDate(firstWeekEnd.getDate() + daysToMonday + 6);
  if (firstWeekEnd > monthEnd) firstWeekEnd = new Date(monthEnd);
  weeks.push({ start: new Date(monthStart), end: firstWeekEnd });

  let cursor = new Date(firstWeekEnd);
  cursor.setDate(cursor.getDate() + 1);
  while (cursor <= monthEnd) {
    let weekEnd = new Date(cursor);
    weekEnd.setDate(weekEnd.getDate() + 6);
    if (weekEnd > monthEnd) weekEnd = new Date(monthEnd);
    weeks.push({ start: new Date(cursor), end: weekEnd });
    cursor = new Date(weekEnd);
    cursor.setDate(cursor.getDate() + 1);
  }
  return weeks;
}
