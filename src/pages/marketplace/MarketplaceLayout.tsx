import { NavLink, Outlet } from "react-router-dom"
import { cn } from "@/lib/utils"

const LINKS = [
  { to: "/marketplace", label: "Directory", end: true },
  { to: "/marketplace/auctions", label: "Auction marketplace", end: true },
  { to: "/marketplace/auctions/new", label: "Create auction", end: false },
  { to: "/marketplace/bids", label: "My bids", end: true },
  { to: "/marketplace/won", label: "Won auctions", end: true },
  { to: "/marketplace/results", label: "Results", end: true },
]

export function MarketplaceLayout() {
  return (
    <div>
      <div className="no-print mb-6 flex flex-wrap gap-2">
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  )
}
