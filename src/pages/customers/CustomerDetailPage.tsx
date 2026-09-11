import type { ReactNode } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Money } from "@/components/shared/Money"
import { EmptyState } from "@/components/shared/EmptyState"
import { formatDate, formatDateTime } from "@/lib/format"
import { formatGrams } from "@/lib/money"
import { GOLD_TYPE_LABELS } from "@/lib/labels"
import { useAppState, useAppStore } from "@/store/AppStore"
import type { KycStatus } from "@/types"

export function CustomerDetailPage() {
  const { id } = useParams()
  const { customers, goldItems, financings, certificates, payments, documents, activities } = useAppState()
  const { updateKyc } = useAppStore()
  const customer = customers.find((c) => c.id === id)

  if (!customer) {
    return <EmptyState title="Customer not found" action={<Button asChild><Link to="/customers">Back</Link></Button>} />
  }

  const gold = goldItems.filter((g) => g.customerId === customer.id)
  const fins = financings.filter((f) => f.customerId === customer.id)
  const certs = certificates.filter((c) => c.customerId === customer.id)
  const pays = payments.filter((p) => p.customerId === customer.id)
  const docs = documents.filter((d) => d.customerId === customer.id)
  const timeline = activities.filter((a) => a.customerId === customer.id)

  return (
    <div>
      <PageHeader
        eyebrow={customer.id}
        title={customer.name}
        description={`${customer.city}, ${customer.country} · ${customer.identityType} ${customer.identityNumber}`}
        actions={
          <Button asChild>
            <Link to={`/financing/new?customer=${customer.id}`}>New financing</Link>
          </Button>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="kyc">KYC</TabsTrigger>
          <TabsTrigger value="gold">Gold assets</TabsTrigger>
          <TabsTrigger value="financing">Financing</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Profile</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
              <Info label="Email" value={customer.email} />
              <Info label="Phone" value={customer.phone} />
              <Info label="Address" value={customer.address} />
              <Info label="Registered" value={formatDate(customer.createdAt)} />
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground">Notes</p>
                <p>{customer.notes || "—"}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span>KYC</span><StatusBadge value={customer.kycStatus} /></div>
              <div className="flex justify-between"><span>Risk</span><StatusBadge value={customer.riskRating} /></div>
              <div className="flex justify-between"><span>Gold items</span><span>{gold.length}</span></div>
              <div className="flex justify-between"><span>Facilities</span><span>{fins.length}</span></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kyc">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">KYC workflow</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <StatusBadge value={customer.kycStatus} />
              <Select
                value={customer.kycStatus}
                onValueChange={(v) => {
                  updateKyc(customer.id, v as KycStatus)
                  toast.success("KYC updated")
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_review">In review</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Operator review only. OneGold does not certify legal compliance.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gold">
          <SimpleTable
            rows={gold.map((g) => [g.id, GOLD_TYPE_LABELS[g.itemType], formatGrams(g.netWeightGrams), <StatusBadge key={g.id} value={g.status} />])}
            heads={["Gold ID", "Type", "Net", "Status"]}
            href={(i) => `/gold/${gold[i].id}`}
          />
        </TabsContent>
        <TabsContent value="financing">
          <SimpleTable
            rows={fins.map((f) => [f.id, <StatusBadge key={f.id} value={f.status} />, <Money key={`${f.id}-m`} value={f.outstandingUsd} />])}
            heads={["Facility", "Status", "Outstanding"]}
            href={(i) => `/financing/${fins[i].id}`}
          />
        </TabsContent>
        <TabsContent value="certificates">
          <SimpleTable
            rows={certs.map((c) => [c.id, c.ownershipName, <StatusBadge key={c.id} value={c.eligibility} />])}
            heads={["Certificate", "Owner", "Eligibility"]}
            href={(i) => `/certificates/${certs[i].id}`}
          />
        </TabsContent>
        <TabsContent value="payments">
          <SimpleTable
            rows={pays.map((p) => [formatDate(p.dueDate), <Money key={p.id} value={p.amountUsd} />, <StatusBadge key={`${p.id}-s`} value={p.status} />])}
            heads={["Due", "Amount", "Status"]}
          />
        </TabsContent>
        <TabsContent value="documents">
          <SimpleTable
            rows={docs.map((d) => [d.name, d.type, formatDate(d.uploadedAt), <StatusBadge key={d.id} value={d.status} />])}
            heads={["Document", "Type", "Uploaded", "Status"]}
          />
        </TabsContent>
        <TabsContent value="activity">
          <div className="space-y-3">
            {timeline.length === 0 ? <EmptyState title="No activity yet" /> : timeline.map((a) => (
              <div key={a.id} className="rounded-xl border bg-card p-4">
                <p className="font-medium">{a.title}</p>
                <p className="text-sm text-muted-foreground">{a.detail}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(a.at)} · {a.actor}</p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p>{value}</p>
    </div>
  )
}

function SimpleTable({
  heads,
  rows,
  href,
}: {
  heads: string[]
  rows: (string | number | ReactNode)[][]
  href?: (index: number) => string
}) {
  if (rows.length === 0) return <EmptyState title="Nothing recorded yet" />
  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {heads.map((h) => (
              <TableHead key={h}>{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              {row.map((cell, j) => (
                <TableCell key={j}>
                  {j === 0 && href ? (
                    <Link className="font-medium hover:underline" to={href(i)}>
                      {cell}
                    </Link>
                  ) : (
                    cell
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
