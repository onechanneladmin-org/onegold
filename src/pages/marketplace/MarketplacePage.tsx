import { Link } from "react-router-dom"
import { Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Money } from "@/components/shared/Money"
import { EmptyState } from "@/components/shared/EmptyState"
import { formatDate } from "@/lib/format"
import { useAppState, useAppStore } from "@/store/AppStore"

export function MarketplacePage() {
  const { listings, certificates, activities, auctions, bids } = useAppState()
  const { withdrawListing } = useAppStore()
  const liveAuctions = auctions.filter((a) => a.status === "live")

  const trail = activities.filter((a) => a.entityType === "marketplace" || a.entityType === "auction").slice(0, 8)

  return (
    <div>
      <PageHeader
        eyebrow="Controlled market"
        title="Certificate marketplace"
        description="Certificates trade only by auction: bid, then settle. Not a securities exchange."
        actions={
          <Button asChild>
            <Link to="/marketplace/auctions">Auction floor</Link>
          </Button>
        }
      />
      <div className="mb-4 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm">
        Fixed-price buy requests are disabled. Ownership changes only after a winning bid is settled on the auction floor.
        {liveAuctions.length > 0 ? (
          <>
            {" "}
            <Link className="font-medium underline" to="/marketplace/auctions">
              {liveAuctions.length} live auction{liveAuctions.length === 1 ? "" : "s"}
            </Link>
            {bids.some((b) => b.auctionId === liveAuctions[0]?.id)
              ? ` · high book on ${liveAuctions[0].id}`
              : ""}
            .
          </>
        ) : null}
      </div>

      {listings.length === 0 ? (
        <EmptyState
          icon={<Store className="h-8 w-8" />}
          title="No certificate records"
          description="Open an auction from an eligible certificate to start bidding."
          action={
            <Button asChild>
              <Link to="/marketplace/auctions/new">Create auction</Link>
            </Button>
          }
        />
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Listing</TableHead>
                <TableHead>Certificate</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Listed</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.map((l) => {
                const cert = certificates.find((c) => c.id === l.certificateId)
                const auction = auctions.find(
                  (a) =>
                    a.certificateId === l.certificateId &&
                    (a.status === "live" || a.status === "scheduled" || a.status === "ended"),
                )
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
                      {auction ? (
                        <Button size="sm" asChild>
                          <Link to={`/marketplace/auctions/${auction.id}`}>Open auction</Link>
                        </Button>
                      ) : l.status === "listed" || l.status === "pending_review" ? (
                        <Button size="sm" asChild>
                          <Link to={`/marketplace/auctions/new?certificate=${l.certificateId}`}>Create auction</Link>
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
    </div>
  )
}
