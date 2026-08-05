import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClientForm } from "@/components/client-form";
import { updateClient } from "../../actions";
import { toDateInputValue } from "@/lib/dates";

export default async function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) notFound();

  const updateWithId = updateClient.bind(null, id);

  return (
    <div>
      <h1>Editar cliente</h1>
      <ClientForm
        action={updateWithId}
        submitLabel="Guardar cambios"
        defaultValues={{
          fullName: client.fullName,
          birthDate: toDateInputValue(client.birthDate),
          guardianName: client.guardianName,
          phone: client.phone,
          email: client.email ?? "",
          program: client.program,
          planType: client.planType,
          paymentMode: client.paymentMode,
          installments: client.installments,
          paymentDate: toDateInputValue(client.paymentDate),
          status: client.status,
          notes: client.notes ?? "",
        }}
      />
    </div>
  );
}
