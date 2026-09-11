import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Money } from "@/components/shared/Money"
import { EmptyState } from "@/components/shared/EmptyState"
import { formatGrams } from "@/lib/money"
import { GOLD_TYPE_LABELS } from "@/lib/labels"
import { assessGoldValue } from "@/lib/calculations"
import { useAppState, useAppStore } from "@/store/AppStore"
import type { GoldItemType, GoldStatus } from "@/types"

export function GoldPage() {
  const { goldItems, customers, settings } = useAppState()
  const { intakeGold } = useAppStore()
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<"all" | GoldStatus>("all")
  const [open, setOpen] = useState(false)

  const rows = useMemo(() => {
    return goldItems.filter((g) => {
      const match = `${g.id} ${g.description}`.toLowerCase().includes(q.toLowerCase())
      return match && (status === "all" || g.status === status)
    })
  }, [goldItems, q, status])

  return (
    <div>
      <PageHeader
        eyebrow="Inventory"
        title="Physical gold"
        description="Every pledged item — identity, assay, valuation and where it sits in the vault."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Gold intake</Button>
            </DialogTrigger>
            <IntakeForm
              customers={customers.map((c) => ({ id: c.id, name: c.name }))}
              rate={settings.goldReferenceUsdPerGram}
              onSubmit={(input) => {
                const created = intakeGold(input)
                toast.success(`${created.id} recorded`)
                setOpen(false)
              }}
            />
          </Dialog>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search gold ID or description" className="sm:max-w-xs" />
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="intake">Intake</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="in_custody">In custody</SelectItem>
            <SelectItem value="released">Released</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<Coins className="h-8 w-8" />} title="No gold recorded" action={<Button onClick={() => setOpen(true)}>Start intake</Button>} />
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gold ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Net weight</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((g) => (
                <TableRow key={g.id}>
                  <TableCell>
                    <Link className="font-medium hover:underline" to={`/gold/${g.id}`}>
                      {g.id}
                    </Link>
                  </TableCell>
                  <TableCell>{customers.find((c) => c.id === g.customerId)?.name}</TableCell>
                  <TableCell>{GOLD_TYPE_LABELS[g.itemType]}</TableCell>
                  <TableCell>{formatGrams(g.netWeightGrams)}</TableCell>
                  <TableCell>
                    <Money value={g.assessedValueUsd} />
                  </TableCell>
                  <TableCell className="text-xs">
                    {g.vaultId ? `${g.vaultId} / ${g.lockerId}` : "Released"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={g.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

function IntakeForm({
  customers,
  rate,
  onSubmit,
}: {
  customers: { id: string; name: string }[]
  rate: number
  onSubmit: (input: {
    customerId: string
    itemType: GoldItemType
    description: string
    grossWeightGrams: number
    netWeightGrams: number
    karat: number
    assayLab: string
    assayRef: string
  }) => void
}) {
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "")
  const [itemType, setItemType] = useState<GoldItemType>("jewelry")
  const [description, setDescription] = useState("")
  const [gross, setGross] = useState("50")
  const [net, setNet] = useState("48")
  const [karat, setKarat] = useState("22")
  const [assayLab, setAssayLab] = useState("OneGold Assay Desk")
  const [assayRef, setAssayRef] = useState("")
  const value = assessGoldValue(Number(net) || 0, Number(karat) || 0, rate)

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Gold intake</DialogTitle>
      </DialogHeader>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Customer</Label>
          <Select value={customerId} onValueChange={setCustomerId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Item type</Label>
          <Select value={itemType} onValueChange={(v) => setItemType(v as GoldItemType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(GOLD_TYPE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Field label="Karat" value={karat} onChange={setKarat} />
        <div className="space-y-2 sm:col-span-2">
          <Label>Description</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <Field label="Gross weight (g)" value={gross} onChange={setGross} />
        <Field label="Net weight (g)" value={net} onChange={setNet} />
        <Field label="Assay lab" value={assayLab} onChange={setAssayLab} />
        <Field label="Assay reference" value={assayRef} onChange={setAssayRef} />
      </div>
      <p className="text-sm text-muted-foreground">
        Indicative value at {rate.toFixed(2)} USD/g: <Money value={value} />
      </p>
      <DialogFooter>
        <Button
          onClick={() =>
            onSubmit({
              customerId,
              itemType,
              description: description || "Gold item",
              grossWeightGrams: Number(gross),
              netWeightGrams: Number(net),
              karat: Number(karat),
              assayLab,
              assayRef: assayRef || "ASY-NEW",
            })
          }
        >
          Record intake
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
