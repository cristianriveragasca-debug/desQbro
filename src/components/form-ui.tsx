export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontSize: "0.8rem",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        color: "#5c1a4a",
        margin: "1.25rem 0 0.75rem",
        borderBottom: "1px solid #f1e6ee",
        paddingBottom: 6,
      }}
    >
      {children}
    </h3>
  );
}

export function Row({ children }: { children: React.ReactNode }) {
  return <div className="form-row">{children}</div>;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ display: "block", fontSize: "0.85rem", marginBottom: 6, color: "#334155" }}>{label}</label>
      {children}
    </div>
  );
}

export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.6rem 0.75rem",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  fontSize: "0.95rem",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

export function money(n: number) {
  return n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

export const submitButtonStyle: React.CSSProperties = {
  background: "#ffc814",
  color: "#3d0f30",
  border: "none",
  padding: "0.7rem 1.25rem",
  borderRadius: 8,
  fontWeight: 700,
  cursor: "pointer",
};
