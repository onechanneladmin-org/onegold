import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Money } from "@/components/shared/Money"
import { EmptyState } from "@/components/shared/EmptyState"
import { formatDateTime } from "@/lib/format"
import { namesMatch } from "@/lib/auction"
import { useAppState, useAppStore } from "@/store/AppStore"

export function MyBidsPage() {
  const { bids, auctions, approvedBidders, sessionBidder } = useAppState()
  const { setSessionBidder } = useAppStore()
  const mine = bids.filter((b) => namesMatch(b.bidderName, sessionBidder))

  return (
    <div>
      <PageHeader
        eyebrow="Book"
        title="My bids"
        description="Operator desk acting for an approved buyer. Switch identity to review another book."
        actions={
          <Select value={sessionBidder} onValueChange={setSessionBidder}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {approvedBidders.filter((b) => b.approved).map((b) => (
                <SelectItem key={b.id} value={b.name}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
      {mine.length === 0 ? (
        <EmptyState title={`No bids for ${sessionBidder}`} />
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Auction</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {mine.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>{formatDateTime(b.at)}</TableCell>
                  <TableCell>{b.auctionId}</TableCell>
                  <TableCell>
                    <Money value={b.amountUsd} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={b.status} />
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" asChild>
                      <Link to={`/marketplace/auctions/${b.auctionId}`}>Open</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <p className="mt-3 text-xs text-muted-foreground">{auctions.filter((a) => a.status === "live").length} live auctions on the floor.</p>
    </div>
  )
}
