"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function parseAttendanceStatus(value: FormDataEntryValue | null): "PRESENTE" | "AUSENTE" | "JUSTIFICADO" {
  if (value === "AUSENTE" || value === "JUSTIFICADO") return value;
  return "PRESENTE";
}

export async function saveAttendance(formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const classGroupId = String(formData.get("classGroupId") ?? "");
  const dateStr = String(formData.get("date") ?? "");
  if (!classGroupId || !dateStr) return;

  const date = new Date(`${dateStr}T00:00:00`);

  const classSession = await prisma.classSession.upsert({
    where: { classGroupId_date: { classGroupId, date } },
    update: {},
    create: { classGroupId, date },
  });

  const enrollments = await prisma.enrollment.findMany({ where: { classGroupId } });

  await Promise.all(
    enrollments.map((e) =>
      prisma.attendance.upsert({
        where: { clientId_classSessionId: { clientId: e.clientId, classSessionId: classSession.id } },
        update: { status: parseAttendanceStatus(formData.get(`status_${e.clientId}`)) },
        create: {
          clientId: e.clientId,
          classSessionId: classSession.id,
          status: parseAttendanceStatus(formData.get(`status_${e.clientId}`)),
        },
      })
    )
  );

  revalidatePath("/asistencia");
  redirect(`/asistencia?classGroupId=${classGroupId}&date=${dateStr}&saved=1`);
}
