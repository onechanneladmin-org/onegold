import { useEffect, useState, type ReactNode } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Money } from "@/components/shared/Money"
import { EmptyState } from "@/components/shared/EmptyState"
import { AuctionCountdown, useCountdown } from "@/components/marketplace/AuctionCountdown"
import { BidHistory } from "@/components/marketplace/BidHistory"
import { auctionBids, highestBid, minNextBid, uniqueBidderCount } from "@/lib/auction"
import { formatDateTime } from "@/lib/format"
import { useAppState, useAppStore } from "@/store/AppStore"

export function AuctionDetailPage() {
  const { id } = useParams()
  const { auctions, bids, certificates, approvedBidders, sessionBidder } = useAppState()
  const { placeBid, closeAuctionNow, settleAuction, withdrawAuction, setSessionBidder } = useAppStore()
  const auction = auctions.find((a) => a.id === id)
  const [bidOpen, setBidOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const countdown = useCountdown(auction?.endsAt ?? new Date().toISOString())

  useEffect(() => {
    if (countdown.expired && auction?.status === "live") {
      closeAuctionNow(auction.id)
    }
  }, [countdown.expired, auction, closeAuctionNow])

  if (!auction) {
    return (
      <EmptyState
        title="Auction not found"
        action={
          <Button asChild>
            <Link to="/marketplace/auctions">Back to floor</Link>
          </Button>
        }
      />
    )
  }

  const cert = certificates.find((c) => c.id === auction.certificateId)
  const history = auctionBids(auction.id, bids)
  const high = highestBid(auction.id, bids)
  const minBid = minNextBid(auction, bids)
  const bidders = approvedBidders.filter((b) => b.approved)
  const canBid = auction.status === "live" && !countdown.expired

  return (
    <div>
      <PageHeader
        eyebrow="Auction"
        title={auction.id}
        description={`${auction.certificateId} · Seller ${auction.sellerName}`}
        actions={
          <>
            {canBid ? (
              <Button
                onClick={() => {
                  setAmount(String(minBid))
                  setBidOpen(true)
                }}
              >
                Place bid
              </Button>
            ) : null}
            {auction.status === "live" ? (
              <Button
                variant="outline"
                onClick={() => {
                  const result = closeAuctionNow(auction.id)
                  if (!result.ok) toast.error(result.error)
                  else toast.message("Auction closed — evaluating reserve")
                }}
              >
                End now
              </Button>
            ) : null}
            {auction.status === "ended" ? (
              <Button
                onClick={() => {
                  const result = settleAuction(auction.id)
                  if (!result.ok) toast.error(result.error)
                  else toast.success("Ownership transferred")
                }}
              >
                Settle & transfer
              </Button>
            ) : null}
            {auction.status === "live" || auction.status === "scheduled" ? (
              <Button
                variant="ghost"
                onClick={() => {
                  const result = withdrawAuction(auction.id)
                  if (!result.ok) toast.error(result.error)
                  else toast.message("Auction withdrawn")
                }}
              >
                Withdraw
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Live book</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-4 text-sm">
              <Stat label="Starting" value={<Money value={auction.startingPriceUsd} />} />
              <Stat label="Highest bid" value={high ? <Money value={high.amountUsd} /> : "Awaiting first bid"} />
              <Stat label="Bidders" value={String(uniqueBidderCount(auction.id, bids))} />
              <Stat label="Reserve" value={auction.reservePriceUsd != null ? <Money value={auction.reservePriceUsd} /> : "None"} />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge value={auction.status} />
              <AuctionCountdown endsAt={auction.endsAt} />
            </div>
            <p className="text-xs text-muted-foreground">
              Example path: $10,000 → $10,200 → $10,500 → $11,000. Each bid must beat the book by the minimum increment.
            </p>
            <BidHistory bids={history} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Certificate & outcome</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Link className="block rounded-lg border p-3 hover:bg-accent" to={`/certificates/${auction.certificateId}`}>
              {auction.certificateId}
              <p className="text-muted-foreground">{cert?.ownershipName}</p>
            </Link>
            <p>Opens {formatDateTime(auction.startsAt)}</p>
            <p>Closes {formatDateTime(auction.endsAt)}</p>
            {auction.winnerName ? (
              <div className="rounded-lg border border-gold/40 bg-gold/10 p-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Winning bid</p>
                <p className="font-medium">{auction.winnerName}</p>
                <p><Money value={auction.winningBidUsd ?? 0} /></p>
              </div>
            ) : null}
            {auction.status === "ended" ? (
              <ol className="space-y-2 text-xs text-muted-foreground">
                <li>1. Highest valid bid met the reserve</li>
                <li>2. Mock settlement (no payment rail)</li>
                <li>3. Ownership transfers on the certificate</li>
              </ol>
            ) : null}
            {auction.status === "reserve_not_met" ? (
              <p className="text-amber-800 dark:text-amber-300">Reserve was not met. No ownership change.</p>
            ) : null}
            {auction.status === "settled" ? (
              <p>Settled {formatDateTime(auction.settledAt)}. Certificate holder is now {cert?.ownershipName}.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Dialog open={bidOpen} onOpenChange={setBidOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Place bid</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Minimum next bid <Money value={minBid} />. Self-bidding and expired auctions are blocked.
          </p>
          <Label>Approved bidder</Label>
          <Select value={sessionBidder} onValueChange={setSessionBidder}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {bidders.map((b) => (
                <SelectItem key={b.id} value={b.name}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Label>Amount (USD)</Label>
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <DialogFooter>
            <Button
              onClick={() => {
                const result = placeBid({
                  auctionId: auction.id,
                  bidderName: sessionBidder,
                  amountUsd: Number(amount),
                })
                if (!result.ok) {
                  toast.error(result.error)
                  return
                }
                toast.success("Bid accepted")
                setBidOpen(false)
              }}
            >
              Submit bid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="font-medium">{value}</div>
    </div>
  )
}
