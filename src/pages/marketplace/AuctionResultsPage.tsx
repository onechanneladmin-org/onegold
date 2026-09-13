import { Link } from "react-router-dom"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Money } from "@/components/shared/Money"
import { EmptyState } from "@/components/shared/EmptyState"
import { formatDate } from "@/lib/format"
import { uniqueBidderCount } from "@/lib/auction"
import { useAppState } from "@/store/AppStore"

export function AuctionResultsPage() {
  const { auctions, bids } = useAppState()
  const closed = auctions.filter((a) => ["ended", "reserve_not_met", "settled", "withdrawn"].includes(a.status))

  return (
    <div>
      <PageHeader
        eyebrow="Archive"
        title="Auction results"
        description="Closed auctions: winners, reserve failures, withdrawals and completed settlements."
      />
      {closed.length === 0 ? (
        <EmptyState title="No closed auctions yet" />
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Auction</TableHead>
                <TableHead>Certificate</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Winner</TableHead>
                <TableHead>Hammer</TableHead>
                <TableHead>Bidders</TableHead>
                <TableHead>Closed</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {closed.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <Link className="font-medium hover:underline" to={`/marketplace/auctions/${a.id}`}>
                      {a.id}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link className="hover:underline" to={`/certificates/${a.certificateId}`}>
                      {a.certificateId}
                    </Link>
                  </TableCell>
                  <TableCell>{a.sellerName}</TableCell>
                  <TableCell>{a.winnerName ?? "—"}</TableCell>
                  <TableCell>{a.winningBidUsd != null ? <Money value={a.winningBidUsd} /> : "—"}</TableCell>
                  <TableCell>{uniqueBidderCount(a.id, bids)}</TableCell>
                  <TableCell>{formatDate(a.endsAt)}</TableCell>
                  <TableCell>
                    <StatusBadge value={a.status} />
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
