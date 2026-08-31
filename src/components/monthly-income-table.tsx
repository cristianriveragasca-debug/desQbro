"use client";

import { useState } from "react";
import { money } from "@/lib/weeks";

const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

type ProgramDef = { key: string; label: string };

export function MonthlyIncomeTable({
  programs,
  year,
  initialValues,
  action,
}: {
  programs: ProgramDef[];
  year: number;
  initialValues: Record<string, number[]>;
  action: (formData: FormData) => void;
}) {
  const [values, setValues] = useState<Record<string, number[]>>(initialValues);

  const handleChange = (programKey: string, monthIdx: number, raw: string) => {
    const parsed = raw === "" ? 0 : Number(raw);
    setValues((prev) => {
      const next = { ...prev, [programKey]: [...prev[programKey]] };
      next[programKey][monthIdx] = Number.isNaN(parsed) ? 0 : parsed;
      return next;
    });
  };

  const monthTotal = (monthIdx: number) => programs.reduce((sum, p) => sum + (values[p.key]?.[monthIdx] ?? 0), 0);

  return (
    <form action={action} className="table-scroll" style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginTop: 10 }}>
      <input type="hidden" name="year" value={year} />
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
        <thead>
          <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
            <th style={th}>Programa</th>
            {MONTH_LABELS.map((m) => (
              <th key={m} style={{ ...th, textAlign: "center" }}>
                {m}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {programs.map((p) => (
            <tr key={p.key} style={{ borderTop: "1px solid #e2e8f0" }}>
              <td style={{ ...td, fontWeight: 600, color: "#3d0f30", whiteSpace: "nowrap" }}>{p.label}</td>
              {MONTH_LABELS.map((_, monthIdx) => (
                <td key={monthIdx} style={{ padding: "0.4rem 0.3rem" }}>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    name={`amount_${p.key}_${monthIdx + 1}`}
                    value={values[p.key]?.[monthIdx] ?? 0}
                    onChange={(e) => handleChange(p.key, monthIdx, e.target.value)}
                    style={{ width: 82, padding: "0.3rem", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.75rem", textAlign: "right" }}
                  />
                </td>
              ))}
            </tr>
          ))}
          <tr style={{ borderTop: "2px solid #cbd5e1", background: "#f8fafc" }}>
            <td style={{ ...td, fontWeight: 700, color: "#3d0f30" }}>Total</td>
            {MONTH_LABELS.map((_, monthIdx) => (
              <td key={monthIdx} style={{ ...td, textAlign: "center", fontWeight: 700 }}>
                {money(monthTotal(monthIdx))}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <div style={{ padding: "1rem" }}>
        <button
          type="submit"
          style={{ background: "#166534", color: "#fff", border: "none", padding: "0.55rem 1.2rem", borderRadius: 8, fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
        >
          Guardar cambios
        </button>
      </div>
    </form>
  );
}

const th: React.CSSProperties = { padding: "0.75rem 1rem", fontWeight: 600, color: "#334155" };
const td: React.CSSProperties = { padding: "0.75rem 1rem", color: "#3d0f30" };
