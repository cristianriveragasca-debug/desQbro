import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClassForm } from "@/components/class-form";
import { updateClassGroup } from "../../actions";

export default async function EditarClasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const classGroup = await prisma.classGroup.findUnique({ where: { id } });
  if (!classGroup) notFound();

  const updateWithId = updateClassGroup.bind(null, id);

  return (
    <div>
      <h1>Editar clase</h1>
      <ClassForm action={updateWithId} submitLabel="Guardar cambios" defaultValues={classGroup} />
    </div>
  );
}
