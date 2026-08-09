"use client";

import { useMemo, useState } from "react";
import { computeAge, formatAge } from "@/lib/dates";
import { SubscriptionFields } from "@/components/subscription-fields";
import { Field, Row, SectionTitle, inputStyle, submitButtonStyle } from "@/components/form-ui";

type ClientFormValues = {
  fullName: string;
  birthDate: string;
  guardianName: string;
  phone: string;
  email: string;
  notes: string;
};

export function ClientForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  defaultValues?: Partial<ClientFormValues>;
  submitLabel: string;
}) {
  const [birthDate, setBirthDate] = useState(defaultValues?.birthDate ?? "");

  const age = useMemo(() => {
    if (!birthDate) return null;
    const d = new Date(birthDate + "T00:00:00");
    if (isNaN(d.getTime())) return null;
    return formatAge(computeAge(d));
  }, [birthDate]);

  return (
    <form action={action} style={{ maxWidth: 560, background: "#fff", padding: "1.5rem", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
      <SectionTitle>Datos del niño / niña</SectionTitle>

      <Field label="Nombre del niño *">
        <input name="fullName" required defaultValue={defaultValues?.fullName} style={inputStyle} />
      </Field>

      <Row>
        <Field label="Fecha de nacimiento *">
          <input
            name="birthDate"
            type="date"
            required
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            style={inputStyle}
          />
        </Field>
        <Field label="Edad">
          <div style={{ ...inputStyle, background: "#f1f5f9", display: "flex", alignItems: "center", color: "#334155" }}>
            {age ?? "—"}
          </div>
        </Field>
      </Row>

      <Field label="Nombre del acudiente *">
        <input name="guardianName" required defaultValue={defaultValues?.guardianName} style={inputStyle} />
      </Field>

      <Row>
        <Field label="Contacto telefónico *">
          <input name="phone" required defaultValue={defaultValues?.phone} style={inputStyle} placeholder="+57..." />
        </Field>
        <Field label="Correo">
          <input name="email" type="email" defaultValue={defaultValues?.email} style={inputStyle} />
        </Field>
      </Row>

      <SubscriptionFields />

      <SectionTitle>Otros</SectionTitle>

      <Field label="Observaciones">
        <textarea name="notes" defaultValue={defaultValues?.notes} style={{ ...inputStyle, minHeight: 80 }} />
      </Field>

      <button type="submit" style={submitButtonStyle}>
        {submitLabel}
      </button>
    </form>
  );
}
