"use client";

import { useRef, useState, useTransition } from "react";
import { ClientAvatar } from "@/components/client-avatar";

const SIZE = 256;

function resizeToSquareJpeg(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("canvas"));
        return;
      }
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      ctx.drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image"));
    };
    img.src = url;
  });
}

export function PhotoUploader({
  clientId,
  name,
  photo,
  action,
}: {
  clientId: string;
  name: string;
  photo?: string | null;
  action: (clientId: string, dataUrl: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    try {
      const dataUrl = await resizeToSquareJpeg(file);
      setPreview(dataUrl);
      startTransition(async () => {
        const result = await action(clientId, dataUrl);
        if (!result.ok) {
          setPreview(null);
          setError(result.error ?? "No se pudo guardar la foto");
        }
      });
    } catch {
      setError("No pudimos leer esa imagen. Prueba con otra foto.");
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ position: "relative" }}>
        <ClientAvatar name={name} photo={preview ?? photo} size={84} />
        {pending && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.65)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.7rem",
              color: "#3d0f30",
              fontWeight: 700,
            }}
          >
            Subiendo…
          </div>
        )}
      </div>
      <div>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          style={{
            background: "#ffc814",
            color: "#3d0f30",
            border: "none",
            borderRadius: 8,
            padding: "0.45rem 0.9rem",
            fontWeight: 700,
            fontSize: "0.8rem",
            cursor: pending ? "default" : "pointer",
          }}
        >
          {photo || preview ? "Cambiar foto" : "Subir foto"}
        </button>
        {error && <p style={{ color: "#dc2626", fontSize: "0.75rem", margin: "6px 0 0" }}>{error}</p>}
      </div>
    </div>
  );
}
