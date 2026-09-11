export type KycStatus = "pending" | "in_review" | "verified" | "rejected"
export type RiskRating = "low" | "medium" | "high"
export type GoldItemType = "jewelry" | "bar" | "coin" | "biscuit" | "ornament"
export type GoldStatus = "intake" | "verified" | "in_custody" | "released"
export type CustodyStatus = "pending_deposit" | "secured" | "in_transit" | "released"
export type FinancingStatus =
  | "pending"
  | "active"
  | "maturing"
  | "overdue"
  | "closed"
  | "recovery"
export type FinancingStructure = "ar_rahnu" | "ujrah" | "agreed_profit"
export type PaymentFrequency = "monthly" | "quarterly" | "bullet"
export type PaymentStatus = "upcoming" | "paid" | "partial" | "overdue" | "completed"
export type CertificateStatus = "active" | "redeemed" | "suspended" | "closed"
export type Eligibility =
  | "TRADING_ELIGIBLE"
  | "TRANSFER_RESTRICTED"
  | "HOLD_TO_MATURITY"
  | "SUSPENDED"
export type ReviewStatus = "pending" | "approved" | "rejected" | "needs_info"
export type MarketplaceListingStatus =
  | "pending_review"
  | "listed"
  | "reserved"
  | "settled"
  | "withdrawn"
export type RecoveryStage = "delinquent" | "review" | "recovery" | "auction_prep"
export type EntityType =
  | "customer"
  | "gold"
  | "financing"
  | "certificate"
  | "payment"
  | "vault"
  | "marketplace"
  | "compliance"

export interface Customer {
  id: string
  name: string
  identityType: string
  identityNumber: string
  email: string
  phone: string
  address: string
  city: string
  country: string
  countryCode: string
  kycStatus: KycStatus
  riskRating: RiskRating
  notes: string
  createdAt: string
  avatarInitials: string
}

export interface CustomerDocument {
  id: string
  customerId: string
  name: string
  type: string
  uploadedAt: string
  status: ReviewStatus
}

export interface ActivityEvent {
  id: string
  entityType: EntityType
  entityId: string
  customerId?: string
  title: string
  detail: string
  at: string
  actor: string
}

export interface GoldMovement {
  id: string
  at: string
  from: string
  to: string
  reason: string
  actor: string
}

export interface GoldItem {
  id: string
  customerId: string
  itemType: GoldItemType
  description: string
  grossWeightGrams: number
  netWeightGrams: number
  karat: number
  fineness: number
  goldRateUsdPerGram: number
  assessedValueUsd: number
  photos: string[]
  assayLab: string
  assayRef: string
  assayDate: string
  verified: boolean
  status: GoldStatus
  vaultId: string | null
  lockerId: string | null
  packetId: string | null
  sealId: string | null
  custodyStatus: CustodyStatus
  depositDate: string | null
  movements: GoldMovement[]
  createdAt: string
}

export interface PaymentInstallment {
  id: string
  financingId: string
  customerId: string
  dueDate: string
  amountUsd: number
  paidAmountUsd: number
  status: PaymentStatus
  paidAt: string | null
  method?: string
  note?: string
}

export interface FinancingTermsSnapshot {
  amountUsd: number
  structure: FinancingStructure
  feeLabel: string
  feeAmountUsd: number
  tenureMonths: number
  paymentFrequency: PaymentFrequency
  startDate: string
  maturityDate: string
  renewedAt?: string
}

export interface Financing {
  id: string
  customerId: string
  goldId: string
  amountUsd: number
  structure: FinancingStructure
  feeLabel: string
  feeAmountUsd: number
  tenureMonths: number
  paymentFrequency: PaymentFrequency
  startDate: string
  maturityDate: string
  outstandingUsd: number
  status: FinancingStatus
  shariahReviewStatus: ReviewStatus
  legalReviewStatus: ReviewStatus
  ltvPercent: number
  maxFinancingUsd: number
  history: FinancingTermsSnapshot[]
  recoveryStage?: RecoveryStage
  createdAt: string
}

export interface OwnershipRecord {
  id: string
  ownerName: string
  ownerType: "customer" | "investor" | "operator"
  from: string
  to: string | null
  event: string
}

export interface EligibilityChecks {
  ownershipClear: boolean
  goldVerified: boolean
  complianceApproved: boolean
  shariahReviewApproved: boolean
}

export interface Certificate {
  id: string
  goldId: string
  customerId: string
  financingId: string
  goldType: string
  weightGrams: number
  purityKarat: number
  goldValueUsd: number
  financingAmountUsd: number
  outstandingUsd: number
  issueDate: string
  maturityDate: string
  status: CertificateStatus
  ownershipName: string
  verificationId: string
  eligibility: Eligibility
  eligibilityChecks: EligibilityChecks
  ownershipHistory: OwnershipRecord[]
  createdAt: string
}

export interface Locker {
  id: string
  label: string
  row: string
  capacity: number
}

export interface Vault {
  id: string
  name: string
  location: string
  lockers: Locker[]
}

export interface MarketplaceListing {
  id: string
  certificateId: string
  sellerName: string
  askingPriceUsd: number
  status: MarketplaceListingStatus
  listedAt: string
  buyerName?: string
  settledAt?: string
}

export interface ComplianceReview {
  id: string
  type: "kyc" | "aml" | "gold_verification" | "shariah" | "eligibility"
  subjectId: string
  subjectLabel: string
  status: ReviewStatus
  reviewer: string
  notes: string
  updatedAt: string
}

export interface StructureTemplate {
  id: FinancingStructure
  name: string
  description: string
  defaultFeePercent: number
  feeLabel: string
}

export interface Settings {
  shopName: string
  shopLocation: string
  goldReferenceUsdPerGram: number
  defaultLtvPercent: number
  structures: StructureTemplate[]
}

export interface AppState {
  settings: Settings
  customers: Customer[]
  documents: CustomerDocument[]
  goldItems: GoldItem[]
  financings: Financing[]
  payments: PaymentInstallment[]
  certificates: Certificate[]
  vaults: Vault[]
  listings: MarketplaceListing[]
  reviews: ComplianceReview[]
  activities: ActivityEvent[]
}

export interface CreateCustomerInput {
  name: string
  identityType: string
  identityNumber: string
  email: string
  phone: string
  address: string
  city: string
  country: string
  countryCode: string
  riskRating: RiskRating
  notes: string
}

export interface IntakeGoldInput {
  customerId: string
  itemType: GoldItemType
  description: string
  grossWeightGrams: number
  netWeightGrams: number
  karat: number
  assayLab: string
  assayRef: string
}

export interface CreateFinancingInput {
  customerId: string
  goldId: string
  amountUsd: number
  structure: FinancingStructure
  tenureMonths: number
  paymentFrequency: PaymentFrequency
  startDate: string
  vaultId: string
  lockerId: string
}

export interface RecordPaymentInput {
  paymentId: string
  amountUsd: number
  method: string
  note?: string
}

export interface RenewFinancingInput {
  financingId: string
  tenureMonths: number
  paymentFrequency: PaymentFrequency
  feeAmountUsd: number
  startDate: string
}

export interface ListCertificateInput {
  certificateId: string
  askingPriceUsd: number
}
