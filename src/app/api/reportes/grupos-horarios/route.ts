import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DAY_LABELS, PROGRAM_LABEL } from "@/lib/schedule";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const classGroups = await prisma.classGroup.findMany({
    include: { enrollments: { include: { client: true } } },
    orderBy: [{ program: "asc" }, { dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Grupos y horarios");

  sheet.columns = [
    { header: "Programa", key: "program", width: 18 },
    { header: "Grupo", key: "group", width: 24 },
    { header: "Día", key: "day", width: 14 },
    { header: "Horario", key: "time", width: 16 },
    { header: "Capacidad", key: "capacity", width: 12 },
    { header: "Inscritos", key: "enrolled", width: 12 },
    { header: "Niño/a", key: "client", width: 32 },
  ];
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };

  for (const g of classGroups) {
    if (g.enrollments.length === 0) {
      sheet.addRow({
        program: PROGRAM_LABEL[g.program] ?? g.program,
        group: g.name,
        day: DAY_LABELS[g.dayOfWeek],
        time: `${g.startTime} - ${g.endTime}`,
        capacity: g.capacity,
        enrolled: g.enrollments.length,
        client: "",
      });
      continue;
    }
    for (const e of g.enrollments) {
      sheet.addRow({
        program: PROGRAM_LABEL[g.program] ?? g.program,
        group: g.name,
        day: DAY_LABELS[g.dayOfWeek],
        time: `${g.startTime} - ${g.endTime}`,
        capacity: g.capacity,
        enrolled: g.enrollments.length,
        client: e.client.fullName,
      });
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="grupos-horarios.xlsx"`,
    },
  });
}
