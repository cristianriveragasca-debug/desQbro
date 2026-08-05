import { DAY_LABELS, PROGRAM_LABEL } from "@/lib/schedule";

type ClassFormValues = {
  name: string;
  program: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  capacity: number;
};

export function ClassForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  defaultValues?: Partial<ClassFormValues>;
  submitLabel: string;
}) {
  return (
    <form action={action} style={{ maxWidth: 480, background: "#fff", padding: "1.5rem", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
      <Field label="Nombre de la clase *">
        <input name="name" required defaultValue={defaultValues?.name} style={input} placeholder="Ej: Fútbol Sub-8 - Tarde" />
      </Field>

      <Field label="Programa *">
        <select name="program" defaultValue={defaultValues?.program ?? "DESQBRO_BEBES"} style={input}>
          {Object.entries(PROGRAM_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Día de la semana *">
        <select name="dayOfWeek" defaultValue={defaultValues?.dayOfWeek ?? 1} style={input}>
          {DAY_LABELS.map((label, idx) => (
            <option key={idx} value={idx}>
              {label}
            </option>
          ))}
        </select>
      </Field>

      <Row>
        <Field label="Hora de inicio *">
          <input name="startTime" type="time" required defaultValue={defaultValues?.startTime} style={input} />
        </Field>
        <Field label="Hora de fin *">
          <input name="endTime" type="time" required defaultValue={defaultValues?.endTime} style={input} />
        </Field>
      </Row>

      <Field label="Cupo máximo">
        <input name="capacity" type="number" min={1} defaultValue={defaultValues?.capacity ?? 20} style={input} />
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

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>;
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
