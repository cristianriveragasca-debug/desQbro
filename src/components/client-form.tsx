type ClientFormValues = {
  fullName: string;
  phone: string;
  email: string;
  sport: string;
  guardianName: string;
  notes: string;
  status: string;
};

export function ClientForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  defaultValues?: Partial<ClientFormValues>;
  submitLabel: string;
}) {
  return (
    <form action={action} style={{ maxWidth: 480, background: "#fff", padding: "1.5rem", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
      <Field label="Nombre completo *">
        <input name="fullName" required defaultValue={defaultValues?.fullName} style={input} />
      </Field>

      <Field label="Teléfono (WhatsApp) *">
        <input name="phone" required defaultValue={defaultValues?.phone} style={input} placeholder="+57..." />
      </Field>

      <Field label="Correo">
        <input name="email" type="email" defaultValue={defaultValues?.email} style={input} />
      </Field>

      <Field label="Deporte *">
        <select name="sport" defaultValue={defaultValues?.sport ?? "FUTBOL"} style={input}>
          <option value="FUTBOL">Fútbol</option>
          <option value="NATACION">Natación</option>
        </select>
      </Field>

      <Field label="Nombre del acudiente (si es menor de edad)">
        <input name="guardianName" defaultValue={defaultValues?.guardianName} style={input} />
      </Field>

      <Field label="Estado">
        <select name="status" defaultValue={defaultValues?.status ?? "ACTIVO"} style={input}>
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
          <option value="SUSPENDIDO">Suspendido</option>
        </select>
      </Field>

      <Field label="Notas">
        <textarea name="notes" defaultValue={defaultValues?.notes} style={{ ...input, minHeight: 80 }} />
      </Field>

      <button
        type="submit"
        style={{
          background: "#ffc814",
          color: "#3d0f30",
          border: "none",
          padding: "0.7rem 1.25rem",
          borderRadius: 8,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {submitLabel}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ display: "block", fontSize: "0.85rem", marginBottom: 6, color: "#334155" }}>{label}</label>
      {children}
    </div>
  );
}

const input: React.CSSProperties = {
  width: "100%",
  padding: "0.6rem 0.75rem",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  fontSize: "0.95rem",
  boxSizing: "border-box",
  fontFamily: "inherit",
};
