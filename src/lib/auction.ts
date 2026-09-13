import type {
  Auction,
  AuctionBid,
  AuctionStatus,
  Certificate,
} from "@/types"
import { isTradable } from "@/lib/eligibility"
import { roundMoney } from "@/lib/money"

export const MIN_BID_INCREMENT_USD = 50

export function namesMatch(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

export function auctionBids(auctionId: string, bids: AuctionBid[]): AuctionBid[] {
  return bids.filter((b) => b.auctionId === auctionId && b.status !== "invalid").sort((a, b) => {
    if (b.amountUsd !== a.amountUsd) return b.amountUsd - a.amountUsd
    return new Date(b.at).getTime() - new Date(a.at).getTime()
  })
}

export function highestBid(auctionId: string, bids: AuctionBid[]): AuctionBid | undefined {
  return auctionBids(auctionId, bids)[0]
}

export function uniqueBidderCount(auctionId: string, bids: AuctionBid[]): number {
  return new Set(auctionBids(auctionId, bids).map((b) => b.bidderName)).size
}

export function minNextBid(auction: Auction, bids: AuctionBid[]): number {
  const high = highestBid(auction.id, bids)
  const base = high ? high.amountUsd : auction.startingPriceUsd
  const increment = Math.max(MIN_BID_INCREMENT_USD, roundMoney(base * 0.01))
  return high ? roundMoney(base + increment) : auction.startingPriceUsd
}

export function isAuctionOpen(auction: Auction, now = new Date()): boolean {
  if (auction.status !== "live" && auction.status !== "scheduled") return false
  return now >= new Date(auction.startsAt) && now < new Date(auction.endsAt)
}

export function hasBlockingAuction(certificateId: string, auctions: Auction[]): boolean {
  return auctions.some(
    (a) =>
      a.certificateId === certificateId &&
      (a.status === "live" || a.status === "scheduled" || a.status === "ended"),
  )
}

export function canCreateAuction(
  certificate: Certificate | undefined,
  auctions: Auction[],
): { ok: boolean; error?: string } {
  if (!certificate) return { ok: false, error: "Certificate not found." }
  if (certificate.status !== "active") return { ok: false, error: "Only active certificates can be auctioned." }
  if (!isTradable(certificate)) {
    return { ok: false, error: "Certificate is not trading eligible. Complete ownership, gold, compliance, and Shariah reviews." }
  }
  if (hasBlockingAuction(certificate.id, auctions)) {
    return { ok: false, error: "This certificate already has an open or unsettled auction." }
  }
  return { ok: true }
}

export function validateBid(input: {
  auction: Auction
  bids: AuctionBid[]
  bidderName: string
  amountUsd: number
  approvedNames: string[]
  now?: Date
}): { ok: boolean; error?: string } {
  const now = input.now ?? new Date()
  const bidder = input.bidderName.trim()
  if (!bidder) return { ok: false, error: "Select an approved bidder." }
  if (!isAuctionOpen(input.auction, now)) {
    return { ok: false, error: "This auction is not accepting bids." }
  }
  if (now >= new Date(input.auction.endsAt)) {
    return { ok: false, error: "Auction has expired. Bids are closed." }
  }
  if (namesMatch(bidder, input.auction.sellerName)) {
    return { ok: false, error: "The certificate owner cannot bid on their own auction." }
  }
  if (!input.approvedNames.some((n) => namesMatch(n, bidder))) {
    return { ok: false, error: "Bidder is not on the approved investor / customer list." }
  }
  const min = minNextBid(input.auction, input.bids)
  if (!Number.isFinite(input.amountUsd) || input.amountUsd < min) {
    return { ok: false, error: `Bid must be at least $${min.toLocaleString("en-US", { minimumFractionDigits: 2 })}.` }
  }
  return { ok: true }
}

export function resolveExpiredAuction(
  auction: Auction,
  bids: AuctionBid[],
  now = new Date(),
): { auction: Auction; bids: AuctionBid[] } {
  if (auction.status !== "live" && auction.status !== "scheduled") {
    return { auction, bids }
  }
  if (now < new Date(auction.startsAt)) {
    return { auction: { ...auction, status: "scheduled" }, bids }
  }
  if (now < new Date(auction.endsAt)) {
    const high = highestBid(auction.id, bids)
    const nextBids = bids.map((b) => {
      if (b.auctionId !== auction.id || b.status === "invalid") return b
      if (high && b.id === high.id) return { ...b, status: "winning" as const }
      return { ...b, status: "outbid" as const }
    })
    return { auction: { ...auction, status: "live" }, bids: nextBids }
  }

  const high = highestBid(auction.id, bids)
  const reserve = auction.reservePriceUsd
  const met = Boolean(high && (reserve == null || high.amountUsd >= reserve))
  if (met && high) {
    return {
      auction: {
        ...auction,
        status: "ended",
        winnerName: high.bidderName,
        winningBidUsd: high.amountUsd,
      },
      bids: bids.map((b) => {
        if (b.auctionId !== auction.id || b.status === "invalid") return b
        return { ...b, status: b.id === high.id ? "won" : "lost" }
      }),
    }
  }
  return {
    auction: { ...auction, status: "reserve_not_met", winnerName: undefined, winningBidUsd: undefined },
    bids: bids.map((b) => (b.auctionId === auction.id && b.status !== "invalid" ? { ...b, status: "lost" as const } : b)),
  }
}

export function applyAuctionClock(
  auctions: Auction[],
  bids: AuctionBid[],
  now = new Date(),
): { auctions: Auction[]; bids: AuctionBid[] } {
  let nextBids = bids
  const nextAuctions = auctions.map((auction) => {
    const resolved = resolveExpiredAuction(auction, nextBids, now)
    nextBids = resolved.bids
    return resolved.auction
  })
  return { auctions: nextAuctions, bids: nextBids }
}

export const AUCTION_STATUS_LABELS: Record<AuctionStatus, string> = {
  scheduled: "Scheduled",
  live: "Live",
  ended: "Ended — winner",
  reserve_not_met: "Reserve not met",
  settled: "Settled",
  withdrawn: "Withdrawn",
}
