import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const today = new Date();

  const [totalClientes, activos, vencidos, inactivos, bebes, aqua, soccer, mensual, trimestral, semestral] = await Promise.all([
    prisma.client.count(),
    prisma.programSubscription.count({ where: { status: { not: "INACTIVO" }, dueDate: { gte: today } } }),
    prisma.programSubscription.count({ where: { status: { not: "INACTIVO" }, dueDate: { lt: today } } }),
    prisma.programSubscription.count({ where: { status: "INACTIVO" } }),
    prisma.programSubscription.count({ where: { program: "DESQBRO_BEBES" } }),
    prisma.programSubscription.count({ where: { program: "DESQBRO_AQUA" } }),
    prisma.programSubscription.count({ where: { program: "GUAGUAS_SOCCER" } }),
    prisma.programSubscription.count({ where: { planType: "MENSUAL", status: { not: "INACTIVO" } } }),
    prisma.programSubscription.count({ where: { planType: "TRIMESTRAL", status: { not: "INACTIVO" } } }),
    prisma.programSubscription.count({ where: { planType: "SEMESTRAL", status: { not: "INACTIVO" } } }),
  ]);

  const cards = [
    { label: "Total clientes", value: totalClientes, color: "#3d0f30" },
    { label: "Programas activos", value: activos, color: "#166534" },
    { label: "Programas vencidos", value: vencidos, color: "#dc2626" },
    { label: "Programas inactivos", value: inactivos, color: "#64748b" },
    { label: "desQbro Bebés", value: bebes, color: "#3d0f30" },
    { label: "desQbro AQUA", value: aqua, color: "#3d0f30" },
    { label: "Güipas Soccer", value: soccer, color: "#3d0f30" },
  ];

  const planCards = [
    { label: "Plan Mensual", value: mensual, color: "#3d0f30" },
    { label: "Plan Trimestral", value: trimestral, color: "#3d0f30" },
    { label: "Plan Semestral", value: semestral, color: "#3d0f30" },
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
            <div style={{ fontSize: "2rem", fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: "1.05rem", marginTop: 28, marginBottom: 12, color: "#3d0f30" }}>Niños por tipo de plan</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        {planCards.map((c) => (
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
            <div style={{ fontSize: "2rem", fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
