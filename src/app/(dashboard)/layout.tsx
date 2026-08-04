import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/", label: "Inicio", enabled: true },
  { href: "/clientes", label: "Clientes", enabled: true },
  { href: "/clases", label: "Agendamiento de Clases", enabled: false },
  { href: "/asistencia", label: "Asistencia", enabled: false },
  { href: "/financiero", label: "Financiero", enabled: false },
  { href: "/marketing", label: "Marketing WhatsApp", enabled: false },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <aside
        style={{
          width: 240,
          background: "#0f172a",
          color: "#fff",
          padding: "1.5rem 1rem",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.25rem" }}>desQbro</div>
        <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "2rem" }}>
          Escuela de Formación Deportiva
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {NAV_ITEMS.map((item) =>
            item.enabled ? (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  color: "#e2e8f0",
                  textDecoration: "none",
                  padding: "0.6rem 0.75rem",
                  borderRadius: 8,
                  fontSize: "0.9rem",
                }}
              >
                {item.label}
              </Link>
            ) : (
              <span
                key={item.href}
                style={{
                  color: "#475569",
                  padding: "0.6rem 0.75rem",
                  fontSize: "0.9rem",
                  cursor: "default",
                }}
                title="Próximamente"
              >
                {item.label} <small>(próximamente)</small>
              </span>
            )
          )}
        </nav>
        <div style={{ borderTop: "1px solid #1e293b", paddingTop: "1rem", marginTop: "1rem" }}>
          <div style={{ fontSize: "0.85rem", marginBottom: 8 }}>{session.user?.name}</div>
          <SignOutButton />
        </div>
      </aside>
      <main style={{ flex: 1, background: "#f8fafc", padding: "2rem" }}>{children}</main>
    </div>
  );
}
