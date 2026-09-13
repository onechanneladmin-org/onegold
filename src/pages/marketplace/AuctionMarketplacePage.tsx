import { Link } from "react-router-dom"
import { Gavel } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Money } from "@/components/shared/Money"
import { EmptyState } from "@/components/shared/EmptyState"
import { AuctionCountdown } from "@/components/marketplace/AuctionCountdown"
import { highestBid, uniqueBidderCount } from "@/lib/auction"
import { useAppState } from "@/store/AppStore"

export function AuctionMarketplacePage() {
  const { auctions, bids, certificates } = useAppState()
  const live = auctions.filter((a) => a.status === "live" || a.status === "scheduled")
  const others = auctions.filter((a) => a.status !== "live" && a.status !== "scheduled")

  return (
    <div>
      <PageHeader
        eyebrow="Auctions"
        title="Certificate auction floor"
        description="Eligible certificates only. Approved buyers compete against a starting price, optional reserve, and a live countdown."
        actions={
          <Button asChild>
            <Link to="/marketplace/auctions/new">Create auction</Link>
          </Button>
        }
      />
      <div className="mb-4 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm">
        Mock auction venue. Bids, settlement and ownership transfers are operator-simulated — not a securities exchange.
      </div>

      {live.length === 0 ? (
        <EmptyState
          icon={<Gavel className="h-8 w-8" />}
          title="No live auctions"
          description="List a trading-eligible certificate to open the floor."
          action={
            <Button asChild>
              <Link to="/marketplace/auctions/new">Create auction</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {live.map((auction) => {
            const high = highestBid(auction.id, bids)
            const cert = certificates.find((c) => c.id === auction.certificateId)
            return (
              <Card key={auction.id} className="overflow-hidden">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-primary">{auction.id}</p>
                      <p className="mt-1 font-serif text-2xl">{cert?.id}</p>
                      <p className="text-sm text-muted-foreground">Seller {auction.sellerName}</p>
                    </div>
                    <StatusBadge value={auction.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Starting</p>
                      <Money value={auction.startingPriceUsd} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Highest bid</p>
                      <p className="font-medium">{high ? <Money value={high.amountUsd} /> : "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Bidders</p>
                      <p>{uniqueBidderCount(auction.id, bids)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Reserve</p>
                      <p>{auction.reservePriceUsd != null ? <Money value={auction.reservePriceUsd} /> : "None"}</p>
                    </div>
                  </div>
                  <AuctionCountdown endsAt={auction.endsAt} />
                  <Button asChild className="w-full">
                    <Link to={`/marketplace/auctions/${auction.id}`}>Open auction</Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {others.length > 0 ? (
        <div className="mt-8">
          <h2 className="mb-3 font-serif text-xl">Recently closed</h2>
          <div className="space-y-2">
            {others.slice(0, 4).map((a) => (
              <Link
                key={a.id}
                to={`/marketplace/auctions/${a.id}`}
                className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 text-sm hover:bg-accent"
              >
                <span>
                  {a.id} · {a.certificateId}
                </span>
                <StatusBadge value={a.status} />
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
