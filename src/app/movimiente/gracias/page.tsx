import Image from "next/image";

const WHATSAPP_NUMBER = "573244702095";
const WHATSAPP_MESSAGE = encodeURIComponent(
  "Hola, acabo de inscribir a mi hijo/a en Movimente (Semana de Vacaciones Recreativas desQbro) y quisiera conocer los medios de pago."
);

export default function MovimienteGraciasPage() {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoWrap}>
          <Image src="/logo.jpeg" alt="desQbro" width={220} height={92} style={{ width: "100%", height: "auto" }} priority />
        </div>
        <h1 style={styles.title}>¡Gracias por la información!</h1>
        <p style={styles.text}>
          Ya recibimos la inscripción a <strong>Movimente</strong>. El siguiente paso es realizar el pago: escríbenos a
          nuestro WhatsApp y solicita nuestros medios de pago.
        </p>
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.button}
        >
          Escribir por WhatsApp
        </a>
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
  title: { color: "#166534", marginTop: 16, marginBottom: 10, fontSize: "1.4rem" },
  text: { color: "#334155", fontSize: "0.95rem", lineHeight: 1.5, marginBottom: 24 },
  button: {
    display: "block",
    width: "100%",
    padding: "0.75rem",
    background: "#25D366",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: 700,
    textDecoration: "none",
    boxSizing: "border-box",
  },
};
