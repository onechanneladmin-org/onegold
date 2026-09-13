import { StatusBadge } from "@/components/shared/StatusBadge"
import { Money } from "@/components/shared/Money"
import { formatDateTime } from "@/lib/format"
import type { AuctionBid } from "@/types"

export function BidHistory({ bids }: { bids: AuctionBid[] }) {
  const ordered = [...bids].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  if (ordered.length === 0) {
    return <p className="text-sm text-muted-foreground">No bids yet. The starting price is still available.</p>
  }
  return (
    <ol className="space-y-3">
      {ordered.map((bid, index) => (
        <li key={bid.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
          <div>
            <p className="font-medium">{bid.bidderName}</p>
            <p className="text-xs text-muted-foreground">{formatDateTime(bid.at)}</p>
          </div>
          <div className="text-right">
            <p className="font-serif text-lg">
              <Money value={bid.amountUsd} />
            </p>
            <div className="mt-1 flex justify-end gap-2">
              {index === 0 && (bid.status === "winning" || bid.status === "won") ? (
                <span className="text-[10px] uppercase tracking-wider text-primary">Highest</span>
              ) : null}
              <StatusBadge value={bid.status} />
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}
