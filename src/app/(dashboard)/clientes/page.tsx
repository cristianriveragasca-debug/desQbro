import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteClient } from "./actions";
import { computeAge, formatAge } from "@/lib/dates";

const PROGRAM_LABEL: Record<string, string> = {
  DESQBRO_BEBES: "desQbro Bebés",
  DESQBRO_AQUA: "desQbro AQUA",
  GUAGUAS_SOCCER: "Guaguas Soccer",
};
const PLAN_LABEL: Record<string, string> = {
  MENSUAL: "Mensual",
  TRIMESTRAL: "Trimestral",
  SEMESTRAL: "Semestral",
};
const STATUS_LABEL: Record<string, string> = {
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
  SUSPENDIDO: "Suspendido",
};

export default async function ClientesPage() {
  const clients = await prisma.client.findMany({ orderBy: { createdAt: "desc" } });
  const today = new Date();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Clientes</h1>
        <Link
          href="/clientes/nuevo"
          style={{
            background: "#ffc814",
            color: "#3d0f30",
            padding: "0.6rem 1rem",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: "0.9rem",
            fontWeight: 700,
          }}
        >
          + Nuevo cliente
        </Link>
      </div>

      <div style={{ marginTop: 24, background: "#fff", borderRadius: 12, overflow: "auto", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
              <th style={th}>Nombre</th>
              <th style={th}>Edad</th>
              <th style={th}>Acudiente</th>
              <th style={th}>Teléfono</th>
              <th style={th}>Programa</th>
              <th style={th}>Plan</th>
              <th style={th}>Vence</th>
              <th style={th}>Estado</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 && (
              <tr>
                <td colSpan={9} style={{ ...td, textAlign: "center", color: "#94a3b8" }}>
                  Aún no hay clientes registrados.
                </td>
              </tr>
            )}
            {clients.map((c) => {
              const overdue = c.dueDate < today;
              return (
                <tr key={c.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                  <td style={td}>{c.fullName}</td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>{formatAge(computeAge(c.birthDate))}</td>
                  <td style={td}>{c.guardianName}</td>
                  <td style={td}>{c.phone}</td>
                  <td style={td}>{PROGRAM_LABEL[c.program]}</td>
                  <td style={td}>{PLAN_LABEL[c.planType]}</td>
                  <td style={{ ...td, color: overdue ? "#dc2626" : "#3d0f30", fontWeight: overdue ? 700 : 400, whiteSpace: "nowrap" }}>
                    {c.dueDate.toLocaleDateString("es-CO")}
                  </td>
                  <td style={td}>{STATUS_LABEL[c.status]}</td>
                  <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                    <Link href={`/clientes/${c.id}/editar`} style={{ color: "#5c1a4a", fontWeight: 600, marginRight: 12, fontSize: "0.85rem" }}>
                      Editar
                    </Link>
                    <form action={deleteClient} style={{ display: "inline" }}>
                      <input type="hidden" name="id" value={c.id} />
                      <button
                        type="submit"
                        style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "0.85rem" }}
                      >
                        Eliminar
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th: React.CSSProperties = { padding: "0.75rem 1rem", fontWeight: 600, color: "#334155" };
const td: React.CSSProperties = { padding: "0.75rem 1rem", color: "#3d0f30" };
