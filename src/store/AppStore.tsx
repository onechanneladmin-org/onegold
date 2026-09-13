import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { addHours, addMonths } from "date-fns"
import { createSeed } from "@/data/seed"
import {
  applyPaymentStatuses,
  assessGoldValue,
  buildPaymentSchedule,
  deriveFinancingStatus,
  feeForStructure,
  finenessFromKarat,
  maxFinancing,
  newActivity,
  remainingOutstanding,
} from "@/lib/calculations"
import { deriveEligibility } from "@/lib/eligibility"
import {
  applyAuctionClock,
  canCreateAuction,
  isAuctionOpen,
  namesMatch,
  validateBid,
} from "@/lib/auction"
import {
  initials,
  nextAuctionId,
  nextBidId,
  nextCertificateId,
  nextCustomerId,
  nextFinancingId,
  nextGoldId,
  nextListingId,
  nextPacketId,
  nextSealId,
  nextVerificationId,
  uid,
} from "@/lib/ids"
import { roundMoney } from "@/lib/money"
import type {
  AppState,
  Certificate,
  ComplianceReview,
  CreateCustomerInput,
  CreateFinancingInput,
  Customer,
  Financing,
  GoldItem,
  IntakeGoldInput,
  Auction,
  CreateAuctionInput,
  KycStatus,
  ListCertificateInput,
  MarketplaceListing,
  PlaceBidInput,
  RecordPaymentInput,
  RecoveryStage,
  RenewFinancingInput,
  ReviewStatus,
  Settings,
  StoreResult,
} from "@/types"

const STORAGE_KEY = "onegold-store"

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppState
      if (parsed?.customers && parsed?.goldItems && parsed?.settings) {
        const seed = createSeed()
        return refreshDerived({
          ...parsed,
          auctions: parsed.auctions ?? seed.auctions,
          bids: parsed.bids ?? seed.bids,
          approvedBidders: parsed.approvedBidders ?? seed.approvedBidders,
          sessionBidder: parsed.sessionBidder ?? seed.sessionBidder,
        })
      }
    }
  } catch {
    /* use seed */
  }
  return refreshDerived(createSeed())
}

function refreshDerived(state: AppState): AppState {
  const now = new Date()
  const payments = applyPaymentStatuses(state.payments, now)
  const financings = state.financings.map((f) => {
    const status = deriveFinancingStatus(f, payments, now)
    const outstanding = f.status === "closed" ? 0 : remainingOutstanding({ ...f, status }, payments)
    return { ...f, status, outstandingUsd: outstanding }
  })
  const certificates = state.certificates.map((c) => {
    const f = financings.find((x) => x.id === c.financingId)
    if (!f) return c
    return {
      ...c,
      outstandingUsd: f.outstandingUsd,
      maturityDate: f.maturityDate,
      status:
        f.status === "closed"
          ? c.status === "redeemed"
            ? "redeemed"
            : "closed"
          : f.status === "recovery"
            ? "suspended"
            : c.status,
    }
  })
  const clock = applyAuctionClock(state.auctions ?? [], state.bids ?? [], now)
  return {
    ...state,
    payments,
    financings,
    certificates,
    auctions: clock.auctions,
    bids: clock.bids,
    approvedBidders: state.approvedBidders ?? [],
    sessionBidder: state.sessionBidder ?? "Aurelia Capital",
  }
}

