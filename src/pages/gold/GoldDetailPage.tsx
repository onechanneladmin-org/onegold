import { useState, type ReactNode } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Money } from "@/components/shared/Money"
import { EmptyState } from "@/components/shared/EmptyState"
import { formatDate, formatDateTime } from "@/lib/format"
import { formatGrams, formatPercent } from "@/lib/money"
import { GOLD_TYPE_LABELS } from "@/lib/labels"
import { maxFinancing } from "@/lib/calculations"
import { useAppState, useAppStore } from "@/store/AppStore"

export function GoldDetailPage() {
  const { id } = useParams()
  const { goldItems, customers, financings, certificates, vaults, settings } = useAppState()
  const { verifyGold, moveGold } = useAppStore()
  const gold = goldItems.find((g) => g.id === id)

  if (!gold) {
    return <EmptyState title="Gold item not found" action={<Button asChild><Link to="/gold">Back</Link></Button>} />
  }

  const customer = customers.find((c) => c.id === gold.customerId)
  const financing = financings.find((f) => f.goldId === gold.id)
  const certificate = certificates.find((c) => c.goldId === gold.id)
  const vault = vaults.find((v) => v.id === gold.vaultId)

  return (
    <div>
      <PageHeader
        eyebrow="Gold record"
        title={gold.id}
        description={gold.description}
        actions={
          <>
            {!gold.verified ? (
              <Button
                variant="outline"
                onClick={() => {
                  verifyGold(gold.id)
                  toast.success("Assay marked verified")
                }}
              >
                Verify assay
              </Button>
            ) : null}
            {gold.status !== "released" && !financing ? (
              <Button asChild>
                <Link to={`/financing/new?gold=${gold.id}&customer=${gold.customerId}`}>Create financing</Link>
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Valuation & verification</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 text-sm">
            <Info label="Customer" value={customer?.name ?? "—"} href={customer ? `/customers/${customer.id}` : undefined} />
            <Info label="Type" value={GOLD_TYPE_LABELS[gold.itemType]} />
            <Info label="Gross / net" value={`${formatGrams(gold.grossWeightGrams)} / ${formatGrams(gold.netWeightGrams)}`} />
            <Info label="Purity" value={`${gold.karat}K · fineness ${gold.fineness}`} />
            <Info label="Reference rate" value={`${gold.goldRateUsdPerGram.toFixed(2)} USD/g`} />
            <Info label="Assessed value" value={<Money value={gold.assessedValueUsd} />} />
            <Info label="Max financing" value={<Money value={maxFinancing(gold.assessedValueUsd, settings.defaultLtvPercent)} />} />
            <Info label="LTV policy" value={formatPercent(settings.defaultLtvPercent)} />
            <Info label="Assay" value={`${gold.assayLab} · ${gold.assayRef}`} />
            <Info label="Assay date" value={formatDate(gold.assayDate)} />
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <div className="mt-1 flex gap-2">
                <StatusBadge value={gold.status} />
                <StatusBadge value={gold.custodyStatus} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Where is it now?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="font-serif text-xl">{gold.status === "released" ? "Released to customer" : `${vault?.name ?? "Unassigned"}`}</p>
            <p className="text-muted-foreground">{gold.lockerId ? `Locker ${gold.lockerId}` : "No locker"}</p>
            <p>Packet {gold.packetId} · Seal {gold.sealId}</p>
            <p>Deposited {formatDate(gold.depositDate)}</p>
            {gold.status !== "released" ? (
              <MoveControl
                vaults={vaults}
                currentVault={gold.vaultId ?? "VLT-C"}
                currentLocker={gold.lockerId ?? "C-01"}
                onMove={(vaultId, lockerId) => {
                  moveGold(gold.id, vaultId, lockerId, "Operator relocation")
                  toast.success("Custody location updated")
                }}
              />
            ) : null}
            {financing ? (
              <Button variant="outline" className="w-full" asChild>
                <Link to={`/financing/${financing.id}`}>Open financing</Link>
              </Button>
            ) : null}
            {certificate ? (
              <Button variant="ghost" className="w-full" asChild>
                <Link to={`/certificates/${certificate.id}`}>Open certificate</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Movement history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {gold.movements.map((m) => (
            <div key={m.id} className="rounded-lg border p-3 text-sm">
              <p className="font-medium">{m.from} → {m.to}</p>
              <p className="text-muted-foreground">{m.reason}</p>
              <p className="text-xs text-muted-foreground">{formatDateTime(m.at)} · {m.actor}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function Info({ label, value, href }: { label: string; value: ReactNode; href?: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      {href ? (
        <Link className="hover:underline" to={href}>
          {value}
        </Link>
      ) : (
        <div>{value}</div>
      )}
    </div>
  )
}

function MoveControl({
  vaults,
  currentVault,
  currentLocker,
  onMove,
}: {
  vaults: { id: string; name: string; lockers: { id: string; label: string }[] }[]
  currentVault: string
  currentLocker: string
  onMove: (vaultId: string, lockerId: string) => void
}) {
  const [vaultId, setVaultId] = useState(currentVault)
  const [lockerId, setLockerId] = useState(currentLocker)
  const lockers = vaults.find((v) => v.id === vaultId)?.lockers ?? []

  return (
    <div className="space-y-2 border-t pt-3">
      <Select value={vaultId} onValueChange={setVaultId}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {vaults.map((v) => (
            <SelectItem key={v.id} value={v.id}>
              {v.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={lockerId} onValueChange={setLockerId}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {lockers.map((l) => (
            <SelectItem key={l.id} value={l.id}>
              {l.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" variant="secondary" className="w-full" onClick={() => onMove(vaultId, lockerId)}>
        Move gold
      </Button>
    </div>
  )
}

