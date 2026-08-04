"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      style={{
        width: "100%",
        padding: "0.5rem",
        background: "#1e293b",
        color: "#e2e8f0",
        border: "none",
        borderRadius: 6,
        cursor: "pointer",
        fontSize: "0.85rem",
      }}
    >
      Cerrar sesión
    </button>
  );
}
