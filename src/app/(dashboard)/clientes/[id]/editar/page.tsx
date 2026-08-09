import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateClient } from "../../actions";
import { toDateInputValue } from "@/lib/dates";
import { Field, Row, SectionTitle, inputStyle, submitButtonStyle } from "@/components/form-ui";

export default async function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) notFound();

  const updateWithId = updateClient.bind(null, id);

  return (
    <div>
      <h1>Editar cliente</h1>
      <form
        action={updateWithId}
        style={{ maxWidth: 560, background: "#fff", padding: "1.5rem", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
      >
        <SectionTitle>Datos del niño / niña</SectionTitle>

        <Field label="Nombre del niño *">
          <input name="fullName" required defaultValue={client.fullName} style={inputStyle} />
        </Field>

        <Field label="Fecha de nacimiento *">
          <input name="birthDate" type="date" required defaultValue={toDateInputValue(client.birthDate)} style={inputStyle} />
        </Field>

        <Field label="Nombre del acudiente *">
          <input name="guardianName" required defaultValue={client.guardianName} style={inputStyle} />
        </Field>

        <Row>
          <Field label="Contacto telefónico *">
            <input name="phone" required defaultValue={client.phone} style={inputStyle} placeholder="+57..." />
          </Field>
          <Field label="Correo">
            <input name="email" type="email" defaultValue={client.email ?? ""} style={inputStyle} />
          </Field>
        </Row>

        <Field label="Observaciones">
          <textarea name="notes" defaultValue={client.notes ?? ""} style={{ ...inputStyle, minHeight: 80 }} />
        </Field>

        <button type="submit" style={submitButtonStyle}>
          Guardar cambios
        </button>
      </form>
      <p style={{ marginTop: 12, fontSize: "0.85rem", color: "#64748b" }}>
        Para gestionar los programas, planes y pagos de este cliente, ve a su{" "}
        <a href={`/clientes/${id}`} style={{ color: "#5c1a4a", fontWeight: 600 }}>
          ficha de detalle
        </a>
        .
      </p>
    </div>
  );
}
