import { ClientForm } from "@/components/client-form";
import { createClient } from "../actions";

export default function NuevoClientePage() {
  return (
    <div>
      <h1>Nuevo cliente</h1>
      <ClientForm action={createClient} submitLabel="Crear cliente" />
    </div>
  );
}
