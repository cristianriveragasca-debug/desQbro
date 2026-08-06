import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="app-shell">
      <Sidebar userName={session.user?.name ?? ""} />
      <main className="app-main">{children}</main>
    </div>
  );
}
