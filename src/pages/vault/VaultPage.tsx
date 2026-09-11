import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { formatGrams } from "@/lib/money"
import { cn } from "@/lib/utils"
import { useAppState } from "@/store/AppStore"

export function VaultPage() {
  const { vaults, goldItems, customers } = useAppState()
  const [q, setQ] = useState("")
  const match = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return null
    return goldItems.find((g) =>
      [g.id, g.packetId, g.sealId, g.lockerId, g.description].join(" ").toLowerCase().includes(term),
    )
  }, [q, goldItems])

  return (
    <div>
      <PageHeader
        eyebrow="Custody"
        title="Vault map"
        description="Answer “where is this gold right now?” — vault, locker, packet and seal."
      />
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Find by Gold ID, packet or seal…"
        className="mb-6 max-w-md"
      />
      {match ? (
        <Card className="mb-6 border-gold/40">
          <CardContent className="p-5 text-sm">
            <p className="font-serif text-2xl">{match.id}</p>
            <p className="text-muted-foreground">{match.description}</p>
            <p className="mt-2">
              {match.status === "released"
                ? "Released to customer"
                : `${vaults.find((v) => v.id === match.vaultId)?.name ?? "Unassigned"} · Locker ${match.lockerId}`}
            </p>
            <p>Packet {match.packetId} · Seal {match.sealId} · {formatGrams(match.netWeightGrams)}</p>
            <div className="mt-2 flex gap-2">
              <StatusBadge value={match.custodyStatus} />
              <Link className="text-sm text-primary hover:underline" to={`/gold/${match.id}`}>Open record</Link>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {vaults.map((vault) => {
          const items = goldItems.filter((g) => g.vaultId === vault.id && g.status !== "released")
          return (
            <Card key={vault.id}>
              <CardHeader>
                <CardTitle className="text-base">{vault.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{vault.location} · {items.length} packets</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {vault.lockers.map((locker) => {
                    const here = items.filter((g) => g.lockerId === locker.id)
                    const highlight = match?.lockerId === locker.id && match.vaultId === vault.id
                    return (
                      <div
                        key={locker.id}
                        className={cn(
                          "rounded-lg border p-2 text-xs",
                          here.length > 0 ? "border-primary/30 bg-primary/5" : "bg-muted/40",
                          highlight && "ring-2 ring-gold",
                        )}
                      >
                        <p className="font-medium">{locker.label}</p>
                        <p className="text-muted-foreground">{locker.row}</p>
                        {here.length === 0 ? (
                          <p className="mt-2 text-muted-foreground">Empty</p>
                        ) : (
                          here.map((g) => (
                            <Link key={g.id} to={`/gold/${g.id}`} className="mt-1 block font-medium hover:underline">
                              {g.id}
                              <span className="block font-normal text-muted-foreground">
                                {customers.find((c) => c.id === g.customerId)?.name}
                              </span>
                            </Link>
                          ))
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
