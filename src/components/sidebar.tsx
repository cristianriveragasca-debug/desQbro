"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { SignOutButton } from "@/components/sign-out-button";

const NAV_ITEMS = [
  { href: "/", label: "Inicio", enabled: true },
  { href: "/clientes", label: "Clientes", enabled: true },
  { href: "/clases", label: "Agendamiento de Clases", enabled: true },
  { href: "/asistencia", label: "Asistencia", enabled: true },
  { href: "/financiero", label: "Financiero", enabled: true },
  { href: "/marketing", label: "Marketing WhatsApp", enabled: false },
];

export function Sidebar({ userName }: { userName: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="app-topbar">
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          style={{
            background: "none",
            border: "none",
            color: "#fff",
            fontSize: "1.5rem",
            cursor: "pointer",
            lineHeight: 1,
            padding: 4,
          }}
        >
          ☰
        </button>
        <div style={{ background: "#fff", borderRadius: 8, padding: "0.3rem 0.5rem" }}>
          <Image src="/logo.jpeg" alt="desQbro" width={100} height={42} style={{ height: 28, width: "auto", display: "block" }} priority />
        </div>
        <div style={{ width: 28 }} />
      </div>

      <div className={`drawer-overlay ${open ? "open" : ""}`} onClick={() => setOpen(false)} />

      <aside
        className={`app-sidebar ${open ? "open" : ""}`}
        style={{
          background: "linear-gradient(180deg, #3d0f30 0%, #5c1a4a 100%)",
          color: "#fff",
          padding: "1.5rem 1rem",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ background: "#fff", borderRadius: 10, padding: "0.6rem 0.75rem", marginBottom: "2rem" }}>
          <Image src="/logo.jpeg" alt="desQbro" width={200} height={84} style={{ width: "100%", height: "auto", display: "block" }} priority />
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {NAV_ITEMS.map((item) =>
            item.enabled ? (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                style={{
                  color: "#f1e6ee",
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
                  color: "#a97a9a",
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
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: "1rem", marginTop: "1rem" }}>
          <div style={{ fontSize: "0.85rem", marginBottom: 8, color: "#fff" }}>{userName}</div>
          <SignOutButton />
        </div>
      </aside>
    </>
  );
}
