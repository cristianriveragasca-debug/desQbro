import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const [totalClientes, activos, futbol, natacion] = await Promise.all([
    prisma.client.count(),
    prisma.client.count({ where: { status: "ACTIVO" } }),
    prisma.client.count({ where: { sport: "FUTBOL" } }),
    prisma.client.count({ where: { sport: "NATACION" } }),
  ]);

  const cards = [
    { label: "Total clientes", value: totalClientes },
    { label: "Activos", value: activos },
    { label: "Fútbol", value: futbol },
    { label: "Natación", value: natacion },
  ];

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Panel General</h1>
      <p style={{ color: "#64748b" }}>Resumen de tu escuela de formación deportiva.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginTop: 24 }}>
        {cards.map((c) => (
          <div
            key={c.label}
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "1.25rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ fontSize: "0.85rem", color: "#64748b" }}>{c.label}</div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#3d0f30" }}>{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
