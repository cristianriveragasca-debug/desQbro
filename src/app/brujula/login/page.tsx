"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function BrujulaLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("parent", {
      phone,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Teléfono o contraseña incorrectos");
      return;
    }

    router.push("/brujula");
    router.refresh();
  }

  return (
    <div style={styles.page}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <div style={styles.logoWrap}>
          <Image src="/logo.jpeg" alt="desQbro" width={220} height={92} style={{ width: "100%", height: "auto" }} priority />
        </div>
        <h1 style={styles.title}>La Brújula</h1>
        <p style={styles.subtitle}>Portal de padres de familia</p>

        <label style={styles.label}>Teléfono</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          style={styles.input}
          placeholder="+57..."
        />

        <label style={styles.label}>Contraseña</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={styles.input} />

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(160deg, #3d0f30 0%, #5c1a4a 100%)",
    fontFamily: "system-ui, sans-serif",
  },
  card: {
    background: "#fff",
    padding: "2.5rem",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "380px",
    boxShadow: "0 20px 45px rgba(0,0,0,0.35)",
  },
  logoWrap: { maxWidth: 220, margin: "0 auto" },
  title: { textAlign: "center", color: "#3d0f30", marginTop: 16, marginBottom: 2 },
  subtitle: { marginTop: 4, marginBottom: 28, color: "#64748b", fontSize: "0.9rem", textAlign: "center" },
  label: { display: "block", fontSize: "0.85rem", marginBottom: 6, color: "#334155" },
  input: {
    width: "100%",
    padding: "0.6rem 0.75rem",
    marginBottom: "1rem",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "1rem",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: "0.7rem",
    background: "#ffc814",
    color: "#3d0f30",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: 700,
    cursor: "pointer",
    marginTop: "0.5rem",
  },
  error: { color: "#dc2626", fontSize: "0.85rem", marginBottom: "1rem" },
};
