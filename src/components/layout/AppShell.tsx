import { useMemo, useState } from "react"
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import { useTheme } from "next-themes"
import {
  Bell,
  FileCheck2,
  LayoutDashboard,
  Menu,
  Moon,
  Scale,
  Search,
  Settings,
  Store,
  Sun,
  Users,
  Vault,
  Wallet,
  BarChart3,
  BadgeCheck,
  Coins,
  Landmark,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useAppState } from "@/store/AppStore"
import { cn } from "@/lib/utils"

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/gold", label: "Gold", icon: Coins },
  { to: "/financing", label: "Financing", icon: Landmark },
  { to: "/certificates", label: "Certificates", icon: BadgeCheck },
  { to: "/payments", label: "Payments", icon: Wallet },
  { to: "/vault", label: "Vault", icon: Vault },
  { to: "/marketplace", label: "Marketplace", icon: Store },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/compliance", label: "Compliance", icon: Scale },
  { to: "/settings", label: "Settings", icon: Settings },
]

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5 px-3">
      {NAV.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
              )
            }
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        )
      })}
    </nav>
  )
}

function Brand() {
  return (
    <Link to="/dashboard" className="flex items-center gap-3 px-5 py-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold text-gold-foreground">
        <FileCheck2 className="h-5 w-5" />
      </div>
      <div>
        <p className="font-serif text-lg leading-none text-sidebar-foreground">OneGold</p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-sidebar-foreground/55">Ar-Rahnu desk</p>
      </div>
    </Link>
  )
}

export function AppShell() {
  const { settings, customers, goldItems, financings, certificates, auctions } = useAppState()
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const navigate = useNavigate()
  const location = useLocation()

  const hits = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    const rows: { label: string; to: string }[] = []
    customers.forEach((c) => {
      if (c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)) {
        rows.push({ label: `Customer · ${c.name}`, to: `/customers/${c.id}` })
      }
    })
    goldItems.forEach((g) => {
      if (g.id.toLowerCase().includes(q) || g.description.toLowerCase().includes(q)) {
        rows.push({ label: `Gold · ${g.id}`, to: `/gold/${g.id}` })
      }
    })
    financings.forEach((f) => {
      if (f.id.toLowerCase().includes(q)) rows.push({ label: `Financing · ${f.id}`, to: `/financing/${f.id}` })
    })
    certificates.forEach((c) => {
      if (c.id.toLowerCase().includes(q) || c.verificationId.toLowerCase().includes(q)) {
        rows.push({ label: `Certificate · ${c.id}`, to: `/certificates/${c.id}` })
      }
    })
    auctions.forEach((a) => {
      if (a.id.toLowerCase().includes(q) || a.certificateId.toLowerCase().includes(q)) {
        rows.push({ label: `Auction · ${a.id}`, to: `/marketplace/auctions/${a.id}` })
      }
    })
    return rows.slice(0, 8)
  }, [query, customers, goldItems, financings, certificates, auctions])

  return (
    <div className="flex min-h-svh bg-background">
      <aside className="no-print hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <Brand />
        <div className="flex-1 overflow-y-auto pb-6">
          <NavItems />
        </div>
        <div className="border-t border-sidebar-border px-5 py-4">
          <p className="text-xs font-medium text-sidebar-foreground">{settings.shopName}</p>
          <p className="text-xs text-sidebar-foreground/60">{settings.shopLocation}</p>
        </div>
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 bg-sidebar p-0 text-sidebar-foreground">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <Brand />
          <NavItems onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customers, gold, certificates…"
              className="pl-9"
            />
            {hits.length > 0 ? (
              <div className="absolute top-full z-40 mt-1 w-full overflow-hidden rounded-lg border bg-popover shadow-md">
                {hits.map((h) => (
                  <button
                    key={h.to}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-accent"
                    onClick={() => {
                      navigate(h.to)
                      setQuery("")
                    }}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              <Sun className="h-4 w-4 dark:hidden" />
              <Moon className="hidden h-4 w-4 dark:block" />
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link to="/compliance">
                <Bell className="h-4 w-4" />
              </Link>
            </Button>
            <div className="hidden items-center gap-2 rounded-full border px-2 py-1 sm:flex">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                OP
              </div>
              <span className="pr-1 text-xs font-medium">Operator</span>
            </div>
          </div>
        </header>
        <main key={location.pathname} className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
