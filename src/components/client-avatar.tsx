export function ClientAvatar({ name, photo, size = 72 }: { name: string; photo?: string | null; size?: number }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={photo}
        alt={name}
        width={size}
        height={size}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "3px solid #ffc814", flexShrink: 0 }}
      />
    );
  }

  return (
    <div
      aria-label={name}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #5c1a4a, #3d0f30)",
        color: "#ffc814",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.36,
        border: "3px solid #ffc814",
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}
