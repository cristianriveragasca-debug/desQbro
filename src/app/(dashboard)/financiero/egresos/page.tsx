import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createExpense, deleteExpense } from "./actions";
import { EXPENSE_CATEGORY_LABEL, EXPENSE_METHOD_LABEL } from "@/lib/expenses";
import { toDateInputValue } from "@/lib/dates";

function money(n: number) {
  return n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

export default async function EgresosPage() {
  const expenses = await prisma.expense.findMany({ orderBy: { date: "desc" } });
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div>
      <Link href="/financiero" style={{ color: "#5c1a4a", fontSize: "0.85rem" }}>
        ← Volver a Financiero
      </Link>
      <h1 style={{ marginTop: 8 }}>Egresos</h1>
      <p style={{ color: "#64748b" }}>
        Total registrado: <strong>{money(total)}</strong>
      </p>

      <div className="two-col-stack" style={{ gridTemplateColumns: "1fr 1.4fr", marginTop: 24 }}>
        <div>
          <h2 style={{ fontSize: "1rem", marginTop: 0 }}>Nuevo egreso</h2>
          <form
            action={createExpense}
            style={{ background: "#fff", padding: "1.25rem", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
          >
            <Field label="Concepto *">
              <input name="concept" required style={input} placeholder="Ej: Pago arriendo cancha agosto" />
            </Field>

            <Field label="Categoría *">
              <select name="category" style={input} defaultValue="OTROS">
                {Object.entries(EXPENSE_CATEGORY_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>

            <Row>
              <Field label="Valor *">
                <input name="amount" type="number" min={0} step={1000} required style={input} />
              </Field>
              <Field label="Fecha *">
                <input name="date" type="date" required defaultValue={toDateInputValue(new Date())} style={input} />
              </Field>
            </Row>

            <Field label="Proveedor / a quién se pagó">
              <input name="provider" style={input} />
            </Field>

            <Field label="Método de pago">
              <select name="method" style={input} defaultValue="TRANSFERENCIA">
                {Object.entries(EXPENSE_METHOD_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Notas">
              <textarea name="notes" style={{ ...input, minHeight: 70 }} />
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
              Registrar egreso
            </button>
          </form>
        </div>

        <div>
          <h2 style={{ fontSize: "1rem", marginTop: 0 }}>Historial</h2>
          <div className="table-scroll" style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                  <th style={th}>Fecha</th>
                  <th style={th}>Concepto</th>
                  <th style={th}>Categoría</th>
                  <th style={th}>Proveedor</th>
                  <th style={th}>Valor</th>
                  <th style={th}></th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ ...td, textAlign: "center", color: "#94a3b8" }}>
                      Aún no hay egresos registrados.
                    </td>
                  </tr>
                )}
                {expenses.map((e) => (
                  <tr key={e.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>{e.date.toLocaleDateString("es-CO")}</td>
                    <td style={td}>{e.concept}</td>
                    <td style={td}>{EXPENSE_CATEGORY_LABEL[e.category]}</td>
                    <td style={td}>{e.provider ?? "—"}</td>
                    <td style={{ ...td, fontWeight: 600, color: "#dc2626" }}>{money(Number(e.amount))}</td>
                    <td style={{ ...td, textAlign: "right" }}>
                      <form action={deleteExpense}>
                        <input type="hidden" name="id" value={e.id} />
                        <button
                          type="submit"
                          style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "0.85rem" }}
                        >
                          Eliminar
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="form-row">{children}</div>;
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
const th: React.CSSProperties = { padding: "0.75rem 1rem", fontWeight: 600, color: "#334155" };
const td: React.CSSProperties = { padding: "0.75rem 1rem", color: "#3d0f30" };
