import { prisma } from "@/lib/prisma";
import { computeAge, formatAge } from "@/lib/dates";
import { updateMovimienteStatus, deleteMovimienteRegistration } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  PENDIENTE_PAGO: "Pendiente de pago",
  PAGADO: "Pagado",
  CANCELADO: "Cancelado",
};
const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  PENDIENTE_PAGO: { bg: "#fef3c7", fg: "#92400e" },
  PAGADO: { bg: "#dcfce7", fg: "#166534" },
  CANCELADO: { bg: "#f1f5f9", fg: "#64748b" },
};

export default async function MovimienteAdminPage() {
  const registrations = await prisma.movimienteRegistration.findMany({ orderBy: { createdAt: "desc" } });
  const today = new Date();
  const paidCount = registrations.filter((r) => r.status === "PAGADO").length;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Movimente</h1>
      <p style={{ color: "#64748b" }}>Inscripciones a la Semana de Vacaciones Recreativas desQbro.</p>

      <div style={{ background: "#fff", borderRadius: 12, padding: "1rem 1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginTop: 16, maxWidth: 520 }}>
        <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>Comparte este enlace con los padres interesados:</p>
        <p style={{ fontSize: "0.95rem", color: "#5c1a4a", fontWeight: 700, margin: "6px 0 0", wordBreak: "break-all" }}>
          desqbro.online/movimiente
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginTop: 20 }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: "1.1rem 1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Total inscritos</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#3d0f30" }}>{registrations.length}</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 12, padding: "1.1rem 1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Pagados</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#166534" }}>{paidCount}</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 12, padding: "1.1rem 1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Pendientes de pago</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#92400e" }}>{registrations.length - paidCount}</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
        {registrations.length === 0 && (
          <p style={{ fontSize: "0.85rem", color: "#94a3b8", background: "#fff", borderRadius: 12, padding: "1rem" }}>
            Aún no hay inscripciones registradas.
          </p>
        )}
        {registrations.map((r) => {
          const statusColor = STATUS_COLOR[r.status];
          return (
            <div key={r.id} style={{ background: "#fff", borderRadius: 12, padding: "1rem 1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <strong style={{ color: "#3d0f30" }}>{r.childName}</strong>
                  <span style={{ color: "#64748b", marginLeft: 8, fontSize: "0.85rem" }}>{formatAge(computeAge(r.birthDate, today))}</span>
                  <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: 2 }}>
                    Acudiente: {r.guardianName} · {r.phone}
                    {r.email ? ` · ${r.email}` : ""}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: 2 }}>
                    Emergencia: {r.emergencyContactName} · {r.emergencyContactPhone}
                    {r.eps ? ` · EPS: ${r.eps}` : ""}
                  </div>
                  {r.medicalNotes && <div style={{ fontSize: "0.8rem", color: "#dc2626", marginTop: 2 }}>⚠ {r.medicalNotes}</div>}
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 2 }}>
                    {r.imageConsent ? "✓ Autoriza fotos/videos" : "✗ No autoriza fotos/videos"}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <span style={{ background: statusColor.bg, color: statusColor.fg, padding: "0.2rem 0.6rem", borderRadius: 999, fontSize: "0.75rem", fontWeight: 600 }}>
                    {STATUS_LABEL[r.status]}
                  </span>
                  <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{r.createdAt.toLocaleDateString("es-CO")}</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap", marginTop: 12 }}>
                <form action={updateMovimienteStatus.bind(null, r.id)} style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap", flex: 1 }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", color: "#334155", marginBottom: 4 }}>Estado</label>
                    <select name="status" defaultValue={r.status} style={{ padding: "0.4rem 0.6rem", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.85rem" }}>
                      {Object.entries(STATUS_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <label style={{ display: "block", fontSize: "0.75rem", color: "#334155", marginBottom: 4 }}>Nota de seguimiento</label>
                    <input
                      name="notes"
                      defaultValue={r.notes ?? ""}
                      placeholder="Ej: Confirmó pago por Nequi el martes"
                      style={{ width: "100%", padding: "0.4rem 0.6rem", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.85rem", boxSizing: "border-box" }}
                    />
                  </div>
                  <button
                    type="submit"
                    style={{ background: "#f1f5f9", border: "none", borderRadius: 6, padding: "0.4rem 0.8rem", fontSize: "0.8rem", cursor: "pointer", color: "#334155" }}
                  >
                    Guardar
                  </button>
                </form>
                <form action={deleteMovimienteRegistration}>
                  <input type="hidden" name="id" value={r.id} />
                  <button type="submit" style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "0.8rem" }}>
                    Eliminar
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
