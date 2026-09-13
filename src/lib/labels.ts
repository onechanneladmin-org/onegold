import type {
  AuctionStatus,
  BidStatus,
  CertificateStatus,
  CustodyStatus,
  Eligibility,
  FinancingStatus,
  FinancingStructure,
  GoldItemType,
  GoldStatus,
  KycStatus,
  MarketplaceListingStatus,
  PaymentFrequency,
  PaymentStatus,
  RecoveryStage,
  ReviewStatus,
  RiskRating,
} from "@/types"

export const GOLD_TYPE_LABELS: Record<GoldItemType, string> = {
  jewelry: "Jewelry",
  bar: "Cast bar",
  coin: "Coin",
  biscuit: "Biscuit / wafer",
  ornament: "Ornament",
}

export const GOLD_STATUS_LABELS: Record<GoldStatus, string> = {
  intake: "Intake",
  verified: "Verified",
  in_custody: "In custody",
  released: "Released",
}

export const CUSTODY_LABELS: Record<CustodyStatus, string> = {
  pending_deposit: "Pending deposit",
  secured: "Secured",
  in_transit: "In transit",
  released: "Released",
}

export const KYC_LABELS: Record<KycStatus, string> = {
  pending: "Pending",
  in_review: "In review",
  verified: "Verified",
  rejected: "Rejected",
}

export const RISK_LABELS: Record<RiskRating, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
}

export const FINANCING_STATUS_LABELS: Record<FinancingStatus, string> = {
  pending: "Pending",
  active: "Active",
  maturing: "Maturing soon",
  overdue: "Overdue",
  closed: "Closed",
  recovery: "Default / recovery",
}

export const STRUCTURE_LABELS: Record<FinancingStructure, string> = {
  ar_rahnu: "Ar-Rahnu",
  ujrah: "Ujrah fee",
  agreed_profit: "Agreed profit",
}

export const FREQUENCY_LABELS: Record<PaymentFrequency, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  bullet: "At maturity",
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  upcoming: "Upcoming",
  paid: "Paid",
  partial: "Partially paid",
  overdue: "Overdue",
  completed: "Completed",
}

export const CERT_STATUS_LABELS: Record<CertificateStatus, string> = {
  active: "Active",
  redeemed: "Redeemed",
  suspended: "Suspended",
  closed: "Closed",
}

export const ELIGIBILITY_LABELS: Record<Eligibility, string> = {
  TRADING_ELIGIBLE: "Trading eligible",
  TRANSFER_RESTRICTED: "Transfer restricted",
  HOLD_TO_MATURITY: "Hold to maturity",
  SUSPENDED: "Suspended",
}

export const REVIEW_LABELS: Record<ReviewStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  needs_info: "Needs information",
}

export const LISTING_LABELS: Record<MarketplaceListingStatus, string> = {
  pending_review: "Pending review",
  listed: "Listed",
  reserved: "Transfer requested",
  settled: "Settled",
  withdrawn: "Withdrawn",
}

export const RECOVERY_LABELS: Record<RecoveryStage, string> = {
  delinquent: "Delinquent",
  review: "Operator review",
  recovery: "Recovery",
  auction_prep: "Asset / auction prep",
}

export const AUCTION_STATUS_LABELS: Record<AuctionStatus, string> = {
  scheduled: "Scheduled",
  live: "Live",
  ended: "Ended — winner",
  reserve_not_met: "Reserve not met",
  settled: "Settled",
  withdrawn: "Withdrawn",
}

export const BID_STATUS_LABELS: Record<BidStatus, string> = {
  active: "Active",
  outbid: "Outbid",
  winning: "Winning",
  won: "Won",
  lost: "Lost",
  invalid: "Invalid",
}
