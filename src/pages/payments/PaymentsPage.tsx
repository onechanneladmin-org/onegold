import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Wallet } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Money } from "@/components/shared/Money"
import { EmptyState } from "@/components/shared/EmptyState"
import { RecordPaymentDialog } from "@/components/payments/RecordPaymentDialog"
import { formatDate } from "@/lib/format"
import { useAppState } from "@/store/AppStore"
import type { PaymentInstallment, PaymentStatus } from "@/types"

export function PaymentsPage() {
  const { payments, customers, financings } = useAppState()
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<"all" | PaymentStatus>("all")
  const [selected, setSelected] = useState<PaymentInstallment | null>(null)

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const name = customers.find((c) => c.id === p.customerId)?.name ?? ""
      const match = `${p.id} ${p.financingId} ${name}`.toLowerCase().includes(q.toLowerCase())
      return match && (status === "all" || p.status === status)
    })
  }, [payments, customers, q, status])

  const upcoming = filtered.filter((p) => p.status === "upcoming" || p.status === "partial")
  const overdue = filtered.filter((p) => p.status === "overdue")
  const history = filtered.filter((p) => p.status === "paid" || p.status === "completed")

  return (
    <div>
      <PageHeader
        eyebrow="Collections"
        title="Payments"
        description="Upcoming, overdue and historical collections. Recording a payment updates balances across the ledger."
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customer or facility" className="sm:max-w-xs" />
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({overdue.length})</TabsTrigger>
          <TabsTrigger value="history">History ({history.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          <PayTable rows={upcoming} customers={customers} onRecord={setSelected} />
        </TabsContent>
        <TabsContent value="overdue">
          <PayTable rows={overdue} customers={customers} onRecord={setSelected} />
        </TabsContent>
        <TabsContent value="history">
          <PayTable rows={history} customers={customers} />
        </TabsContent>
      </Tabs>
      <p className="mt-3 text-xs text-muted-foreground">{financings.length} facilities on the book.</p>
      <RecordPaymentDialog payment={selected} open={Boolean(selected)} onOpenChange={(o) => !o && setSelected(null)} />
    </div>
  )
}

function PayTable({
  rows,
  customers,
  onRecord,
}: {
  rows: PaymentInstallment[]
  customers: { id: string; name: string }[]
  onRecord?: (p: PaymentInstallment) => void
}) {
  if (rows.length === 0) return <EmptyState icon={<Wallet className="h-8 w-8" />} title="Nothing in this view" />
  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Due</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Facility</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Paid</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{formatDate(p.dueDate)}</TableCell>
              <TableCell>{customers.find((c) => c.id === p.customerId)?.name}</TableCell>
              <TableCell>
                <Link className="hover:underline" to={`/financing/${p.financingId}`}>{p.financingId}</Link>
              </TableCell>
              <TableCell><Money value={p.amountUsd} /></TableCell>
              <TableCell><Money value={p.paidAmountUsd} /></TableCell>
              <TableCell><StatusBadge value={p.status} /></TableCell>
              <TableCell>
                {onRecord && p.status !== "paid" ? (
                  <Button size="sm" variant="ghost" onClick={() => onRecord(p)}>Record</Button>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
