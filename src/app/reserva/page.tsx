import Image from "next/image";
import { createTrialRequest } from "./actions";

export default function ReservaPage() {
  return (
    <div style={styles.page}>
      <form action={createTrialRequest} style={styles.card}>
        <div style={styles.logoWrap}>
          <Image src="/logo.jpeg" alt="desQbro" width={220} height={92} style={{ width: "100%", height: "auto" }} priority />
        </div>
        <h1 style={styles.title}>Reserva tu clase de experiencia</h1>
        <p style={styles.subtitle}>desQbro Bebés — cuéntanos de tu bebé y te contactaremos para agendar</p>

        <label style={styles.label}>Nombre del acudiente *</label>
        <input name="guardianName" required style={styles.input} />

        <label style={styles.label}>Nombre del bebé *</label>
        <input name="babyName" required style={styles.input} />

        <label style={styles.label}>Fecha de nacimiento *</label>
        <input name="birthDate" type="date" required style={styles.input} />

        <label style={styles.label}>Dirección *</label>
        <input name="address" required style={styles.input} placeholder="Barrio, dirección" />

        <label style={styles.label}>Contacto (celular) *</label>
        <input name="phone" type="tel" required style={styles.input} placeholder="+57..." />

        <label style={styles.label}>Correo electrónico</label>
        <input name="email" type="email" style={styles.input} />

        <button type="submit" style={styles.button}>
          Reservar clase de experiencia
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
    padding: "2rem 1rem",
  },
  card: {
    background: "#fff",
    padding: "2.5rem",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 20px 45px rgba(0,0,0,0.35)",
  },
  logoWrap: { maxWidth: 220, margin: "0 auto" },
  title: { textAlign: "center", color: "#3d0f30", marginTop: 16, marginBottom: 2, fontSize: "1.3rem" },
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
};
