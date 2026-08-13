import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { computeAge, formatAge } from "@/lib/dates";
import { getEffectiveStatus } from "@/lib/status";
import {
  addProgramSubscription,
  addSubscriptionPayment,
  deleteProgramSubscription,
  deleteSubscriptionPayment,
  renewMonthlyPayment,
  updateSubscriptionPayment,
} from "../actions";
import {
  addCoachNote,
  deleteCoachNote,
  removeParentAccess,
  setParentAccess,
  toggleSwimCriterion,
  updateProgressLevel,
} from "../brujula-actions";
import { SubscriptionFields } from "@/components/subscription-fields";
import { submitButtonStyle } from "@/components/form-ui";
import { toDateInputValue } from "@/lib/dates";
import { ONE_TIME_FEES } from "@/lib/pricing";
import { PROGRESS_BADGE, PROGRESS_LABEL, PROGRESS_LEVELS, progressPercent } from "@/lib/progress";
import { SWIM_CRITERIA, SWIM_TRANSITION_LABEL, countChecked, isChecklistChecked, type SwimLevelValue } from "@/lib/swim-progress";
import { SwimTrack } from "@/components/swim-track";
import { GuipasAdminPanel } from "@/components/guipas-admin-panel";

function money(n: number) {
  return n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

const PROGRAM_LABEL: Record<string, string> = {
  DESQBRO_BEBES: "desQbro Bebés",
  DESQBRO_AQUA: "desQbro AQUA",
  GUAGUAS_SOCCER: "Güipas Soccer",
};
const PLAN_LABEL: Record<string, string> = {
  MENSUAL: "Mensual",
  TRIMESTRAL: "Trimestral",
  SEMESTRAL: "Semestral",
};
const STATUS_LABEL: Record<string, string> = {
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
  VENCIDO: "Vencido",
};
const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  ACTIVO: { bg: "#dcfce7", fg: "#166534" },
  VENCIDO: { bg: "#fee2e2", fg: "#dc2626" },
  INACTIVO: { bg: "#f1f5f9", fg: "#64748b" },
};

