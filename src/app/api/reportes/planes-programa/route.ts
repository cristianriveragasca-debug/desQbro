import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PROGRAM_LABEL } from "@/lib/schedule";
import { getEffectiveStatus } from "@/lib/status";

const PLAN_LABEL: Record<string, string> = { MENSUAL: "Mensual", TRIMESTRAL: "Trimestral", SEMESTRAL: "Semestral" };
const STATUS_LABEL: Record<string, string> = { ACTIVO: "Activo", VENCIDO: "Vencido", INACTIVO: "Inactivo" };

// Las fechas guardadas desde un campo de fecha vienen a medianoche UTC; las de renovaciones traen hora real.
function formatDate(d: Date) {
  const isMidnightUtc = d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0;
  return d.toLocaleDateString("es-CO", {
    timeZone: isMidnightUtc ? "UTC" : "America/Bogota",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const subscriptions = await prisma.programSubscription.findMany({
    where: { status: { not: "INACTIVO" } },
    include: { client: true },
  });

  const today = new Date();
  const workbook = new ExcelJS.Workbook();
  const border = {
    top: { style: "thin" as const },
    left: { style: "thin" as const },
    bottom: { style: "thin" as const },
    right: { style: "thin" as const },
  };

  for (const [program, label] of Object.entries(PROGRAM_LABEL)) {
    const rows = subscriptions
      .filter((s) => s.program === program)
      .sort((a, b) => a.client.fullName.localeCompare(b.client.fullName, "es"));

    const sheet = workbook.addWorksheet(label.slice(0, 31));
    sheet.columns = [
      { key: "n", width: 5 },
      { key: "client", width: 36 },
      { key: "guardian", width: 28 },
      { key: "phone", width: 16 },
      { key: "plan", width: 13 },
      { key: "start", width: 14 },
      { key: "end", width: 14 },
      { key: "status", width: 12 },
    ];

    sheet.mergeCells("A1:H1");
    sheet.getCell("A1").value = `desQbro — ${label}: inicio y fin de plan`;
    sheet.getCell("A1").font = { bold: true, size: 14 };
    sheet.mergeCells("A2:H2");
    sheet.getCell("A2").value = `Generado el ${formatDate(today)} · ${rows.length} niños (sin inactivos)`;
    sheet.getCell("A2").font = { italic: true, size: 10, color: { argb: "FF64748B" } };

    const header = sheet.getRow(4);
    header.values = ["#", "Niño/a", "Acudiente", "Teléfono", "Plan", "Inicio del plan", "Fin del plan", "Estado"];
    header.font = { bold: true };
    header.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
      cell.border = border;
    });

    rows.forEach((s, i) => {
      const effective = getEffectiveStatus(s.status, s.dueDate, today);
      const row = sheet.addRow([
        i + 1,
        s.client.fullName,
        s.client.guardianName,
        s.client.phone,
        PLAN_LABEL[s.planType] ?? s.planType,
        formatDate(s.paymentDate),
        formatDate(s.dueDate),
        STATUS_LABEL[effective] ?? effective,
      ]);
      row.eachCell((cell) => {
        cell.border = border;
      });
    });

    sheet.pageSetup = {
      orientation: "landscape",
      paperSize: 9,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      printTitlesRow: "4:4",
      margins: { left: 0.4, right: 0.4, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 },
    };
    sheet.headerFooter.oddFooter = "&L desQbro &CPágina &P de &N";
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="planes-por-programa.xlsx"',
    },
  });
}
