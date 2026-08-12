import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";

export default async function BrujulaLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "PARENT") redirect("/brujula/login");

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, sans-serif" }}>
      <header
        style={{
          background: "linear-gradient(90deg, #3d0f30 0%, #5c1a4a 100%)",
          padding: "0.75rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <Link href="/brujula" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "#fff", borderRadius: 8, padding: "0.3rem 0.5rem" }}>
            <Image src="/logo.jpeg" alt="desQbro" width={100} height={42} style={{ height: 28, width: "auto", display: "block" }} priority />
          </div>
          <span style={{ color: "#fff", fontWeight: 700 }}>La Brújula</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Link href="/brujula/cuenta" style={{ color: "#f1e6ee", fontSize: "0.85rem", textDecoration: "none" }}>
            Mi cuenta
          </Link>
          <div style={{ width: 140 }}>
            <SignOutButton callbackUrl="/brujula/login" />
          </div>
        </div>
      </header>
      <main style={{ padding: "1.5rem", maxWidth: 900, margin: "0 auto" }}>{children}</main>
    </div>
  );
}
