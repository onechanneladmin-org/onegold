import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { BadgeCheck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Money } from "@/components/shared/Money"
import { EmptyState } from "@/components/shared/EmptyState"
import { formatDate } from "@/lib/format"
import { ELIGIBILITY_LABELS } from "@/lib/labels"
import { useAppState } from "@/store/AppStore"
import type { Eligibility } from "@/types"

export function CertificatesPage() {
  const { certificates } = useAppState()
  const [q, setQ] = useState("")
  const [elig, setElig] = useState<"all" | Eligibility>("all")

  const rows = useMemo(() => {
    return certificates.filter((c) => {
      const match = `${c.id} ${c.ownershipName} ${c.verificationId}`.toLowerCase().includes(q.toLowerCase())
      return match && (elig === "all" || c.eligibility === elig)
    })
  }, [certificates, q, elig])

  return (
    <div>
      <PageHeader
        eyebrow="Registry"
        title="Certificates"
        description="Digital records of pledged gold, financing and ownership — printable and transferable only when eligible."
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ID, holder or verification" className="sm:max-w-xs" />
        <Select value={elig} onValueChange={(v) => setElig(v as typeof elig)}>
          <SelectTrigger className="sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All eligibility</SelectItem>
            {Object.entries(ELIGIBILITY_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={<BadgeCheck className="h-8 w-8" />} title="No certificates" />
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Certificate</TableHead>
                <TableHead>Holder</TableHead>
                <TableHead>Gold</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead>Maturity</TableHead>
                <TableHead>Eligibility</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link className="font-medium hover:underline" to={`/certificates/${c.id}`}>{c.id}</Link>
                    <p className="text-xs text-muted-foreground">{c.verificationId}</p>
                  </TableCell>
                  <TableCell>{c.ownershipName}</TableCell>
                  <TableCell>{c.goldId}</TableCell>
                  <TableCell><Money value={c.outstandingUsd} /></TableCell>
                  <TableCell>{formatDate(c.maturityDate)}</TableCell>
                  <TableCell><StatusBadge value={c.eligibility} /></TableCell>
                  <TableCell><StatusBadge value={c.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
