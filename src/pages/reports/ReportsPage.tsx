import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/PageHeader"
import { formatGrams } from "@/lib/money"
import { FINANCING_STATUS_LABELS } from "@/lib/labels"
import { useAppState } from "@/store/AppStore"

const REPORTS = [
  { id: "inventory", label: "Gold inventory" },
  { id: "value", label: "Gold value" },
  { id: "portfolio", label: "Financing portfolio" },
  { id: "outstanding", label: "Outstanding financing" },
  { id: "collections", label: "Collections" },
  { id: "overdue", label: "Overdue accounts" },
  { id: "certificates", label: "Certificates" },
  { id: "vault", label: "Vault inventory" },
  { id: "marketplace", label: "Marketplace activity" },
  { id: "auctions", label: "Auction activity" },
] as const

export function ReportsPage() {
  const state = useAppState()
  const [report, setReport] = useState<(typeof REPORTS)[number]["id"]>("inventory")

  const table = useMemo(() => buildReport(report, state), [report, state])

  function downloadCsv() {
    const lines = [table.heads.join(","), ...table.rows.map((r) => r.map(csv).join(","))]
    const blob = new Blob([lines.join("\n")], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `onegold-${report}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <PageHeader
        eyebrow="Intelligence"
        title="Reports"
        description="Operator snapshots from the local ledger. Export is generated from mock state."
        actions={<Button variant="outline" onClick={downloadCsv}>Export CSV</Button>}
      />
      <Select value={report} onValueChange={(v) => setReport(v as typeof report)}>
        <SelectTrigger className="mb-6 max-w-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {REPORTS.map((r) => (
            <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {table.kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{k.label}</p>
              <p className="mt-1 font-serif text-2xl">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{REPORTS.find((r) => r.id === report)?.label}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {table.heads.map((h) => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.rows.map((row, i) => (
                <TableRow key={i}>
                  {row.map((cell, j) => (
                    <TableCell key={j}>{cell}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function csv(value: string) {
  if (value.includes(",") || value.includes('"')) return `"${value.replaceAll('"', '""')}"`
  return value
}

function buildReport(id: string, state: ReturnType<typeof useAppState>) {
  const { goldItems, financings, payments, certificates, vaults, listings, customers, auctions } = state
  if (id === "inventory" || id === "value") {
    return {
      kpis: [
        { label: "Items", value: String(goldItems.length) },
        { label: "In custody", value: formatGrams(goldItems.filter((g) => g.status === "in_custody").reduce((s, g) => s + g.netWeightGrams, 0)) },
        { label: "Value", value: goldItems.filter((g) => g.status === "in_custody").reduce((s, g) => s + g.assessedValueUsd, 0).toLocaleString("en-US", { style: "currency", currency: "USD" }) },
      ],
      heads: ["Gold ID", "Customer", "Weight", "Value", "Status"],
      rows: goldItems.map((g) => [
        g.id,
        customers.find((c) => c.id === g.customerId)?.name ?? "",
        formatGrams(g.netWeightGrams),
        g.assessedValueUsd.toFixed(2),
        g.status,
      ]),
    }
  }
  if (id === "portfolio" || id === "outstanding") {
    return {
      kpis: [
        { label: "Facilities", value: String(financings.length) },
        { label: "Outstanding", value: financings.reduce((s, f) => s + f.outstandingUsd, 0).toLocaleString("en-US", { style: "currency", currency: "USD" }) },
        { label: "Active", value: String(financings.filter((f) => f.status === "active").length) },
      ],
      heads: ["Facility", "Customer", "Status", "Outstanding"],
      rows: financings.map((f) => [
        f.id,
        customers.find((c) => c.id === f.customerId)?.name ?? "",
        FINANCING_STATUS_LABELS[f.status],
        f.outstandingUsd.toFixed(2),
      ]),
    }
  }
  if (id === "collections" || id === "overdue") {
    const rows = id === "overdue" ? payments.filter((p) => p.status === "overdue") : payments.filter((p) => p.status === "paid")
    return {
      kpis: [
        { label: "Rows", value: String(rows.length) },
        { label: "Amount", value: rows.reduce((s, p) => s + (id === "overdue" ? p.amountUsd - p.paidAmountUsd : p.paidAmountUsd), 0).toLocaleString("en-US", { style: "currency", currency: "USD" }) },
        { label: "Accounts", value: String(new Set(rows.map((p) => p.financingId)).size) },
      ],
      heads: ["Payment", "Facility", "Status", "Amount"],
      rows: rows.map((p) => [p.id, p.financingId, p.status, p.amountUsd.toFixed(2)]),
    }
  }
  if (id === "certificates") {
    return {
      kpis: [
        { label: "Certificates", value: String(certificates.length) },
        { label: "Active", value: String(certificates.filter((c) => c.status === "active").length) },
        { label: "Eligible", value: String(certificates.filter((c) => c.eligibility === "TRADING_ELIGIBLE").length) },
      ],
      heads: ["Certificate", "Holder", "Eligibility", "Outstanding"],
      rows: certificates.map((c) => [c.id, c.ownershipName, c.eligibility, c.outstandingUsd.toFixed(2)]),
    }
  }
  if (id === "vault") {
    return {
      kpis: vaults.map((v) => ({
        label: v.id,
        value: String(goldItems.filter((g) => g.vaultId === v.id && g.status === "in_custody").length),
      })),
      heads: ["Vault", "Locker", "Gold", "Packet"],
      rows: goldItems.filter((g) => g.vaultId).map((g) => [g.vaultId ?? "", g.lockerId ?? "", g.id, g.packetId ?? ""]),
    }
  }
  if (id === "marketplace") {
    return {
      kpis: [
        { label: "Listings", value: String(listings.length) },
        { label: "Listed", value: String(listings.filter((l) => l.status === "listed").length) },
        { label: "Settled", value: String(listings.filter((l) => l.status === "settled").length) },
      ],
      heads: ["Listing", "Certificate", "Ask", "Status"],
      rows: listings.map((l) => [l.id, l.certificateId, l.askingPriceUsd.toFixed(2), l.status]),
    }
  }
  return {
    kpis: [
      { label: "Auctions", value: String(auctions.length) },
      { label: "Live", value: String(auctions.filter((a) => a.status === "live").length) },
      { label: "Settled", value: String(auctions.filter((a) => a.status === "settled").length) },
    ],
    heads: ["Auction", "Certificate", "Start", "Winner", "Status"],
    rows: auctions.map((a) => [
      a.id,
      a.certificateId,
      a.startingPriceUsd.toFixed(2),
      a.winnerName ?? "",
      a.status,
    ]),
  }
}
