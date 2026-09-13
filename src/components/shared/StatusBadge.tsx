import { Badge } from "@/components/ui/badge"
import {
  CERT_STATUS_LABELS,
  CUSTODY_LABELS,
  ELIGIBILITY_LABELS,
  FINANCING_STATUS_LABELS,
  GOLD_STATUS_LABELS,
  KYC_LABELS,
  AUCTION_STATUS_LABELS,
  BID_STATUS_LABELS,
  LISTING_LABELS,
  PAYMENT_STATUS_LABELS,
  REVIEW_LABELS,
  RISK_LABELS,
} from "@/lib/labels"
import type {
  AuctionStatus,
  BidStatus,
  CertificateStatus,
  CustodyStatus,
  Eligibility,
  FinancingStatus,
  GoldStatus,
  KycStatus,
  MarketplaceListingStatus,
  PaymentStatus,
  ReviewStatus,
  RiskRating,
} from "@/types"

type Tone = "success" | "warning" | "danger" | "muted" | "gold" | "secondary" | "default"

function tone(t: Tone) {
  return t
}

export function StatusBadge({
  value,
}: {
  value:
    | FinancingStatus
    | PaymentStatus
    | KycStatus
    | GoldStatus
    | CustodyStatus
    | CertificateStatus
    | Eligibility
    | ReviewStatus
    | RiskRating
    | MarketplaceListingStatus
    | AuctionStatus
    | BidStatus
}) {
  const map: Record<string, { label: string; variant: Tone }> = {
    pending: { label: FINANCING_STATUS_LABELS.pending, variant: "muted" },
    active: { label: FINANCING_STATUS_LABELS.active, variant: "success" },
    maturing: { label: FINANCING_STATUS_LABELS.maturing, variant: "gold" },
    overdue: { label: FINANCING_STATUS_LABELS.overdue, variant: "danger" },
    closed: { label: FINANCING_STATUS_LABELS.closed, variant: "muted" },
    recovery: { label: FINANCING_STATUS_LABELS.recovery, variant: "danger" },
    upcoming: { label: PAYMENT_STATUS_LABELS.upcoming, variant: "secondary" },
    paid: { label: PAYMENT_STATUS_LABELS.paid, variant: "success" },
    partial: { label: PAYMENT_STATUS_LABELS.partial, variant: "warning" },
    completed: { label: PAYMENT_STATUS_LABELS.completed, variant: "muted" },
    in_review: { label: KYC_LABELS.in_review, variant: "warning" },
    verified: { label: KYC_LABELS.verified, variant: "success" },
    rejected: { label: KYC_LABELS.rejected, variant: "danger" },
    intake: { label: GOLD_STATUS_LABELS.intake, variant: "secondary" },
    in_custody: { label: GOLD_STATUS_LABELS.in_custody, variant: "success" },
    released: { label: GOLD_STATUS_LABELS.released, variant: "muted" },
    pending_deposit: { label: CUSTODY_LABELS.pending_deposit, variant: "warning" },
    secured: { label: CUSTODY_LABELS.secured, variant: "success" },
    in_transit: { label: CUSTODY_LABELS.in_transit, variant: "gold" },
    redeemed: { label: CERT_STATUS_LABELS.redeemed, variant: "muted" },
    suspended: { label: CERT_STATUS_LABELS.suspended, variant: "danger" },
    TRADING_ELIGIBLE: { label: ELIGIBILITY_LABELS.TRADING_ELIGIBLE, variant: "success" },
    TRANSFER_RESTRICTED: { label: ELIGIBILITY_LABELS.TRANSFER_RESTRICTED, variant: "warning" },
    HOLD_TO_MATURITY: { label: ELIGIBILITY_LABELS.HOLD_TO_MATURITY, variant: "gold" },
    SUSPENDED: { label: ELIGIBILITY_LABELS.SUSPENDED, variant: "danger" },
    approved: { label: REVIEW_LABELS.approved, variant: "success" },
    needs_info: { label: REVIEW_LABELS.needs_info, variant: "warning" },
    low: { label: RISK_LABELS.low, variant: "success" },
    medium: { label: RISK_LABELS.medium, variant: "warning" },
    high: { label: RISK_LABELS.high, variant: "danger" },
    pending_review: { label: LISTING_LABELS.pending_review, variant: "warning" },
    listed: { label: LISTING_LABELS.listed, variant: "success" },
    reserved: { label: LISTING_LABELS.reserved, variant: "gold" },
    settled: { label: LISTING_LABELS.settled, variant: "muted" },
    withdrawn: { label: LISTING_LABELS.withdrawn, variant: "muted" },
    scheduled: { label: AUCTION_STATUS_LABELS.scheduled, variant: "secondary" },
    live: { label: AUCTION_STATUS_LABELS.live, variant: "success" },
    ended: { label: AUCTION_STATUS_LABELS.ended, variant: "gold" },
    reserve_not_met: { label: AUCTION_STATUS_LABELS.reserve_not_met, variant: "warning" },
    outbid: { label: BID_STATUS_LABELS.outbid, variant: "warning" },
    winning: { label: BID_STATUS_LABELS.winning, variant: "success" },
    won: { label: BID_STATUS_LABELS.won, variant: "success" },
    lost: { label: BID_STATUS_LABELS.lost, variant: "muted" },
    invalid: { label: BID_STATUS_LABELS.invalid, variant: "danger" },
  }

  const item = map[value] ?? { label: String(value), variant: "secondary" as Tone }
  return <Badge variant={tone(item.variant)}>{item.label}</Badge>
}