export default async function ClienteDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const today = new Date();

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      parentAccount: true,
      subscriptions: {
        include: {
          payments: { orderBy: { dueDate: "asc" } },
          coachNotes: { orderBy: { date: "desc" } },
          monthlyEvaluations: { orderBy: { month: "desc" } },
          portfolioMoments: { orderBy: { date: "desc" } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!client) notFound();

  const subscribedPrograms = client.subscriptions.map((s) => s.program);
  const addSubscription = addProgramSubscription.bind(null, client.id);
  const setAccess = setParentAccess.bind(null, client.id);
  const removeAccess = removeParentAccess.bind(null, client.id);

  return (
    <div>
      <Link href="/clientes" style={{ color: "#5c1a4a", fontSize: "0.85rem" }}>
        ← Volver a clientes
      </Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 8 }}>
        <div>
          <h1 style={{ margin: 0 }}>{client.fullName}</h1>
          <p style={{ color: "#64748b", marginTop: 4 }}>
            {formatAge(computeAge(client.birthDate))} · Acudiente: {client.guardianName} · {client.phone}
            {client.email ? ` · ${client.email}` : ""}
          </p>
          {client.notes && <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>{client.notes}</p>}
        </div>
        <Link
          href={`/clientes/${client.id}/editar`}
          style={{ color: "#5c1a4a", fontWeight: 600, fontSize: "0.85rem", whiteSpace: "nowrap" }}
        >
          Editar datos
        </Link>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ fontSize: "1.1rem", margin: 0 }}>Acceso a La Brújula (padres)</h2>
        <Link href={`/brujula-admin/${client.id}`} style={{ color: "#5c1a4a", fontWeight: 600, fontSize: "0.85rem" }}>
          Ver vista previa del panel →
        </Link>
      </div>
      <div style={{ background: "#fff", borderRadius: 12, padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginTop: 12, maxWidth: 480 }}>
        {client.parentAccount ? (
          <>
            <p style={{ fontSize: "0.9rem", color: "#166534", fontWeight: 600, margin: 0 }}>
              ✓ Acceso activo con el teléfono {client.parentAccount.phone}
            </p>
            <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: 4 }}>
              Comparte el teléfono y la contraseña que definiste con el acudiente para que entre en{" "}
              <strong>desqbro.online/brujula/login</strong>. El padre puede cambiarla desde &ldquo;Mi cuenta&rdquo; dentro de su portal.
              Por seguridad, la contraseña no queda visible aquí una vez creada — si la olvida, quita el acceso y crea uno nuevo.
            </p>
            <form action={removeAccess} style={{ marginTop: 10 }}>
              <button
                type="submit"
                style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "0.85rem" }}
              >
                Quitar acceso
              </button>
            </form>
          </>
        ) : (
          <form action={setAccess} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: 0 }}>
              Crea un acceso para que el acudiente vea el progreso, asistencia y pagos de este niño en La Brújula.
            </p>
            <div className="form-row">
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: 6, color: "#334155" }}>Teléfono del padre</label>
                <input
                  name="parentPhone"
                  required
                  defaultValue={client.phone}
                  style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.95rem", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: 6, color: "#334155" }}>Contraseña</label>
                <input
                  name="parentPassword"
                  type="text"
                  required
                  minLength={4}
                  style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.95rem", boxSizing: "border-box" }}
                />
              </div>
            </div>
            <button type="submit" style={{ ...submitButtonStyle, alignSelf: "flex-start" }}>
              Crear acceso
            </button>
          </form>
        )}
      </div>

      <h2 style={{ fontSize: "1.1rem", marginTop: 32 }}>Programas inscritos</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
        {client.subscriptions.length === 0 && <p style={{ color: "#94a3b8" }}>Este cliente aún no tiene programas inscritos.</p>}
        {client.subscriptions.map((sub) => {
          const effectiveStatus = getEffectiveStatus(sub.status, sub.dueDate, today);
          const statusColor = STATUS_COLOR[effectiveStatus];
          const pendiente = sub.payments.filter((p) => p.status === "PENDIENTE");
          const pagado = sub.payments.filter((p) => p.status === "PAGADO");

          return (
            <div key={sub.id} style={{ background: "#fff", borderRadius: 12, padding: "1rem 1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <strong style={{ color: "#3d0f30" }}>{PROGRAM_LABEL[sub.program]}</strong>
                  <span style={{ color: "#64748b", marginLeft: 8, fontSize: "0.9rem" }}>
                    {PLAN_LABEL[sub.planType]}
                    {sub.customAmount && (
                      <span
                        style={{
                          marginLeft: 6,
                          background: "#ede9fe",
                          color: "#6d28d9",
                          padding: "0.1rem 0.4rem",
                          borderRadius: 999,
                          fontSize: "0.65rem",
                          fontWeight: 700,
                        }}
                      >
                        Personalizado
                      </span>
                    )}
                  </span>
                </div>
                <span
                  style={{
                    background: statusColor.bg,
                    color: statusColor.fg,
                    padding: "0.2rem 0.6rem",
                    borderRadius: 999,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                  }}
                >
                  {STATUS_LABEL[effectiveStatus]}
                </span>
              </div>

              <p style={{ fontSize: "0.85rem", color: "#64748b", marginTop: 6 }}>
                Vence: {sub.dueDate.toLocaleDateString("es-CO")} · Pagado: {pagado.length} cuota(s) · Pendiente: {pendiente.length} cuota(s)
              </p>

              {sub.program === "DESQBRO_AQUA" ? (
                <div style={{ marginTop: 12 }}>
                  <SwimTrack level={sub.swimLevel as SwimLevelValue} />
                  {sub.swimLevel !== "EGRESADO" ? (
                    <div style={{ background: "#f8fafc", borderRadius: 8, padding: "0.75rem 0.9rem", marginTop: 10 }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#0369a1", marginBottom: 6 }}>
                        Checklist: {SWIM_TRANSITION_LABEL[sub.swimLevel as SwimLevelValue]} · {countChecked(sub.swimChecklist, SWIM_CRITERIA[sub.swimLevel as SwimLevelValue])}/6 aprobados (se necesitan 4)
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {SWIM_CRITERIA[sub.swimLevel as SwimLevelValue].map((criterion) => {
                          const checked = isChecklistChecked(sub.swimChecklist, criterion.key);
                          return (
                            <form key={criterion.key} action={toggleSwimCriterion.bind(null, sub.id, client.id)}>
                              <input type="hidden" name="criterionKey" value={criterion.key} />
                              <button
                                type="submit"
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  width: "100%",
                                  textAlign: "left",
                                  background: "none",
                                  border: "none",
                                  padding: "0.2rem 0",
                                  cursor: "pointer",
                                  fontSize: "0.85rem",
                                  color: checked ? "#166534" : "#334155",
                                }}
                              >
                                <span>{checked ? "☑" : "☐"}</span>
                                <span style={{ textDecoration: checked ? "line-through" : "none" }}>{criterion.label}</span>
                              </button>
                            </form>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: "0.8rem", color: "#166534", fontWeight: 600, marginTop: 8 }}>
                      🏆 Nivel Expertos completado — egresado del programa.
                    </p>
                  )}
                </div>
              ) : sub.program === "GUAGUAS_SOCCER" ? (
                <GuipasAdminPanel subscription={sub} clientId={client.id} />
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
                  <span style={{ fontSize: "1.3rem" }}>{PROGRESS_BADGE[sub.progressLevel]}</span>
                  <div style={{ flex: 1, maxWidth: 220 }}>
                    <div style={{ background: "#f1f5f9", borderRadius: 999, height: 8, overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${progressPercent(sub.progressLevel)}%`,
                          background: "#ffc814",
                          height: "100%",
                          borderRadius: 999,
                        }}
                      />
                    </div>
                  </div>
                  <form action={updateProgressLevel.bind(null, sub.id, client.id)} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <select
                      name="progressLevel"
                      defaultValue={sub.progressLevel}
                      style={{ padding: "0.25rem 0.5rem", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.8rem" }}
                    >
                      {PROGRESS_LEVELS.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {PROGRESS_LABEL[lvl]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      style={{ background: "#f1f5f9", border: "none", borderRadius: 6, padding: "0.25rem 0.6rem", fontSize: "0.75rem", cursor: "pointer", color: "#334155" }}
                    >
                      Guardar
                    </button>
                  </form>
                </div>
              )}

              <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
                <form action={renewMonthlyPayment}>
                  <input type="hidden" name="id" value={sub.id} />
                  <button
                    type="submit"
                    style={{
                      background: "#ecfdf5",
                      color: "#166534",
                      border: "1px solid #a7f3d0",
                      padding: "0.3rem 0.7rem",
                      borderRadius: 6,
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      cursor: "pointer",
                    }}
                  >
                    Renovar pago ({PLAN_LABEL[sub.planType]})
                  </button>
                </form>
                <Link
                  href={`/clientes/${client.id}/programas/${sub.id}/editar`}
                  style={{ color: "#5c1a4a", fontWeight: 600, fontSize: "0.8rem" }}
                >
                  Editar
                </Link>
                <form action={deleteProgramSubscription}>
                  <input type="hidden" name="id" value={sub.id} />
                  <input type="hidden" name="clientId" value={client.id} />
                  <button
                    type="submit"
                    style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "0.8rem" }}
                  >
                    Quitar programa
                  </button>
                </form>
              </div>

              <details style={{ marginTop: 10 }}>
                <summary style={{ cursor: "pointer", fontSize: "0.8rem", color: "#5c1a4a", fontWeight: 600 }}>
                  Ver pagos ({sub.payments.length})
                </summary>
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                  {sub.payments.map((p) => (
                    <form
                      key={p.id}
                      action={updateSubscriptionPayment.bind(null, p.id, client.id)}
                      style={{
                        display: "flex",
                        gap: 6,
                        alignItems: "center",
                        flexWrap: "wrap",
                        borderBottom: "1px solid #f1f5f9",
                        padding: "4px 0",
                      }}
                    >
                      <input
                        name="concept"
                        defaultValue={p.concept}
                        style={{ padding: "0.3rem 0.4rem", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.75rem", flex: "1 1 140px", minWidth: 120 }}
                      />
                      <input
                        name="date"
                        type="date"
                        defaultValue={toDateInputValue(p.paidAt ?? p.dueDate)}
                        style={{ padding: "0.3rem 0.4rem", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.75rem" }}
                      />
                      <input
                        name="amount"
                        type="number"
                        min={0}
                        step={1000}
                        defaultValue={Number(p.amount)}
                        style={{ padding: "0.3rem 0.4rem", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.75rem", width: 100 }}
                      />
                      <select
                        name="status"
                        defaultValue={p.status}
                        style={{ padding: "0.3rem 0.4rem", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.75rem" }}
                      >
                        <option value="PAGADO">Pagado</option>
                        <option value="PENDIENTE">Pendiente</option>
                      </select>
                      <button
                        type="submit"
                        style={{ background: "#f1f5f9", border: "none", borderRadius: 6, padding: "0.3rem 0.6rem", fontSize: "0.7rem", cursor: "pointer", color: "#334155" }}
                      >
                        Guardar
                      </button>
                      <button
                        type="submit"
                        formAction={deleteSubscriptionPayment}
                        name="id"
                        value={p.id}
                        style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "0.7rem" }}
                      >
                        Eliminar
                      </button>
                      <input type="hidden" name="clientId" value={client.id} />
                    </form>
                  ))}
                </div>

                <form
                  action={addSubscriptionPayment.bind(null, sub.id, client.id)}
                  style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap", marginTop: 12 }}
                >
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", color: "#334155", marginBottom: 4 }}>Concepto</label>
                    <input
                      list={`conceptos-${sub.id}`}
                      name="concept"
                      required
                      style={{ padding: "0.4rem 0.6rem", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                    />
                    <datalist id={`conceptos-${sub.id}`}>
                      {ONE_TIME_FEES.map((f) => (
                        <option key={f.key} value={f.label} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", color: "#334155", marginBottom: 4 }}>Valor</label>
                    <input
                      name="amount"
                      type="number"
                      min={0}
                      step={1000}
                      required
                      style={{ padding: "0.4rem 0.6rem", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.85rem", width: 120 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", color: "#334155", marginBottom: 4 }}>Fecha</label>
                    <input
                      name="date"
                      type="date"
                      required
                      defaultValue={toDateInputValue(new Date())}
                      style={{ padding: "0.4rem 0.6rem", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", color: "#334155", marginBottom: 4 }}>Estado</label>
                    <select
                      name="status"
                      defaultValue="PAGADO"
                      style={{ padding: "0.4rem 0.6rem", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                    >
                      <option value="PAGADO">Pagado</option>
                      <option value="PENDIENTE">Pendiente</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    style={{
                      background: "#ffc814",
                      color: "#3d0f30",
                      border: "none",
                      padding: "0.45rem 0.9rem",
                      borderRadius: 6,
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    Registrar cargo
                  </button>
                </form>
              </details>

              <details style={{ marginTop: 8 }}>
                <summary style={{ cursor: "pointer", fontSize: "0.8rem", color: "#5c1a4a", fontWeight: 600 }}>
                  Notas del formador ({sub.coachNotes.length})
                </summary>
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                  {sub.coachNotes.length === 0 && <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: 0 }}>Sin notas aún.</p>}
                  {sub.coachNotes.map((n) => (
                    <div key={n.id} style={{ background: "#f8fafc", borderRadius: 8, padding: "0.5rem 0.75rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{n.date.toLocaleDateString("es-CO")}</span>
                        <form action={deleteCoachNote}>
                          <input type="hidden" name="id" value={n.id} />
                          <input type="hidden" name="clientId" value={client.id} />
                          <button type="submit" style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "0.75rem" }}>
                            Eliminar
                          </button>
                        </form>
                      </div>
                      <p style={{ fontSize: "0.85rem", color: "#3d0f30", margin: "4px 0 0" }}>{n.note}</p>
                    </div>
                  ))}
                </div>

                <form
                  action={addCoachNote.bind(null, sub.id, client.id)}
                  style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap", marginTop: 12 }}
                >
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", color: "#334155", marginBottom: 4 }}>Fecha</label>
                    <input
                      name="date"
                      type="date"
                      required
                      defaultValue={toDateInputValue(new Date())}
                      style={{ padding: "0.4rem 0.6rem", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <label style={{ display: "block", fontSize: "0.75rem", color: "#334155", marginBottom: 4 }}>Nota</label>
                    <input
                      name="note"
                      required
                      placeholder="Ej: Excelente actitud en clase, mejoró la técnica de..."
                      style={{ width: "100%", padding: "0.4rem 0.6rem", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.85rem", boxSizing: "border-box" }}
                    />
                  </div>
                  <button
                    type="submit"
                    style={{
                      background: "#ffc814",
                      color: "#3d0f30",
                      border: "none",
                      padding: "0.45rem 0.9rem",
                      borderRadius: 6,
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    Agregar nota
                  </button>
                </form>
              </details>
            </div>
          );
        })}
      </div>

      {subscribedPrograms.length < 3 && (
        <>
          <h2 style={{ fontSize: "1.1rem", marginTop: 32 }}>Agregar programa</h2>
          <form
            action={addSubscription}
            style={{ maxWidth: 560, background: "#fff", padding: "1.5rem", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginTop: 12 }}
          >
            <SubscriptionFields excludePrograms={subscribedPrograms} />
            <button type="submit" style={submitButtonStyle}>
              Inscribir en este programa
            </button>
          </form>
        </>
      )}
    </div>
  );
}