function persist(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export interface AppStoreValue {
  state: AppState
  resetToSeed: () => void
  updateSettings: (patch: Partial<Settings>) => void
  createCustomer: (input: CreateCustomerInput) => Customer
  updateKyc: (customerId: string, kycStatus: KycStatus, note?: string) => void
  intakeGold: (input: IntakeGoldInput) => GoldItem
  verifyGold: (goldId: string) => void
  moveGold: (goldId: string, vaultId: string, lockerId: string, reason: string) => void
  createFinancing: (input: CreateFinancingInput) => Financing
  recordPayment: (input: RecordPaymentInput) => void
  renewFinancing: (input: RenewFinancingInput) => void
  redeemGold: (financingId: string) => void
  startRecovery: (financingId: string) => void
  updateRecovery: (financingId: string, stage: RecoveryStage, note: string) => void
  listCertificate: (input: ListCertificateInput) => StoreResult<MarketplaceListing>
  requestTransfer: (listingId: string, buyerName: string) => void
  settleTransfer: (listingId: string) => void
  withdrawListing: (listingId: string) => void
  createAuction: (input: CreateAuctionInput) => StoreResult<Auction>
  placeBid: (input: PlaceBidInput) => StoreResult
  closeAuctionNow: (auctionId: string) => StoreResult
  settleAuction: (auctionId: string) => StoreResult
  withdrawAuction: (auctionId: string) => StoreResult
  setSessionBidder: (name: string) => void
  updateReview: (reviewId: string, status: ReviewStatus, notes: string) => void
  addReview: (review: Omit<ComplianceReview, "id" | "updatedAt">) => void
  updateCertificateChecks: (certificateId: string, patch: Partial<Certificate["eligibilityChecks"]>) => void
}

const AppStoreContext = createContext<AppStoreValue | null>(null)

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState())

  useEffect(() => {
    persist(state)
  }, [state])

  useEffect(() => {
    const tick = window.setInterval(() => {
      setState((prev) => refreshDerived(prev))
    }, 15000)
    return () => window.clearInterval(tick)
  }, [])

  const commit = useCallback((updater: (prev: AppState) => AppState) => {
    setState((prev) => refreshDerived(updater(prev)))
  }, [])

  const resetToSeed = useCallback(() => {
    const next = refreshDerived(createSeed())
    persist(next)
    setState(next)
  }, [])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    commit((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }))
  }, [commit])

  const createCustomer = useCallback((input: CreateCustomerInput) => {
    const created: Customer = {
      ...input,
      id: nextCustomerId(state.customers.map((c) => c.id)),
      kycStatus: "pending",
      createdAt: new Date().toISOString(),
      avatarInitials: initials(input.name),
    }
    commit((prev) => ({
      ...prev,
      customers: [created, ...prev.customers],
      documents: [
        {
          id: uid("doc"),
          customerId: created.id,
          name: `${input.identityType} on file`,
          type: "Identity",
          uploadedAt: created.createdAt,
          status: "pending",
        },
        ...prev.documents,
      ],
      reviews: [
        {
          id: uid("rev"),
          type: "kyc",
          subjectId: created.id,
          subjectLabel: `${created.name} — KYC`,
          status: "pending",
          reviewer: "Compliance Desk",
          notes: "New customer. Identity pack opened.",
          updatedAt: created.createdAt,
        },
        ...prev.reviews,
      ],
      activities: [
        newActivity({
          entityType: "customer",
          entityId: created.id,
          customerId: created.id,
          title: "Customer registered",
          detail: `${created.name} created. KYC pending.`,
        }),
        ...prev.activities,
      ],
    }))
    return created
  }, [commit, state.customers])

  const updateKyc = useCallback((customerId: string, kycStatus: KycStatus, note?: string) => {
    commit((prev) => ({
      ...prev,
      customers: prev.customers.map((c) => (c.id === customerId ? { ...c, kycStatus } : c)),
      reviews: prev.reviews.map((r) =>
        r.type === "kyc" && r.subjectId === customerId
          ? {
              ...r,
              status: kycStatus === "verified" ? "approved" : kycStatus === "rejected" ? "rejected" : "pending",
              notes: note ?? r.notes,
              updatedAt: new Date().toISOString(),
            }
          : r,
      ),
      activities: [
        newActivity({
          entityType: "customer",
          entityId: customerId,
          customerId,
          title: "KYC updated",
          detail: `Status set to ${kycStatus}${note ? ` — ${note}` : ""}.`,
        }),
        ...prev.activities,
      ],
    }))
  }, [commit])

  const intakeGold = useCallback((input: IntakeGoldInput) => {
    const rate = state.settings.goldReferenceUsdPerGram
    const created: GoldItem = {
      id: nextGoldId(state.goldItems.map((g) => g.id)),
      customerId: input.customerId,
      itemType: input.itemType,
      description: input.description,
      grossWeightGrams: input.grossWeightGrams,
      netWeightGrams: input.netWeightGrams,
      karat: input.karat,
      fineness: finenessFromKarat(input.karat),
      goldRateUsdPerGram: rate,
      assessedValueUsd: assessGoldValue(input.netWeightGrams, input.karat, rate),
      photos: ["https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800&q=80"],
      assayLab: input.assayLab,
      assayRef: input.assayRef,
      assayDate: new Date().toISOString(),
      verified: false,
      status: "intake",
      vaultId: "VLT-C",
      lockerId: "C-01",
      packetId: nextPacketId(state.goldItems.map((g) => g.packetId ?? "")),
      sealId: nextSealId(state.goldItems.map((g) => g.sealId ?? "")),
      custodyStatus: "pending_deposit",
      depositDate: null,
      movements: [
        {
          id: uid("mv"),
          at: new Date().toISOString(),
          from: "Receiving counter",
          to: "Vault C / C-01",
          reason: "Physical intake",
          actor: "Shop Operator",
        },
      ],
      createdAt: new Date().toISOString(),
    }
    commit((prev) => ({
      ...prev,
      goldItems: [created, ...prev.goldItems],
      reviews: [
        {
          id: uid("rev"),
          type: "gold_verification",
          subjectId: created.id,
          subjectLabel: `${created.id} assay`,
          status: "pending",
          reviewer: "Assay Desk",
          notes: "Awaiting verification.",
          updatedAt: created.createdAt,
        },
        ...prev.reviews,
      ],
      activities: [
        newActivity({
          entityType: "gold",
          entityId: created.id,
          customerId: input.customerId,
          title: "Gold intake recorded",
          detail: `${created.id} — ${created.description}. Held in intake cage.`,
        }),
        ...prev.activities,
      ],
    }))
    return created
  }, [commit, state.goldItems, state.settings.goldReferenceUsdPerGram])

  const verifyGold = useCallback((goldId: string) => {
    commit((prev) => ({
      ...prev,
      goldItems: prev.goldItems.map((g) =>
        g.id === goldId && g.status === "intake" ? { ...g, verified: true, status: "verified" } : g.id === goldId ? { ...g, verified: true } : g,
      ),
      reviews: prev.reviews.map((r) =>
        r.type === "gold_verification" && r.subjectId === goldId
          ? { ...r, status: "approved", notes: "Assay verified by operator.", updatedAt: new Date().toISOString() }
          : r,
      ),
      activities: [
        newActivity({
          entityType: "gold",
          entityId: goldId,
          title: "Gold verified",
          detail: `${goldId} assay marked verified.`,
        }),
        ...prev.activities,
      ],
    }))
  }, [commit])

  const moveGold = useCallback((goldId: string, vaultId: string, lockerId: string, reason: string) => {
    commit((prev) => {
      const item = prev.goldItems.find((g) => g.id === goldId)
      if (!item) return prev
      const fromVault = prev.vaults.find((v) => v.id === item.vaultId)
      const toVault = prev.vaults.find((v) => v.id === vaultId)
      const from = item.vaultId ? `${fromVault?.name ?? item.vaultId} / ${item.lockerId}` : "Unassigned"
      const to = `${toVault?.name ?? vaultId} / ${lockerId}`
      return {
        ...prev,
        goldItems: prev.goldItems.map((g) =>
          g.id === goldId
            ? {
                ...g,
                vaultId,
                lockerId,
                movements: [
                  {
                    id: uid("mv"),
                    at: new Date().toISOString(),
                    from,
                    to,
                    reason,
                    actor: "Vault Officer",
                  },
                  ...g.movements,
                ],
              }
            : g,
        ),
        activities: [
          newActivity({
            entityType: "vault",
            entityId: goldId,
            customerId: item.customerId,
            title: "Gold moved",
            detail: `${goldId} moved to ${to}. ${reason}`,
          }),
          ...prev.activities,
        ],
      }
    })
  }, [commit])

  const createFinancing = useCallback((input: CreateFinancingInput) => {
    const goldItem = state.goldItems.find((g) => g.id === input.goldId)
    const customer = state.customers.find((c) => c.id === input.customerId)
    const template = state.settings.structures.find((s) => s.id === input.structure)
    if (!goldItem || !customer || !template) {
      throw new Error("Missing customer, gold, or structure")
    }
    const fee = feeForStructure(
      input.amountUsd,
      input.structure,
      input.tenureMonths,
      template.defaultFeePercent,
    )
    const start = new Date(input.startDate)
    const maturity = addMonths(start, input.tenureMonths)
    const financingId = nextFinancingId(state.financings.map((f) => f.id))
    const goldValue = goldItem.assessedValueUsd
    const financing: Financing = {
      id: financingId,
      customerId: input.customerId,
      goldId: input.goldId,
      amountUsd: input.amountUsd,
      structure: input.structure,
      feeLabel: fee.feeLabel,
      feeAmountUsd: fee.feeAmountUsd,
      tenureMonths: input.tenureMonths,
      paymentFrequency: input.paymentFrequency,
      startDate: start.toISOString(),
      maturityDate: maturity.toISOString(),
      outstandingUsd: input.amountUsd + fee.feeAmountUsd,
      status: "active",
      shariahReviewStatus: "pending",
      legalReviewStatus: "pending",
      ltvPercent: state.settings.defaultLtvPercent,
      maxFinancingUsd: maxFinancing(goldValue, state.settings.defaultLtvPercent),
      history: [],
      createdAt: new Date().toISOString(),
    }
    const schedule = buildPaymentSchedule({
      financingId,
      customerId: input.customerId,
      amountUsd: input.amountUsd,
      feeAmountUsd: fee.feeAmountUsd,
      structure: input.structure,
      tenureMonths: input.tenureMonths,
      frequency: input.paymentFrequency,
      startDate: start.toISOString(),
      existingPaymentIds: state.payments.map((p) => p.id),
    })
    const vault = state.vaults.find((v) => v.id === input.vaultId)
    const certificate: Certificate = {
      id: nextCertificateId(state.certificates.map((c) => c.id)),
      goldId: goldItem.id,
      customerId: customer.id,
      financingId,
      goldType: goldItem.description,
      weightGrams: goldItem.netWeightGrams,
      purityKarat: goldItem.karat,
      goldValueUsd: goldValue,
      financingAmountUsd: input.amountUsd,
      outstandingUsd: financing.outstandingUsd,
      issueDate: start.toISOString(),
      maturityDate: maturity.toISOString(),
      status: "active",
      ownershipName: customer.name,
      verificationId: nextVerificationId(),
      eligibility: "HOLD_TO_MATURITY",
      eligibilityChecks: {
        ownershipClear: true,
        goldVerified: goldItem.verified,
        complianceApproved: false,
        shariahReviewApproved: false,
      },
      ownershipHistory: [
        {
          id: uid("own"),
          ownerName: customer.name,
          ownerType: "customer",
          from: start.toISOString(),
          to: null,
          event: "Issued to pledgor",
        },
      ],
      createdAt: new Date().toISOString(),
    }

    commit((prev) => ({
      ...prev,
      financings: [financing, ...prev.financings],
      payments: [...schedule, ...prev.payments],
      certificates: [certificate, ...prev.certificates],
      goldItems: prev.goldItems.map((g) =>
        g.id === goldItem.id
          ? {
              ...g,
              status: "in_custody",
              custodyStatus: "secured",
              vaultId: input.vaultId,
              lockerId: input.lockerId,
              depositDate: start.toISOString(),
              movements: [
                {
                  id: uid("mv"),
                  at: new Date().toISOString(),
                  from: g.vaultId ? `${g.vaultId} / ${g.lockerId}` : "Intake",
                  to: `${vault?.name ?? input.vaultId} / ${input.lockerId}`,
                  reason: "Financing approved — secured custody",
                  actor: "Vault Officer",
                },
                ...g.movements,
              ],
            }
          : g,
      ),
      reviews: [
        {
          id: uid("rev"),
          type: "shariah",
          subjectId: financingId,
          subjectLabel: `${financingId} structure review`,
          status: "pending",
          reviewer: "Shariah Advisor (external)",
          notes: "Requires advisor sign-off. OneGold does not certify legal or Shariah compliance.",
          updatedAt: new Date().toISOString(),
        },
        ...prev.reviews,
      ],
      activities: [
        newActivity({
          entityType: "financing",
          entityId: financingId,
          customerId: customer.id,
          title: "Financing created",
          detail: `${financingId} booked against ${goldItem.id}. Certificate ${certificate.id} issued. Gold moved to ${input.vaultId} / ${input.lockerId}.`,
        }),
        newActivity({
          entityType: "certificate",
          entityId: certificate.id,
          customerId: customer.id,
          title: "Digital certificate issued",
          detail: `${certificate.id} issued to ${customer.name}.`,
        }),
        ...prev.activities,
      ],
    }))
    return financing
  }, [commit, state])

  const recordPayment = useCallback((input: RecordPaymentInput) => {
    commit((prev) => {
      const payment = prev.payments.find((p) => p.id === input.paymentId)
      if (!payment) return prev
      const paidAmountUsd = roundMoney(Math.min(payment.amountUsd, payment.paidAmountUsd + input.amountUsd))
      const payments = prev.payments.map((p) =>
        p.id === input.paymentId
          ? {
              ...p,
              paidAmountUsd,
              paidAt: new Date().toISOString(),
              method: input.method,
              note: input.note,
              status: paidAmountUsd >= p.amountUsd ? ("paid" as const) : ("partial" as const),
            }
          : p,
      )
      return {
        ...prev,
        payments,
        activities: [
          newActivity({
            entityType: "payment",
            entityId: payment.financingId,
            customerId: payment.customerId,
            title: "Payment recorded",
            detail: `${input.method}: ${input.amountUsd.toFixed(2)} USD against ${payment.id}.`,
          }),
          ...prev.activities,
        ],
      }
    })
  }, [commit])

  const renewFinancing = useCallback((input: RenewFinancingInput) => {
    commit((prev) => {
      const financing = prev.financings.find((f) => f.id === input.financingId)
      if (!financing) return prev
      const start = new Date(input.startDate)
      const maturity = addMonths(start, input.tenureMonths)
      const snapshot = {
        amountUsd: financing.amountUsd,
        structure: financing.structure,
        feeLabel: financing.feeLabel,
        feeAmountUsd: financing.feeAmountUsd,
        tenureMonths: financing.tenureMonths,
        paymentFrequency: financing.paymentFrequency,
        startDate: financing.startDate,
        maturityDate: financing.maturityDate,
        renewedAt: new Date().toISOString(),
      }
      const leftover = prev.payments.filter(
        (p) => p.financingId === financing.id && p.paidAmountUsd < p.amountUsd,
      )
      const remainingPrincipal = leftover.reduce((s, p) => s + Math.max(0, p.amountUsd - p.paidAmountUsd), 0)
      const schedule = buildPaymentSchedule({
        financingId: financing.id,
        customerId: financing.customerId,
        amountUsd: roundMoney(Math.max(financing.outstandingUsd, remainingPrincipal) - input.feeAmountUsd),
        feeAmountUsd: input.feeAmountUsd,
        structure: financing.structure,
        tenureMonths: input.tenureMonths,
        frequency: input.paymentFrequency,
        startDate: start.toISOString(),
        existingPaymentIds: prev.payments.map((p) => p.id),
      })
      const payments = [
        ...schedule,
        ...prev.payments.map((p) =>
          p.financingId === financing.id && p.status !== "paid"
            ? { ...p, status: "completed" as const, note: "Superseded by renewal" }
            : p,
        ),
      ]
      return {
        ...prev,
        financings: prev.financings.map((f) =>
          f.id === financing.id
            ? {
                ...f,
                tenureMonths: input.tenureMonths,
                paymentFrequency: input.paymentFrequency,
                feeAmountUsd: input.feeAmountUsd,
                startDate: start.toISOString(),
                maturityDate: maturity.toISOString(),
                status: "active",
                history: [snapshot, ...f.history],
              }
            : f,
        ),
        payments,
        certificates: prev.certificates.map((c) =>
          c.financingId === financing.id ? { ...c, maturityDate: maturity.toISOString() } : c,
        ),
        activities: [
          newActivity({
            entityType: "financing",
            entityId: financing.id,
            customerId: financing.customerId,
            title: "Financing renewed",
            detail: `New tenure ${input.tenureMonths} months. Prior terms archived.`,
          }),
          ...prev.activities,
        ],
      }
    })
  }, [commit])

  const redeemGold = useCallback((financingId: string) => {
    commit((prev) => {
      const financing = prev.financings.find((f) => f.id === financingId)
      if (!financing) return prev
      return {
        ...prev,
        financings: prev.financings.map((f) =>
          f.id === financingId ? { ...f, status: "closed", outstandingUsd: 0 } : f,
        ),
        payments: prev.payments.map((p) =>
          p.financingId === financingId
            ? { ...p, paidAmountUsd: p.amountUsd, status: "paid", paidAt: p.paidAt ?? new Date().toISOString() }
            : p,
        ),
        certificates: prev.certificates.map((c) =>
          c.financingId === financingId ? { ...c, status: "redeemed", outstandingUsd: 0, eligibility: "SUSPENDED" } : c,
        ),
        listings: prev.listings.map((l) => {
          const cert = prev.certificates.find((c) => c.id === l.certificateId)
          return cert?.financingId === financingId && l.status !== "settled"
            ? { ...l, status: "withdrawn" }
            : l
        }),
        goldItems: prev.goldItems.map((g) =>
          g.id === financing.goldId
            ? {
                ...g,
                status: "released",
                custodyStatus: "released",
                vaultId: null,
                lockerId: null,
                movements: [
                  {
                    id: uid("mv"),
                    at: new Date().toISOString(),
                    from: g.vaultId ? `${g.vaultId} / ${g.lockerId}` : "Vault",
                    to: "Customer release desk",
                    reason: "Obligations completed — physical gold released",
                    actor: "Shop Operator",
                  },
                  ...g.movements,
                ],
              }
            : g,
        ),
        activities: [
          newActivity({
            entityType: "financing",
            entityId: financingId,
            customerId: financing.customerId,
            title: "Gold redeemed",
            detail: `${financing.goldId} released. Financing closed. Certificate redeemed.`,
          }),
          ...prev.activities,
        ],
      }
    })
  }, [commit])

  const startRecovery = useCallback((financingId: string) => {
    commit((prev) => ({
      ...prev,
      financings: prev.financings.map((f) =>
        f.id === financingId ? { ...f, status: "recovery", recoveryStage: "delinquent" } : f,
      ),
      certificates: prev.certificates.map((c) =>
        c.financingId === financingId
          ? { ...c, status: "suspended", eligibility: "SUSPENDED" }
          : c,
      ),
      activities: [
        newActivity({
          entityType: "financing",
          entityId: financingId,
          title: "Recovery opened",
          detail: "Account entered delinquency workflow. Auction/legal steps are operator-led and not automated.",
        }),
        ...prev.activities,
      ],
    }))
  }, [commit])

  const updateRecovery = useCallback((financingId: string, stage: RecoveryStage, note: string) => {
    commit((prev) => ({
      ...prev,
      financings: prev.financings.map((f) => (f.id === financingId ? { ...f, recoveryStage: stage } : f)),
      activities: [
        newActivity({
          entityType: "financing",
          entityId: financingId,
          title: "Recovery updated",
          detail: `${stage.replace("_", " ")} — ${note}`,
        }),
        ...prev.activities,
      ],
    }))
  }, [commit])

  const listCertificate = useCallback((input: ListCertificateInput): StoreResult<MarketplaceListing> => {
    const cert = state.certificates.find((c) => c.id === input.certificateId)
    const blocking = canCreateAuction(cert, state.auctions)
    if (cert && blocking.error?.includes("auction")) {
      return { ok: false, error: blocking.error }
    }
    const listing: MarketplaceListing = {
      id: nextListingId(state.listings.map((l) => l.id)),
      certificateId: input.certificateId,
      sellerName: cert?.ownershipName ?? "Holder",
      askingPriceUsd: input.askingPriceUsd,
      status: cert?.eligibility === "TRADING_ELIGIBLE" ? "listed" : "pending_review",
      listedAt: new Date().toISOString(),
    }
    commit((prev) => ({
      ...prev,
      listings: [listing, ...prev.listings],
      activities: [
        newActivity({
          entityType: "marketplace",
          entityId: listing.id,
          customerId: cert?.customerId,
          title: "Sell request submitted",
          detail: `${cert?.id} listed at ${input.askingPriceUsd} USD (${listing.status}). Mock marketplace only.`,
        }),
        ...prev.activities,
      ],
    }))
    return { ok: true, data: listing }
  }, [commit, state.certificates, state.listings, state.auctions])

  const requestTransfer = useCallback((listingId: string, buyerName: string) => {
    commit((prev) => ({
      ...prev,
      listings: prev.listings.map((l) =>
        l.id === listingId ? { ...l, status: "reserved", buyerName } : l,
      ),
      activities: [
        newActivity({
          entityType: "marketplace",
          entityId: listingId,
          title: "Transfer requested",
          detail: `${buyerName} requested buy/transfer. Awaiting mock settlement.`,
        }),
        ...prev.activities,
      ],
    }))
  }, [commit])

  const settleTransfer = useCallback((listingId: string) => {
    commit((prev) => {
      const listing = prev.listings.find((l) => l.id === listingId)
      if (!listing || !listing.buyerName) return prev
      const now = new Date().toISOString()
      return {
        ...prev,
        listings: prev.listings.map((l) =>
          l.id === listingId ? { ...l, status: "settled", settledAt: now } : l,
        ),
        certificates: prev.certificates.map((c) => {
          if (c.id !== listing.certificateId) return c
          const history = c.ownershipHistory.map((h, idx) =>
            idx === 0 && h.to === null ? { ...h, to: now } : h,
          )
          return {
            ...c,
            ownershipName: listing.buyerName!,
            ownershipHistory: [
              {
                id: uid("own"),
                ownerName: listing.buyerName!,
                ownerType: "investor",
                from: now,
                to: null,
                event: "Transferred via mock marketplace settlement",
              },
              ...history,
            ],
          }
        }),
        activities: [
          newActivity({
            entityType: "marketplace",
            entityId: listingId,
            title: "Settlement completed",
            detail: `Ownership moved to ${listing.buyerName}. Mock settlement — no payment rail.`,
          }),
          ...prev.activities,
        ],
      }
    })
  }, [commit])

  const withdrawListing = useCallback((listingId: string) => {
    commit((prev) => ({
      ...prev,
      listings: prev.listings.map((l) => (l.id === listingId ? { ...l, status: "withdrawn" } : l)),
    }))
  }, [commit])

  const setSessionBidder = useCallback((name: string) => {
    commit((prev) => ({ ...prev, sessionBidder: name }))
  }, [commit])

  const createAuction = useCallback((input: CreateAuctionInput): StoreResult<Auction> => {
    const cert = state.certificates.find((c) => c.id === input.certificateId)
    const gate = canCreateAuction(cert, state.auctions)
    if (!gate.ok || !cert) return { ok: false, error: gate.error ?? "Cannot create auction." }
    if (!input.startingPriceUsd || input.startingPriceUsd <= 0) {
      return { ok: false, error: "Starting price must be greater than zero." }
    }
    if (input.reservePriceUsd != null && input.reservePriceUsd < input.startingPriceUsd) {
      return { ok: false, error: "Reserve price cannot be below the starting price." }
    }
    if (!input.durationHours || input.durationHours < 1) {
      return { ok: false, error: "Auction duration must be at least 1 hour." }
    }
    const startsAt = new Date()
    const auction: Auction = {
      id: nextAuctionId(state.auctions.map((a) => a.id)),
      certificateId: cert.id,
      sellerName: cert.ownershipName,
      sellerCustomerId: cert.customerId,
      startingPriceUsd: input.startingPriceUsd,
      reservePriceUsd: input.reservePriceUsd,
      durationHours: input.durationHours,
      startsAt: startsAt.toISOString(),
      endsAt: addHours(startsAt, input.durationHours).toISOString(),
      status: "live",
      createdAt: startsAt.toISOString(),
    }
    commit((prev) => ({
      ...prev,
      auctions: [auction, ...prev.auctions],
      listings: prev.listings.map((l) =>
        l.certificateId === cert.id && (l.status === "listed" || l.status === "pending_review" || l.status === "reserved")
          ? { ...l, status: "withdrawn" as const }
          : l,
      ),
      activities: [
        newActivity({
          entityType: "auction",
          entityId: auction.id,
          customerId: cert.customerId,
          title: "Auction created",
          detail: `${cert.id} opened at $${input.startingPriceUsd.toLocaleString()} for ${input.durationHours}h.`,
        }),
        ...prev.activities,
      ],
    }))
    return { ok: true, data: auction }
  }, [commit, state.auctions, state.certificates])

  const placeBid = useCallback((input: PlaceBidInput): StoreResult => {
    const auction = state.auctions.find((a) => a.id === input.auctionId)
    if (!auction) return { ok: false, error: "Auction not found." }
    const approvedNames = state.approvedBidders.filter((b) => b.approved).map((b) => b.name)
    const check = validateBid({
      auction,
      bids: state.bids,
      bidderName: input.bidderName,
      amountUsd: input.amountUsd,
      approvedNames,
    })
    if (!check.ok) return check
    const bidder = state.approvedBidders.find((b) => namesMatch(b.name, input.bidderName))
    const bid = {
      id: nextBidId(state.bids.map((b) => b.id)),
      auctionId: auction.id,
      bidderName: input.bidderName.trim(),
      bidderType: bidder?.type ?? "investor",
      amountUsd: input.amountUsd,
      at: new Date().toISOString(),
      status: "winning" as const,
    }
    commit((prev) => ({
      ...prev,
      bids: [
        bid,
        ...prev.bids.map((b) =>
          b.auctionId === auction.id && b.status !== "invalid" ? { ...b, status: "outbid" as const } : b,
        ),
      ],
      activities: [
        newActivity({
          entityType: "auction",
          entityId: auction.id,
          title: "Bid placed",
          detail: `${bid.bidderName} bid $${bid.amountUsd.toLocaleString()} on ${auction.id}.`,
        }),
        ...prev.activities,
      ],
    }))
    return { ok: true }
  }, [commit, state.auctions, state.approvedBidders, state.bids])

  const closeAuctionNow = useCallback((auctionId: string): StoreResult => {
    const auction = state.auctions.find((a) => a.id === auctionId)
    if (!auction) return { ok: false, error: "Auction not found." }
    if (!isAuctionOpen(auction) && auction.status !== "live") {
      return { ok: false, error: "Auction is not live." }
    }
    commit((prev) => ({
      ...prev,
      auctions: prev.auctions.map((a) =>
        a.id === auctionId ? { ...a, endsAt: new Date().toISOString() } : a,
      ),
      activities: [
        newActivity({
          entityType: "auction",
          entityId: auctionId,
          title: "Auction closed",
          detail: "Operator ended the auction. Highest valid bid is evaluated against the reserve.",
        }),
        ...prev.activities,
      ],
    }))
    return { ok: true }
  }, [commit, state.auctions])

  const settleAuction = useCallback((auctionId: string): StoreResult => {
    const auction = state.auctions.find((a) => a.id === auctionId)
    if (!auction) return { ok: false, error: "Auction not found." }
    if (auction.status !== "ended" || !auction.winnerName || !auction.winningBidUsd) {
      return { ok: false, error: "Settlement requires a winning bid that met the reserve." }
    }
    const now = new Date().toISOString()
    commit((prev) => ({
      ...prev,
      auctions: prev.auctions.map((a) =>
        a.id === auctionId ? { ...a, status: "settled", settledAt: now } : a,
      ),
      certificates: prev.certificates.map((c) => {
        if (c.id !== auction.certificateId) return c
        const history = c.ownershipHistory.map((h) => (h.to === null ? { ...h, to: now } : h))
        return {
          ...c,
          ownershipName: auction.winnerName!,
          ownershipHistory: [
            {
              id: uid("own"),
              ownerName: auction.winnerName!,
              ownerType: "investor",
              from: now,
              to: null,
              event: `Transferred via auction ${auction.id} at $${auction.winningBidUsd!.toLocaleString()}`,
            },
            ...history,
          ],
        }
      }),
      activities: [
        newActivity({
          entityType: "auction",
          entityId: auctionId,
          title: "Auction settled",
          detail: `Ownership of ${auction.certificateId} moved to ${auction.winnerName}. Mock settlement only.`,
        }),
        ...prev.activities,
      ],
    }))
    return { ok: true }
  }, [commit, state.auctions])

  const withdrawAuction = useCallback((auctionId: string): StoreResult => {
    const auction = state.auctions.find((a) => a.id === auctionId)
    if (!auction) return { ok: false, error: "Auction not found." }
    const hasBids = state.bids.some((b) => b.auctionId === auctionId && b.status !== "invalid")
    if (hasBids) return { ok: false, error: "Cannot withdraw an auction after bids have been placed." }
    if (auction.status !== "live" && auction.status !== "scheduled") {
      return { ok: false, error: "Only open auctions can be withdrawn." }
    }
    commit((prev) => ({
      ...prev,
      auctions: prev.auctions.map((a) => (a.id === auctionId ? { ...a, status: "withdrawn" } : a)),
    }))
    return { ok: true }
  }, [commit, state.auctions, state.bids])

  const updateReview = useCallback((reviewId: string, status: ReviewStatus, notes: string) => {
    commit((prev) => {
      const review = prev.reviews.find((r) => r.id === reviewId)
      let next = {
        ...prev,
        reviews: prev.reviews.map((r) =>
          r.id === reviewId ? { ...r, status, notes, updatedAt: new Date().toISOString() } : r,
        ),
        activities: [
          newActivity({
            entityType: "compliance",
            entityId: reviewId,
            title: "Review updated",
            detail: `${review?.subjectLabel ?? reviewId}: ${status}. ${notes}`,
          }),
          ...prev.activities,
        ],
      }
      if (review?.type === "shariah" && status === "approved") {
        next = {
          ...next,
          financings: next.financings.map((f) =>
            f.id === review.subjectId ? { ...f, shariahReviewStatus: "approved" } : f,
          ),
          certificates: next.certificates.map((c) => {
            if (c.financingId !== review.subjectId) return c
            const checks = { ...c.eligibilityChecks, shariahReviewApproved: true }
            return { ...c, eligibilityChecks: checks, eligibility: deriveEligibility(checks, c.status === "suspended") }
          }),
        }
      }
      if (review?.type === "kyc" && (status === "approved" || status === "rejected")) {
        next = {
          ...next,
          customers: next.customers.map((c) =>
            c.id === review.subjectId
              ? { ...c, kycStatus: status === "approved" ? "verified" : "rejected" }
              : c,
          ),
        }
      }
      return next
    })
  }, [commit])

  const addReview = useCallback((review: Omit<ComplianceReview, "id" | "updatedAt">) => {
    commit((prev) => ({
      ...prev,
      reviews: [
        { ...review, id: uid("rev"), updatedAt: new Date().toISOString() },
        ...prev.reviews,
      ],
    }))
  }, [commit])

  const updateCertificateChecks = useCallback(
    (certificateId: string, patch: Partial<Certificate["eligibilityChecks"]>) => {
      commit((prev) => ({
        ...prev,
        certificates: prev.certificates.map((c) => {
          if (c.id !== certificateId) return c
          const checks = { ...c.eligibilityChecks, ...patch }
          return {
            ...c,
            eligibilityChecks: checks,
            eligibility: deriveEligibility(checks, c.status === "suspended" || c.status === "redeemed"),
          }
        }),
      }))
    },
    [commit],
  )

  const value = useMemo<AppStoreValue>(
    () => ({
      state,
      resetToSeed,
      updateSettings,
      createCustomer,
      updateKyc,
      intakeGold,
      verifyGold,
      moveGold,
      createFinancing,
      recordPayment,
      renewFinancing,
      redeemGold,
      startRecovery,
      updateRecovery,
      listCertificate,
      requestTransfer,
      settleTransfer,
      withdrawListing,
      createAuction,
      placeBid,
      closeAuctionNow,
      settleAuction,
      withdrawAuction,
      setSessionBidder,
      updateReview,
      addReview,
      updateCertificateChecks,
    }),
    [
      state,
      resetToSeed,
      updateSettings,
      createCustomer,
      updateKyc,
      intakeGold,
      verifyGold,
      moveGold,
      createFinancing,
      recordPayment,
      renewFinancing,
      redeemGold,
      startRecovery,
      updateRecovery,
      listCertificate,
      requestTransfer,
      settleTransfer,
      withdrawListing,
      createAuction,
      placeBid,
      closeAuctionNow,
      settleAuction,
      withdrawAuction,
      setSessionBidder,
      updateReview,
      addReview,
      updateCertificateChecks,
    ],
  )

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext)
  if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider")
  return ctx
}

export function useAppState() {
  return useAppStore().state
}
