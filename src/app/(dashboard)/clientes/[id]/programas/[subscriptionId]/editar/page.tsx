import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateProgramSubscription } from "../../../../actions";
import { SubscriptionFields } from "@/components/subscription-fields";
import { submitButtonStyle } from "@/components/form-ui";
import { toDateInputValue } from "@/lib/dates";

export default async function EditarProgramaPage({
  params,
}: {
  params: Promise<{ id: string; subscriptionId: string }>;
}) {
  const { id, subscriptionId } = await params;

  const subscription = await prisma.programSubscription.findUnique({
    where: { id: subscriptionId },
    include: { client: { include: { subscriptions: { select: { program: true } } } } },
  });
  if (!subscription || subscription.clientId !== id) notFound();

  const excludePrograms = subscription.client.subscriptions
    .map((s) => s.program)
    .filter((p) => p !== subscription.program);

  const updateWithIds = updateProgramSubscription.bind(null, subscription.id, id);

  return (
    <div>
      <Link href={`/clientes/${id}`} style={{ color: "#5c1a4a", fontSize: "0.85rem" }}>
        ← Volver a {subscription.client.fullName}
      </Link>
      <h1 style={{ marginTop: 8 }}>Editar programa</h1>

      <form
        action={updateWithIds}
        style={{ maxWidth: 560, background: "#fff", padding: "1.5rem", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginTop: 12 }}
      >
        <SubscriptionFields
          excludePrograms={excludePrograms}
          defaultValues={{
            program: subscription.program,
            planType: subscription.planType,
            paymentMode: subscription.paymentMode,
            installments: subscription.installments,
            customAmount: subscription.customAmount ? Number(subscription.customAmount) : null,
            paymentDate: toDateInputValue(subscription.paymentDate),
            status: subscription.status,
          }}
        />
        <button type="submit" style={submitButtonStyle}>
          Guardar cambios
        </button>
      </form>
      <p style={{ marginTop: 12, fontSize: "0.85rem", color: "#94a3b8" }}>
        Esto solo actualiza los datos del programa (programa, plan, fechas). Las cuotas ya generadas no se modifican
        automáticamente; gestiónalas desde el panel financiero.
      </p>
    </div>
  );
}
