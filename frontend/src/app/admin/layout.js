import AdminSidebar from "@/components/admin/sidebar"
import ThemeSelector from "@/components/admin/theme-selector"
import UserMenu from "@/components/admin/user-menu"

export default function AdminLayout({ children }) {
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--color-background)" }}
    >
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header
          className="flex items-center justify-between px-6 py-3 flex-shrink-0 border-b"
          style={{
            background:  "var(--color-surface)",
            borderColor: "var(--color-border)",
            boxShadow:   "var(--shadow-xs)",
          }}
        >
          <p
            className="text-xs font-medium"
            style={{ color: "var(--color-foreground-muted)" }}
          >
            Sistema de gestión nutricional
          </p>

          <div className="flex items-center gap-3">
            <ThemeSelector />
            <UserMenu />
          </div>
        </header>

        {/* Scroll area */}
        <main className="flex-1 overflow-y-auto scrollbar-thin p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
