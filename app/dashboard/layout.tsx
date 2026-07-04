import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import MobileNav from "@/components/MobileNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg-base)" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <Topbar />
        <main className="dashboard-main-scroll" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", minWidth: 0 }}>
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
