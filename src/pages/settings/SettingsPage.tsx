import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/shared/PageHeader"
import { ComplianceNote } from "@/components/shared/Disclaimer"
import { useAppState, useAppStore } from "@/store/AppStore"
import { useState } from "react"

export function SettingsPage() {
  const { settings, vaults, approvedBidders, sessionBidder } = useAppState()
  const { updateSettings, resetToSeed, setSessionBidder } = useAppStore()
  const [shopName, setShopName] = useState(settings.shopName)
  const [shopLocation, setShopLocation] = useState(settings.shopLocation)
  const [price, setPrice] = useState(String(settings.goldReferenceUsdPerGram))
  const [ltv, setLtv] = useState(String(settings.defaultLtvPercent))

  return (
    <div>
      <PageHeader
        eyebrow="Atelier"
        title="Settings"
        description="Shop identity, reference gold price, LTV policy and Islamic structure templates."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Shop profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={shopName} onChange={(e) => setShopName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={shopLocation} onChange={(e) => setShopLocation(e.target.value)} />
            </div>
            <Button
              onClick={() => {
                updateSettings({ shopName, shopLocation })
                toast.success("Shop profile saved")
              }}
            >
              Save profile
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Valuation policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Reference gold price (USD / gram)</Label>
              <Input value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Default LTV %</Label>
              <Input value={ltv} onChange={(e) => setLtv(e.target.value)} />
            </div>
            <Button
              onClick={() => {
                updateSettings({
                  goldReferenceUsdPerGram: Number(price),
                  defaultLtvPercent: Number(ltv),
                })
                toast.success("Policy updated")
              }}
            >
              Save policy
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Islamic structure templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {settings.structures.map((s) => (
              <div key={s.id} className="rounded-lg border p-3">
                <p className="font-medium">{s.name}</p>
                <p className="text-muted-foreground">{s.description}</p>
                <p className="mt-1 text-xs">Indicative fee {s.defaultFeePercent}% p.a. · {s.feeLabel}</p>
              </div>
            ))}
            <ComplianceNote />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vaults</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {vaults.map((v) => (
              <p key={v.id}>
                <span className="font-medium">{v.name}</span>
                <span className="text-muted-foreground"> · {v.location} · {v.lockers.length} lockers</span>
              </p>
            ))}
            <div className="space-y-2 pt-2">
              <Label>Acting bidder (auctions)</Label>
              <Select value={sessionBidder} onValueChange={setSessionBidder}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {approvedBidders.filter((b) => b.approved).map((b) => (
                    <SelectItem key={b.id} value={b.name}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                resetToSeed()
                toast.message("Local ledger reset to sample data")
              }}
            >
              Reset demo data
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
