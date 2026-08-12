import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { changeParentPassword } from "../actions";

export default async function BrujulaCuentaPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/brujula/login");

  const account = await prisma.parentAccount.findUnique({ where: { id: userId } });
  if (!account) redirect("/brujula/login");

  return (
    <div>
      <h1 style={{ marginTop: 0, color: "#3d0f30" }}>Mi cuenta</h1>
      <p style={{ color: "#64748b" }}>Teléfono de acceso: {account.phone}</p>

      <div style={{ background: "#fff", borderRadius: 12, padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginTop: 20, maxWidth: 420 }}>
        <h2 style={{ fontSize: "1rem", marginTop: 0, color: "#3d0f30" }}>Cambiar contraseña</h2>
        <form action={changeParentPassword} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <label style={label}>Contraseña actual</label>
            <input name="currentPassword" type="password" required style={input} />
          </div>
          <div>
            <label style={label}>Nueva contraseña</label>
            <input name="newPassword" type="password" required minLength={4} style={input} />
          </div>
          <div>
            <label style={label}>Confirmar nueva contraseña</label>
            <input name="confirmPassword" type="password" required minLength={4} style={input} />
          </div>
          <button
            type="submit"
            style={{ background: "#ffc814", color: "#3d0f30", border: "none", padding: "0.6rem 1rem", borderRadius: 8, fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", alignSelf: "flex-start" }}
          >
            Guardar nueva contraseña
          </button>
        </form>
      </div>
    </div>
  );
}

const label: React.CSSProperties = { display: "block", fontSize: "0.85rem", marginBottom: 6, color: "#334155" };
const input: React.CSSProperties = { width: "100%", padding: "0.6rem 0.75rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.95rem", boxSizing: "border-box" };
