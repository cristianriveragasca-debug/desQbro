import { ClassForm } from "@/components/class-form";
import { createClassGroup } from "../actions";

export default function NuevaClasePage() {
  return (
    <div>
      <h1>Nueva clase</h1>
      <ClassForm action={createClassGroup} submitLabel="Crear clase" />
    </div>
  );
}
