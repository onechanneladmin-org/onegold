import type { Certificate, Eligibility, EligibilityChecks } from "@/types"

export function deriveEligibility(checks: EligibilityChecks, suspended: boolean): Eligibility {
  if (suspended) return "SUSPENDED"
  if (!checks.goldVerified || !checks.ownershipClear) return "TRANSFER_RESTRICTED"
  if (!checks.complianceApproved || !checks.shariahReviewApproved) return "HOLD_TO_MATURITY"
  return "TRADING_ELIGIBLE"
}

export function isTradable(certificate: Certificate): boolean {
  return (
    certificate.status === "active" &&
    certificate.eligibility === "TRADING_ELIGIBLE" &&
    certificate.outstandingUsd === 0
  )
}
