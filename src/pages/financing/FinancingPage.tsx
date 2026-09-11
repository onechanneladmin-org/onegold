import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Landmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Money } from "@/components/shared/Money"
import { EmptyState } from "@/components/shared/EmptyState"
import { formatDate } from "@/lib/format"
import { FINANCING_STATUS_LABELS, STRUCTURE_LABELS } from "@/lib/labels"
import { useAppState } from "@/store/AppStore"
import type { FinancingStatus } from "@/types"

export function FinancingPage() {
  const { financings, customers, goldItems } = useAppState()
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<"all" | FinancingStatus>("all")

  const rows = useMemo(() => {
    return financings.filter((f) => {
      const customer = customers.find((c) => c.id === f.customerId)
      const match = `${f.id} ${customer?.name ?? ""}`.toLowerCase().includes(q.toLowerCase())
      return match && (status === "all" || f.status === status)
    })
  }, [financings, customers, q, status])

  return (
    <div>
      <PageHeader
        eyebrow="Portfolio"
        title="Financing"
        description="Ar-Rahnu and fee-based facilities against verified gold. No conventional interest language."
        actions={
          <Button asChild>
            <Link to="/financing/new">New financing</Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search facility or customer" className="sm:max-w-xs" />
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(FINANCING_STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<Landmark className="h-8 w-8" />} title="No facilities" action={<Button asChild><Link to="/financing/new">Book financing</Link></Button>} />
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Facility</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Gold</TableHead>
                <TableHead>Structure</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead>Maturity</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>
                    <Link className="font-medium hover:underline" to={`/financing/${f.id}`}>
                      {f.id}
                    </Link>
                  </TableCell>
                  <TableCell>{customers.find((c) => c.id === f.customerId)?.name}</TableCell>
                  <TableCell>
                    <Link className="hover:underline" to={`/gold/${f.goldId}`}>
                      {goldItems.find((g) => g.id === f.goldId)?.id}
                    </Link>
                  </TableCell>
                  <TableCell>{STRUCTURE_LABELS[f.structure]}</TableCell>
                  <TableCell>
                    <Money value={f.outstandingUsd} />
                  </TableCell>
                  <TableCell>{formatDate(f.maturityDate)}</TableCell>
                  <TableCell>
                    <StatusBadge value={f.status} />
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
