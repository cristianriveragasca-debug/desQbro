"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      style={{
        width: "100%",
        padding: "0.5rem",
        background: "#ffc814",
        color: "#3d0f30",
        border: "none",
        borderRadius: 6,
        cursor: "pointer",
        fontSize: "0.85rem",
        fontWeight: 600,
      }}
    >
      Cerrar sesión
    </button>
  );
}
