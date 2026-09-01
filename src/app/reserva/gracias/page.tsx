import Image from "next/image";

export default function ReservaGraciasPage() {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoWrap}>
          <Image src="/logo.jpeg" alt="desQbro" width={220} height={92} style={{ width: "100%", height: "auto" }} priority />
        </div>
        <h1 style={styles.title}>¡Listo!</h1>
        <p style={styles.text}>
          Recibimos tus datos. Muy pronto uno de nuestros formadores te va a contactar para agendar la clase de experiencia
          de tu bebé.
        </p>
      </div>
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
    textAlign: "center",
  },
  logoWrap: { maxWidth: 220, margin: "0 auto" },
  title: { color: "#166534", marginTop: 16, marginBottom: 10, fontSize: "1.5rem" },
  text: { color: "#334155", fontSize: "0.95rem", lineHeight: 1.5 },
};
