"use client";

import { useMemo, useState } from "react";
import { computeDueDate, toDateInputValue } from "@/lib/dates";
import { ONE_TIME_FEES, PROGRAM_ONLY_MONTHLY, getPlanPrice } from "@/lib/pricing";
import { Field, Row, SectionTitle, inputStyle, money } from "@/components/form-ui";

const PROGRAM_INFO: Record<string, { label: string; range: string }> = {
  DESQBRO_BEBES: { label: "desQbro Bebés", range: "4 meses a 3 años y 364 días" },
  DESQBRO_AQUA: { label: "desQbro AQUA", range: "4 años a 12 años" },
  GUAGUAS_SOCCER: { label: "Güipas Soccer", range: "2 años a 9 años" },
};

export type SubscriptionFormValues = {
  program: string;
  planType: string;
  paymentMode: string;
  installments: number;
  customAmount: number | null;
  paymentDate: string;
  status: string;
};

export function SubscriptionFields({
  defaultValues,
  excludePrograms = [],
}: {
  defaultValues?: Partial<SubscriptionFormValues>;
  excludePrograms?: string[];
}) {
  const [program, setProgram] = useState(defaultValues?.program ?? "DESQBRO_BEBES");
  const [planType, setPlanTypeState] = useState(defaultValues?.planType ?? "MENSUAL");
  const [paymentMode, setPaymentMode] = useState(defaultValues?.paymentMode ?? "TOTAL");
  const [paymentDate, setPaymentDate] = useState(defaultValues?.paymentDate ?? toDateInputValue(new Date()));
  const [installmentsCount, setInstallmentsCount] = useState(defaultValues?.installments ?? 2);
  const [cuotaAmounts, setCuotaAmounts] = useState<Record<number, string>>({});

  const onlyMonthly = PROGRAM_ONLY_MONTHLY[program] ?? false;
  const effectivePlanType = onlyMonthly ? "MENSUAL" : planType;

  function setPlanType(value: string) {
    setPlanTypeState(value);
    if (value === "MENSUAL") setPaymentMode("TOTAL");
  }

  function handleProgramChange(value: string) {
    setProgram(value);
    if (PROGRAM_ONLY_MONTHLY[value]) setPlanType("MENSUAL");
  }

  const dueDate = useMemo(() => {
    if (!paymentDate) return null;
    const d = new Date(paymentDate + "T00:00:00");
    if (isNaN(d.getTime())) return null;
    return toDateInputValue(computeDueDate(d, effectivePlanType));
  }, [paymentDate, effectivePlanType]);

  const showPaymentMode = !onlyMonthly && effectivePlanType !== "MENSUAL";
  const maxInstallments = effectivePlanType === "SEMESTRAL" ? 3 : 2;
  const planPrice = getPlanPrice(program, effectivePlanType);
  const applicableFees = ONE_TIME_FEES.filter((f) => f.programs.includes(program));

  const defaultCuotaAmount = Math.round(planPrice / installmentsCount / 1000) * 1000;
  const cuotaTotal = Array.from({ length: installmentsCount }, (_, i) =>
    Number(cuotaAmounts[i] || defaultCuotaAmount)
  ).reduce((sum, n) => sum + n, 0);

  const availablePrograms = Object.entries(PROGRAM_INFO).filter(([value]) => !excludePrograms.includes(value));

  return (
    <>
      <SectionTitle>Programa</SectionTitle>

      <Field label="Programa *">
        <select name="program" value={program} onChange={(e) => handleProgramChange(e.target.value)} style={inputStyle}>
          {availablePrograms.map(([value, info]) => (
            <option key={value} value={value}>
              {info.label} ({info.range})
            </option>
          ))}
        </select>
      </Field>

      {applicableFees.length > 0 && (
        <Field label="Cargos únicos">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {applicableFees.map((f) => (
              <label key={f.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.9rem", color: "#334155" }}>
                <input type="checkbox" name={`fee_${f.key}`} defaultChecked={f.key === "inscripcion"} />
                {f.label} ({money(f.amount)})
              </label>
            ))}
          </div>
        </Field>
      )}

      <SectionTitle>Plan</SectionTitle>

      {onlyMonthly ? (
        <>
          <Field label="Plan">
            <div style={{ ...inputStyle, background: "#f1f5f9", display: "flex", alignItems: "center", color: "#334155" }}>
              Plan Mensual ({money(planPrice)}) — único plan disponible para este programa
            </div>
          </Field>
          <input type="hidden" name="planType" value="MENSUAL" />
        </>
      ) : (
        <Field label="Plan *">
          <select name="planType" value={planType} onChange={(e) => setPlanType(e.target.value)} style={inputStyle}>
            <option value="MENSUAL">Plan Mensual ({money(getPlanPrice(program, "MENSUAL"))})</option>
            <option value="TRIMESTRAL">Plan Trimestral ({money(getPlanPrice(program, "TRIMESTRAL"))})</option>
            <option value="SEMESTRAL">Plan Semestral ({money(getPlanPrice(program, "SEMESTRAL"))})</option>
          </select>
        </Field>
      )}

      {(!showPaymentMode || paymentMode === "TOTAL") && (
        <Field label="Valor personalizado para este cliente (opcional)">
          <input
            name="customAmount"
            type="number"
            min={0}
            step={1000}
            defaultValue={defaultValues?.customAmount ?? ""}
            placeholder={`Estándar: ${money(planPrice)}`}
            style={inputStyle}
          />
          <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 4 }}>
            Déjalo vacío para cobrar el valor estándar del plan. Si escribes un valor, se usará ese monto (total del plan) en vez del estándar para este cliente.
          </p>
        </Field>
      )}

      {showPaymentMode && (
        <>
          <Row>
            <Field label="Forma de pago *">
              <select name="paymentMode" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} style={inputStyle}>
                <option value="TOTAL">Pago total</option>
                <option value="CUOTAS">Pago por cuotas</option>
              </select>
            </Field>
            {paymentMode === "CUOTAS" && (
              <Field label="Número de cuotas">
                <select
                  name="installments"
                  value={installmentsCount}
                  onChange={(e) => setInstallmentsCount(Number(e.target.value))}
                  style={inputStyle}
                >
                  {Array.from({ length: maxInstallments }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n} cuotas
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </Row>

          {paymentMode === "CUOTAS" && (
            <Field label={`Valor de cada cuota (puede ser desigual, ej. abonos parciales) — Total: ${money(cuotaTotal)}`}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Array.from({ length: installmentsCount }, (_, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "0.85rem", color: "#334155", width: 90 }}>
                      Cuota {i + 1}
                      {i === 0 ? " (hoy)" : ""}
                    </span>
                    <input
                      name={`cuotaAmount_${i + 1}`}
                      type="number"
                      min={0}
                      step={1000}
                      value={cuotaAmounts[i] ?? defaultCuotaAmount}
                      onChange={(e) => setCuotaAmounts((prev) => ({ ...prev, [i]: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                ))}
              </div>
            </Field>
          )}
        </>
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
            style={inputStyle}
          />
        </Field>
        <Field label="Fecha de vencimiento">
          <div style={{ ...inputStyle, background: "#f1f5f9", display: "flex", alignItems: "center", color: "#334155" }}>
            {dueDate ?? "—"}
          </div>
        </Field>
      </Row>

      <Field label="Matrícula">
        <select name="status" defaultValue={defaultValues?.status === "INACTIVO" ? "INACTIVO" : "ACTIVO"} style={inputStyle}>
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo (retirado)</option>
        </select>
        <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 4 }}>
          El estado &quot;Vencido&quot; lo calcula el sistema automáticamente según la fecha de vencimiento.
        </p>
      </Field>
    </>
  );
}
