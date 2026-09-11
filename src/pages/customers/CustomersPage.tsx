import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { EmptyState } from "@/components/shared/EmptyState"
import { formatDate } from "@/lib/format"
import { useAppState, useAppStore } from "@/store/AppStore"
import type { KycStatus, RiskRating } from "@/types"

export function CustomersPage() {
  const { customers } = useAppState()
  const { createCustomer } = useAppStore()
  const [q, setQ] = useState("")
  const [kyc, setKyc] = useState<"all" | KycStatus>("all")
  const [open, setOpen] = useState(false)

  const rows = useMemo(() => {
    return customers.filter((c) => {
      const match =
        c.name.toLowerCase().includes(q.toLowerCase()) ||
        c.city.toLowerCase().includes(q.toLowerCase()) ||
        c.id.toLowerCase().includes(q.toLowerCase())
      return match && (kyc === "all" || c.kycStatus === kyc)
    })
  }, [customers, q, kyc])

  return (
    <div>
      <PageHeader
        eyebrow="Registry"
        title="Customers"
        description="Identity, KYC and risk for every pledgor who brings gold into the atelier."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Register customer</Button>
            </DialogTrigger>
            <CustomerForm
              onSubmit={(data) => {
                const created = createCustomer(data)
                toast.success(`${created.name} registered`)
                setOpen(false)
              }}
            />
          </Dialog>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, city or ID" className="sm:max-w-xs" />
        <Select value={kyc} onValueChange={(v) => setKyc(v as typeof kyc)}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="KYC" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All KYC</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_review">In review</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<Users className="h-8 w-8" />} title="No customers match" description="Register a walk-in or clear filters." />
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>KYC</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Since</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link to={`/customers/${c.id}`} className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{c.avatarInitials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.id}</p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    {c.city}, {c.country}
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={c.kycStatus} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={c.riskRating} />
                  </TableCell>
                  <TableCell>{formatDate(c.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

function CustomerForm({
  onSubmit,
}: {
  onSubmit: (data: {
    name: string
    identityType: string
    identityNumber: string
    email: string
    phone: string
    address: string
    city: string
    country: string
    countryCode: string
    riskRating: RiskRating
    notes: string
  }) => void
}) {
  const [name, setName] = useState("")
  const [identityType, setIdentityType] = useState("Passport")
  const [identityNumber, setIdentityNumber] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("")
  const [countryCode, setCountryCode] = useState("")
  const [riskRating, setRiskRating] = useState<RiskRating>("medium")
  const [notes, setNotes] = useState("")

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Register customer</DialogTitle>
      </DialogHeader>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Full name" value={name} onChange={setName} />
        <Field label="Identity type" value={identityType} onChange={setIdentityType} />
        <Field label="Identity number" value={identityNumber} onChange={setIdentityNumber} />
        <Field label="Email" value={email} onChange={setEmail} />
        <Field label="Phone" value={phone} onChange={setPhone} />
        <Field label="City" value={city} onChange={setCity} />
        <Field label="Country" value={country} onChange={setCountry} />
        <Field label="Country code" value={countryCode} onChange={setCountryCode} />
        <div className="space-y-2 sm:col-span-2">
          <Label>Address</Label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Risk</Label>
          <Select value={riskRating} onValueChange={(v) => setRiskRating(v as RiskRating)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Field label="Notes" value={notes} onChange={setNotes} />
      </div>
      <DialogFooter>
        <Button
          onClick={() => {
            if (!name || !identityNumber) return
            onSubmit({ name, identityType, identityNumber, email, phone, address, city, country, countryCode, riskRating, notes })
          }}
        >
          Create profile
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
