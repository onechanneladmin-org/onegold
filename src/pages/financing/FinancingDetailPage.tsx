import { useState, type ReactNode } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Money } from "@/components/shared/Money"
import { EmptyState } from "@/components/shared/EmptyState"
import { ComplianceNote } from "@/components/shared/Disclaimer"
import { RecordPaymentDialog } from "@/components/payments/RecordPaymentDialog"
import { formatDate } from "@/lib/format"
import { formatPercent } from "@/lib/money"
import { FREQUENCY_LABELS, RECOVERY_LABELS, STRUCTURE_LABELS } from "@/lib/labels"
import { useAppState, useAppStore } from "@/store/AppStore"
import type { PaymentFrequency, PaymentInstallment, RecoveryStage } from "@/types"

export function FinancingDetailPage() {
  const { id } = useParams()
  const { financings, customers, goldItems, certificates, payments } = useAppState()
  const { redeemGold, startRecovery, updateRecovery, renewFinancing } = useAppStore()
  const financing = financings.find((f) => f.id === id)
  const [pay, setPay] = useState<PaymentInstallment | null>(null)
  const [renewOpen, setRenewOpen] = useState(false)
  const [recoverOpen, setRecoverOpen] = useState(false)

  if (!financing) {
    return <EmptyState title="Facility not found" action={<Button asChild><Link to="/financing">Back</Link></Button>} />
  }

  const customer = customers.find((c) => c.id === financing.customerId)
  const gold = goldItems.find((g) => g.id === financing.goldId)
  const certificate = certificates.find((c) => c.financingId === financing.id)
  const schedule = payments.filter((p) => p.financingId === financing.id)

  return (
    <div>
      <PageHeader
        eyebrow="Facility"
        title={financing.id}
        description={`${STRUCTURE_LABELS[financing.structure]} · ${customer?.name ?? ""}`}
        actions={
          <>
            {financing.status !== "closed" && financing.status !== "recovery" ? (
              <Button variant="outline" onClick={() => setRenewOpen(true)}>Renew</Button>
            ) : null}
            {financing.status === "overdue" ? (
              <Button variant="destructive" onClick={() => { startRecovery(financing.id); toast.message("Recovery opened") }}>
                Open recovery
              </Button>
            ) : null}
            {financing.status === "recovery" ? (
              <Button variant="outline" onClick={() => setRecoverOpen(true)}>Update recovery</Button>
            ) : null}
            {financing.status !== "closed" ? (
              <Button
                onClick={() => {
                  redeemGold(financing.id)
                  toast.success("Gold released and facility closed")
                }}
              >
                Redeem & release
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Terms</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
            <div className="flex justify-between sm:block"><p className="text-xs text-muted-foreground">Status</p><StatusBadge value={financing.status} /></div>
            <KV label="Financing amount" value={<Money value={financing.amountUsd} />} />
            <KV label={financing.feeLabel} value={<Money value={financing.feeAmountUsd} />} />
            <KV label="Outstanding" value={<Money value={financing.outstandingUsd} />} />
            <KV label="Tenure" value={`${financing.tenureMonths} months · ${FREQUENCY_LABELS[financing.paymentFrequency]}`} />
            <KV label="Start / maturity" value={`${formatDate(financing.startDate)} → ${formatDate(financing.maturityDate)}`} />
            <KV label="LTV / max" value={`${formatPercent(financing.ltvPercent)} · max ${financing.maxFinancingUsd.toFixed(0)}`} />
            <KV label="Shariah review" value={financing.shariahReviewStatus} />
            <KV label="Legal review" value={financing.legalReviewStatus} />
            {financing.recoveryStage ? <KV label="Recovery stage" value={RECOVERY_LABELS[financing.recoveryStage]} /> : null}
            <div className="sm:col-span-2">
              <ComplianceNote />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Linked records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Link className="block rounded-lg border p-3 hover:bg-accent" to={`/customers/${customer?.id}`}>{customer?.name}</Link>
            <Link className="block rounded-lg border p-3 hover:bg-accent" to={`/gold/${gold?.id}`}>
              {gold?.id}<p className="text-muted-foreground">{gold?.vaultId} / {gold?.lockerId}</p>
            </Link>
            {certificate ? (
              <Link className="block rounded-lg border p-3 hover:bg-accent" to={`/certificates/${certificate.id}`}>{certificate.id}</Link>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Payment schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Due</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedule.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{formatDate(p.dueDate)}</TableCell>
                  <TableCell><Money value={p.amountUsd} /></TableCell>
                  <TableCell><Money value={p.paidAmountUsd} /></TableCell>
                  <TableCell><StatusBadge value={p.status} /></TableCell>
                  <TableCell>
                    {p.status !== "paid" && financing.status !== "closed" ? (
                      <Button size="sm" variant="ghost" onClick={() => setPay(p)}>Record</Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {financing.history.length > 0 ? (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Prior terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {financing.history.map((h, i) => (
              <p key={i}>
                {formatDate(h.startDate)} – {formatDate(h.maturityDate)} · {h.tenureMonths} mo · fee <Money value={h.feeAmountUsd} />
              </p>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <RecordPaymentDialog payment={pay} open={Boolean(pay)} onOpenChange={(o) => !o && setPay(null)} />

      <RenewDialog
        open={renewOpen}
        onOpenChange={setRenewOpen}
        defaultFee={financing.feeAmountUsd}
        onSave={(data) => {
          renewFinancing({ financingId: financing.id, ...data })
          toast.success("Facility renewed")
          setRenewOpen(false)
        }}
      />

      <Dialog open={recoverOpen} onOpenChange={setRecoverOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recovery workflow</DialogTitle>
          </DialogHeader>
          <RecoveryForm
            onSave={(stage, note) => {
              updateRecovery(financing.id, stage, note)
              toast.message("Recovery updated")
              setRecoverOpen(false)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function KV({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="font-medium capitalize">{value}</div>
    </div>
  )
}

function RenewDialog({
  open,
  onOpenChange,
  defaultFee,
  onSave,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  defaultFee: number
  onSave: (data: { tenureMonths: number; paymentFrequency: PaymentFrequency; feeAmountUsd: number; startDate: string }) => void
}) {
  const [tenure, setTenure] = useState("6")
  const [frequency, setFrequency] = useState<PaymentFrequency>("monthly")
  const [fee, setFee] = useState(String(defaultFee))
  const [start, setStart] = useState(new Date().toISOString().slice(0, 10))
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renew financing</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <Label>New tenure (months)</Label>
          <Input value={tenure} onChange={(e) => setTenure(e.target.value)} />
          <Label>Frequency</Label>
          <Select value={frequency} onValueChange={(v) => setFrequency(v as PaymentFrequency)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="bullet">At maturity</SelectItem>
            </SelectContent>
          </Select>
          <Label>Agreed fee / profit (USD)</Label>
          <Input value={fee} onChange={(e) => setFee(e.target.value)} />
          <Label>Start</Label>
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <DialogFooter>
          <Button onClick={() => onSave({ tenureMonths: Number(tenure), paymentFrequency: frequency, feeAmountUsd: Number(fee), startDate: start })}>
            Archive prior terms
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RecoveryForm({ onSave }: { onSave: (stage: RecoveryStage, note: string) => void }) {
  const [stage, setStage] = useState<RecoveryStage>("review")
  const [note, setNote] = useState("")
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">UI workflow only — no real auction or legal filing is executed.</p>
      <Select value={stage} onValueChange={(v) => setStage(v as RecoveryStage)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {Object.entries(RECOVERY_LABELS).map(([k, v]) => (
            <SelectItem key={k} value={k}>{v}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Operator notes" />
      <Button onClick={() => onSave(stage, note || "Stage updated")}>Save</Button>
    </div>
  )
}
