"use client";

import { useMemo, useState } from "react";
import { computeAge, computeDueDate, formatAge, toDateInputValue } from "@/lib/dates";

const PROGRAM_INFO: Record<string, { label: string; range: string }> = {
  DESQBRO_BEBES: { label: "desQbro Bebés", range: "4 meses a 3 años y 364 días" },
  DESQBRO_AQUA: { label: "desQbro AQUA", range: "4 años a 12 años" },
  GUAGUAS_SOCCER: { label: "Güipas Soccer", range: "2 años a 9 años" },
};

type ClientFormValues = {
  fullName: string;
  birthDate: string;
  guardianName: string;
  phone: string;
  email: string;
  program: string;
  planType: string;
  paymentMode: string;
  installments: number;
  paymentDate: string;
  status: string;
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
  const [planType, setPlanType] = useState(defaultValues?.planType ?? "MENSUAL");
  const [paymentMode, setPaymentMode] = useState(defaultValues?.paymentMode ?? "TOTAL");
  const [paymentDate, setPaymentDate] = useState(defaultValues?.paymentDate ?? toDateInputValue(new Date()));

  const age = useMemo(() => {
    if (!birthDate) return null;
    const d = new Date(birthDate + "T00:00:00");
    if (isNaN(d.getTime())) return null;
    return formatAge(computeAge(d));
  }, [birthDate]);

  const dueDate = useMemo(() => {
    if (!paymentDate) return null;
    const d = new Date(paymentDate + "T00:00:00");
    if (isNaN(d.getTime())) return null;
    return toDateInputValue(computeDueDate(d, planType));
  }, [paymentDate, planType]);

  const showPaymentMode = planType !== "MENSUAL";
  const maxInstallments = planType === "SEMESTRAL" ? 3 : 2;

  return (
    <form action={action} style={{ maxWidth: 560, background: "#fff", padding: "1.5rem", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
      <SectionTitle>Datos del niño / niña</SectionTitle>

      <Field label="Nombre del niño *">
        <input name="fullName" required defaultValue={defaultValues?.fullName} style={input} />
      </Field>

      <Row>
        <Field label="Fecha de nacimiento *">
          <input
            name="birthDate"
            type="date"
            required
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            style={input}
          />
        </Field>
        <Field label="Edad">
          <div style={{ ...input, background: "#f1f5f9", display: "flex", alignItems: "center", color: "#334155" }}>
            {age ?? "—"}
          </div>
        </Field>
      </Row>

      <Field label="Nombre del acudiente *">
        <input name="guardianName" required defaultValue={defaultValues?.guardianName} style={input} />
      </Field>

      <Row>
        <Field label="Contacto telefónico *">
          <input name="phone" required defaultValue={defaultValues?.phone} style={input} placeholder="+57..." />
        </Field>
        <Field label="Correo">
          <input name="email" type="email" defaultValue={defaultValues?.email} style={input} />
        </Field>
      </Row>

      <SectionTitle>Programa</SectionTitle>

      <Field label="Programa *">
        <select name="program" defaultValue={defaultValues?.program ?? "DESQBRO_BEBES"} style={input}>
          {Object.entries(PROGRAM_INFO).map(([value, info]) => (
            <option key={value} value={value}>
              {info.label} ({info.range})
            </option>
          ))}
        </select>
      </Field>

      <SectionTitle>Plan</SectionTitle>

      <Field label="Plan *">
        <select
          name="planType"
          value={planType}
          onChange={(e) => {
            setPlanType(e.target.value);
            if (e.target.value === "MENSUAL") setPaymentMode("TOTAL");
          }}
          style={input}
        >
          <option value="MENSUAL">Plan Mensual</option>
          <option value="TRIMESTRAL">Plan Trimestral</option>
          <option value="SEMESTRAL">Plan Semestral</option>
        </select>
      </Field>

      {showPaymentMode && (
        <Row>
          <Field label="Forma de pago *">
            <select
              name="paymentMode"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              style={input}
            >
              <option value="TOTAL">Pago total</option>
              <option value="CUOTAS">Pago por cuotas</option>
            </select>
          </Field>
          {paymentMode === "CUOTAS" && (
            <Field label="Número de cuotas">
              <select name="installments" defaultValue={defaultValues?.installments ?? 2} style={input}>
                {Array.from({ length: maxInstallments - 1 }, (_, i) => i + 2).map((n) => (
                  <option key={n} value={n}>
                    {n} cuotas
                  </option>
                ))}
              </select>
            </Field>
          )}
        </Row>
      )}
      {(!showPaymentMode || paymentMode === "TOTAL") && <input type="hidden" name="installments" value={1} />}

      <Row>
        <Field label="Fecha de pago *">
          <input
            name="paymentDate"
            type="date"
            required
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            style={input}
          />
        </Field>
        <Field label="Fecha de vencimiento">
          <div style={{ ...input, background: "#f1f5f9", display: "flex", alignItems: "center", color: "#334155" }}>
            {dueDate ?? "—"}
          </div>
        </Field>
      </Row>

      <SectionTitle>Otros</SectionTitle>

      <Field label="Estado">
        <select name="status" defaultValue={defaultValues?.status ?? "ACTIVO"} style={input}>
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
          <option value="SUSPENDIDO">Suspendido</option>
        </select>
      </Field>

      <Field label="Observaciones">
        <textarea name="notes" defaultValue={defaultValues?.notes} style={{ ...input, minHeight: 80 }} />
      </Field>

      <button
        type="submit"
        style={{
          background: "#ffc814",
          color: "#3d0f30",
          border: "none",
          padding: "0.7rem 1.25rem",
          borderRadius: 8,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {submitLabel}
      </button>
    </form>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: 0.5, color: "#5c1a4a", margin: "1.25rem 0 0.75rem", borderBottom: "1px solid #f1e6ee", paddingBottom: 6 }}>
      {children}
    </h3>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ display: "block", fontSize: "0.85rem", marginBottom: 6, color: "#334155" }}>{label}</label>
      {children}
    </div>
  );
}

const input: React.CSSProperties = {
  width: "100%",
  padding: "0.6rem 0.75rem",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  fontSize: "0.95rem",
  boxSizing: "border-box",
  fontFamily: "inherit",
};
