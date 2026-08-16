import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { monthWeeks } from "@/lib/weeks";

const PROGRAM_LABEL: Record<string, string> = {
  DESQBRO_BEBES: "desQbro Bebés",
  DESQBRO_AQUA: "desQbro AQUA",
  GUAGUAS_SOCCER: "Güipas Soccer",
};

function parseMonthParam(value: string | null): { year: number; month: number } {
  if (value) {
    const match = /^(\d{4})-(\d{2})$/.exec(value);
    if (match) return { year: Number(match[1]), month: Number(match[2]) - 1 };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { year, month } = parseMonthParam(req.nextUrl.searchParams.get("month"));
  const weeks = monthWeeks(year, month);
  const monthStart = weeks[0].start;
  const monthEnd = new Date(weeks[weeks.length - 1].end);
  monthEnd.setDate(monthEnd.getDate() + 1);

  const payments = await prisma.payment.findMany({
    where: { status: "PAGADO", paidAt: { gte: monthStart, lt: monthEnd } },
    include: { subscription: { include: { client: true } } },
    orderBy: { paidAt: "asc" },
  });

  const weekIndexFor = (date: Date) => {
    for (let i = 0; i < weeks.length; i++) {
      const weekEndExclusive = new Date(weeks[i].end);
      weekEndExclusive.setDate(weekEndExclusive.getDate() + 1);
      if (date >= weeks[i].start && date < weekEndExclusive) return i;
    }
    return -1;
  };

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Pagos por semana");

  sheet.columns = [
    { header: "Semana", key: "week", width: 24 },
    { header: "Fecha de pago", key: "date", width: 16 },
    { header: "Niño/a", key: "client", width: 32 },
    { header: "Programa", key: "program", width: 18 },
    { header: "Concepto", key: "concept", width: 32 },
    { header: "Valor", key: "amount", width: 14 },
  ];
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };

  for (const p of payments) {
    if (!p.paidAt) continue;
    const idx = weekIndexFor(p.paidAt);
    const weekLabel =
      idx >= 0
        ? `Semana ${idx + 1} (${weeks[idx].start.toLocaleDateString("es-CO", { day: "numeric", month: "short" })} - ${weeks[idx].end.toLocaleDateString("es-CO", { day: "numeric", month: "short" })})`
        : "Fuera de rango";

    sheet.addRow({
      week: weekLabel,
      date: p.paidAt.toLocaleDateString("es-CO"),
      client: p.subscription.client.fullName,
      program: PROGRAM_LABEL[p.subscription.program] ?? p.subscription.program,
      concept: p.concept,
      amount: Number(p.amount),
    });
  }

  sheet.getColumn("amount").numFmt = "#,##0";

  const buffer = await workbook.xlsx.writeBuffer();
  const monthName = new Date(year, month, 1).toLocaleDateString("es-CO", { month: "long", year: "numeric" });

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="pagos-semana-${monthName.replace(/\s/g, "-")}.xlsx"`,
    },
  });
}
