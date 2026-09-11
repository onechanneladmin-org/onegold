import { Link } from "react-router-dom"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { AlertTriangle, BadgeCheck, Coins, Landmark, Vault, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { Money } from "@/components/shared/Money"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { formatDate } from "@/lib/format"
import { formatGrams } from "@/lib/money"
import { useAppState } from "@/store/AppStore"

const CHART = [
  { month: "Apr", financing: 148000, collections: 22000 },
  { month: "May", financing: 162000, collections: 28000 },
  { month: "Jun", financing: 171000, collections: 31000 },
  { month: "Jul", financing: 186000, collections: 26000 },
  { month: "Aug", financing: 194000, collections: 34000 },
  { month: "Sep", financing: 201000, collections: 19000 },
]

export function DashboardPage() {
  const { goldItems, financings, certificates, payments, vaults, settings, customers } = useAppState()
  const inCustody = goldItems.filter((g) => g.status === "in_custody")
  const goldValue = inCustody.reduce((s, g) => s + g.assessedValueUsd, 0)
  const goldWeight = inCustody.reduce((s, g) => s + g.netWeightGrams, 0)
  const activeFin = financings.filter((f) => !["closed"].includes(f.status))
  const outstanding = activeFin.reduce((s, f) => s + f.outstandingUsd, 0)
  const upcoming = payments.filter((p) => p.status === "upcoming").slice(0, 5)
  const overdue = payments.filter((p) => p.status === "overdue")
  const occupied = goldItems.filter((g) => g.lockerId && g.status === "in_custody").length
  const capacity = vaults.reduce((s, v) => s + v.lockers.reduce((a, l) => a + l.capacity, 0), 0)

  return (
    <div>
      <PageHeader
        eyebrow={settings.shopName}
        title="Atelier desk"
        description="Gold under custody, active financing, certificates and collections — one system of record."
        actions={
          <Button asChild>
            <Link to="/financing/new">New financing</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Gold under custody" value={formatGrams(goldWeight)} hint={`${inCustody.length} packets`} icon={<Coins className="h-5 w-5" />} />
        <StatCard label="Total gold value" value={<Money value={goldValue} compact />} hint="Assessed at booked rates" icon={<Vault className="h-5 w-5" />} />
        <StatCard label="Active financing" value={String(activeFin.length)} hint="Open facilities" icon={<Landmark className="h-5 w-5" />} />
        <StatCard label="Outstanding" value={<Money value={outstanding} compact />} hint="Fees + principal unpaid" icon={<Wallet className="h-5 w-5" />} />
        <StatCard label="Active certificates" value={String(certificates.filter((c) => c.status === "active").length)} hint="Issued and live" icon={<BadgeCheck className="h-5 w-5" />} />
        <StatCard label="Overdue accounts" value={String(new Set(overdue.map((p) => p.financingId)).size)} hint={`${overdue.length} installments`} icon={<AlertTriangle className="h-5 w-5" />} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Portfolio & collections</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(v) => `$${Number(v ?? 0).toLocaleString()}`} />
                <Area type="monotone" dataKey="financing" stroke="var(--color-chart-1)" fill="var(--color-chart-1)" fillOpacity={0.15} />
                <Area type="monotone" dataKey="collections" stroke="var(--color-chart-2)" fill="var(--color-chart-2)" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Vault occupancy</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={vaults.map((v) => ({
                  name: v.id.replace("VLT-", ""),
                  used: goldItems.filter((g) => g.vaultId === v.id && g.status === "in_custody").length,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="used" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="mt-2 text-xs text-muted-foreground">
              {occupied} secured packets · {capacity} locker slots
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Upcoming payments</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/payments">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Due</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcoming.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatDate(p.dueDate)}</TableCell>
                    <TableCell>{customers.find((c) => c.id === p.customerId)?.name}</TableCell>
                    <TableCell>
                      <Money value={p.amountUsd} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Recent financing</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/financing">Portfolio</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Facility</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Outstanding</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {financings.slice(0, 5).map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      <Link className="font-medium hover:underline" to={`/financing/${f.id}`}>
                        {f.id}
                      </Link>
                      <p className="text-xs text-muted-foreground">{customers.find((c) => c.id === f.customerId)?.name}</p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={f.status} />
                    </TableCell>
                    <TableCell>
                      <Money value={f.outstandingUsd} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
