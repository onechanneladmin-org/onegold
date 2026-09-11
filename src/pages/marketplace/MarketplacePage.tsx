import { useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Money } from "@/components/shared/Money"
import { EmptyState } from "@/components/shared/EmptyState"
import { formatDate } from "@/lib/format"
import { useAppState, useAppStore } from "@/store/AppStore"

export function MarketplacePage() {
  const { listings, certificates, activities } = useAppState()
  const { requestTransfer, settleTransfer, withdrawListing } = useAppStore()
  const [buyer, setBuyer] = useState("")
  const [listingId, setListingId] = useState<string | null>(null)

  const trail = activities.filter((a) => a.entityType === "marketplace").slice(0, 8)

  return (
    <div>
      <PageHeader
        eyebrow="Controlled market"
        title="Certificate marketplace"
        description="Mock venue for eligible certificates. Not a securities exchange. No real settlement rail."
      />
      <div className="mb-4 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm">
        Mock marketplace only. Listings do not constitute an offer of securities, and transfers are operator-simulated.
      </div>

      {listings.length === 0 ? (
        <EmptyState icon={<Store className="h-8 w-8" />} title="No listings" description="Eligible certificates can be submitted from the certificate page." />
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Listing</TableHead>
                <TableHead>Certificate</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Ask</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Listed</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.map((l) => {
                const cert = certificates.find((c) => c.id === l.certificateId)
                return (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.id}</TableCell>
                    <TableCell>
                      <Link className="hover:underline" to={`/certificates/${l.certificateId}`}>{l.certificateId}</Link>
                      <p className="text-xs text-muted-foreground">{cert ? <StatusBadge value={cert.eligibility} /> : null}</p>
                    </TableCell>
                    <TableCell>{l.sellerName}</TableCell>
                    <TableCell><Money value={l.askingPriceUsd} /></TableCell>
                    <TableCell><StatusBadge value={l.status} /></TableCell>
                    <TableCell>{formatDate(l.listedAt)}</TableCell>
                    <TableCell className="space-x-2">
                      {l.status === "listed" ? (
                        <Button size="sm" onClick={() => setListingId(l.id)}>Request buy</Button>
                      ) : null}
                      {l.status === "reserved" ? (
                        <Button size="sm" onClick={() => { settleTransfer(l.id); toast.success("Ownership transferred") }}>
                          Settle
                        </Button>
                      ) : null}
                      {l.status === "listed" || l.status === "pending_review" ? (
                        <Button size="sm" variant="ghost" onClick={() => withdrawListing(l.id)}>Withdraw</Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Marketplace audit trail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {trail.map((a) => (
            <p key={a.id}><span className="text-muted-foreground">{formatDate(a.at)} · </span>{a.title} — {a.detail}</p>
          ))}
        </CardContent>
      </Card>

      <Dialog open={Boolean(listingId)} onOpenChange={(o) => !o && setListingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buy / transfer request</DialogTitle>
          </DialogHeader>
          <Label>Approved investor name</Label>
          <Input value={buyer} onChange={(e) => setBuyer(e.target.value)} placeholder="e.g. Horizon Metals Ltd" />
          <DialogFooter>
            <Button
              onClick={() => {
                if (!listingId || !buyer) return
                requestTransfer(listingId, buyer)
                toast.success("Transfer requested")
                setListingId(null)
                setBuyer("")
              }}
            >
              Submit request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
