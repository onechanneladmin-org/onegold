import { addMonths, addDays } from "date-fns"
import { assessGoldValue, finenessFromKarat, feeForStructure, buildPaymentSchedule } from "@/lib/calculations"
import { deriveEligibility } from "@/lib/eligibility"
import { initials } from "@/lib/ids"
import type {
  AppState,
  Certificate,
  Customer,
  CustomerDocument,
  Financing,
  GoldItem,
  MarketplaceListing,
  PaymentInstallment,
  Settings,
  Vault,
} from "@/types"

const REF_PRICE = 92.4
const DEFAULT_LTV = 70

const settings: Settings = {
  shopName: "OneGold Atelier",
  shopLocation: "Downtown",
  goldReferenceUsdPerGram: REF_PRICE,
  defaultLtvPercent: DEFAULT_LTV,
  structures: [
    {
      id: "ar_rahnu",
      name: "Ar-Rahnu",
      description: "Gold pledged as collateral with a safekeeping fee (ujrah). Principal is due at maturity.",
      defaultFeePercent: 8,
      feeLabel: "Safekeeping fee (ujrah)",
    },
    {
      id: "ujrah",
      name: "Ujrah fee",
      description: "Service-fee structure for custody and administration. Not conventional interest.",
      defaultFeePercent: 7.5,
      feeLabel: "Service fee (ujrah)",
    },
    {
      id: "agreed_profit",
      name: "Agreed profit",
      description: "Pre-agreed profit amount amortized across the tenure. Requires Shariah/legal review.",
      defaultFeePercent: 9,
      feeLabel: "Agreed profit",
    },
  ],
}

const vaults: Vault[] = [
  {
    id: "VLT-A",
    name: "Vault A — Main Strongroom",
    location: "Basement 2, Downtown Atelier",
    lockers: Array.from({ length: 12 }, (_, i) => ({
      id: `A-${String(i + 1).padStart(2, "0")}`,
      label: `Locker A-${String(i + 1).padStart(2, "0")}`,
      row: i < 6 ? "Row 1" : "Row 2",
      capacity: 2,
    })),
  },
  {
    id: "VLT-B",
    name: "Vault B — High Security",
    location: "Basement 2, Restricted Wing",
    lockers: Array.from({ length: 8 }, (_, i) => ({
      id: `B-${String(i + 1).padStart(2, "0")}`,
      label: `Locker B-${String(i + 1).padStart(2, "0")}`,
      row: i < 4 ? "Row 1" : "Row 2",
      capacity: 1,
    })),
  },
  {
    id: "VLT-C",
    name: "Vault C — Intake Cage",
    location: "Ground floor, Receiving",
    lockers: Array.from({ length: 4 }, (_, i) => ({
      id: `C-${String(i + 1).padStart(2, "0")}`,
      label: `Cage C-${String(i + 1).padStart(2, "0")}`,
      row: "Intake",
      capacity: 4,
    })),
  },
]

function customer(partial: Omit<Customer, "avatarInitials">): Customer {
  return { ...partial, avatarInitials: initials(partial.name) }
}

const customers: Customer[] = [
  customer({
    id: "CUS-2026-0001",
    name: "Aisha Rahman",
    identityType: "Passport",
    identityNumber: "A50218493",
    email: "aisha.rahman@example.com",
    phone: "+60 12 445 8890",
    address: "18 Jalan Bukit Bintang",
    city: "Kuala Lumpur",
    country: "Malaysia",
    countryCode: "MY",
    kycStatus: "verified",
    riskRating: "low",
    notes: "Long-standing client. Prefers Ar-Rahnu structures.",
    createdAt: "2025-11-02T09:10:00.000Z",
  }),
  customer({
    id: "CUS-2026-0002",
    name: "Omar Al-Farsi",
    identityType: "Emirates ID",
    identityNumber: "784-1988-1234567-1",
    email: "omar.alfarsi@example.com",
    phone: "+971 50 221 4490",
    address: "Marina Gate 2",
    city: "Dubai",
    country: "United Arab Emirates",
    countryCode: "AE",
    kycStatus: "verified",
    riskRating: "low",
    notes: "Family office treasury. Holds multiple bars.",
    createdAt: "2025-12-14T11:20:00.000Z",
  }),
  customer({
    id: "CUS-2026-0003",
    name: "Wei Ling Tan",
    identityType: "NRIC",
    identityNumber: "S8722143C",
    email: "weiling.tan@example.com",
    phone: "+65 8123 4401",
    address: "88 Orchard Road",
    city: "Singapore",
    country: "Singapore",
    countryCode: "SG",
    kycStatus: "verified",
    riskRating: "medium",
    notes: "Jewelry collection pledged seasonally.",
    createdAt: "2026-01-08T04:30:00.000Z",
  }),
  customer({
    id: "CUS-2026-0004",
    name: "James Whitmore",
    identityType: "Passport",
    identityNumber: "UK55910221",
    email: "james.whitmore@example.com",
    phone: "+44 7700 900221",
    address: "14 Mayfair Place",
    city: "London",
    country: "United Kingdom",
    countryCode: "GB",
    kycStatus: "in_review",
    riskRating: "medium",
    notes: "Source-of-wealth documents pending second review.",
    createdAt: "2026-08-21T10:00:00.000Z",
  }),
  customer({
    id: "CUS-2026-0005",
    name: "Fatima Al-Sayed",
    identityType: "Emirates ID",
    identityNumber: "784-1992-9988776-3",
    email: "fatima.alsayed@example.com",
    phone: "+971 55 104 2288",
    address: "Al Bateen Residences",
    city: "Abu Dhabi",
    country: "United Arab Emirates",
    countryCode: "AE",
    kycStatus: "verified",
    riskRating: "low",
    notes: "Requested hold-to-maturity certificates only.",
    createdAt: "2026-02-03T08:15:00.000Z",
  }),
  customer({
    id: "CUS-2026-0006",
    name: "Priya Menon",
    identityType: "Passport",
    identityNumber: "Z3299102",
    email: "priya.menon@example.com",
    phone: "+91 98200 11440",
    address: "12 Pedder Road",
    city: "Mumbai",
    country: "India",
    countryCode: "IN",
    kycStatus: "verified",
    riskRating: "medium",
    notes: "Wedding jewelry set. Photos on file.",
    createdAt: "2026-03-12T06:40:00.000Z",
  }),
  customer({
    id: "CUS-2026-0007",
    name: "Hasan Abdullah",
    identityType: "KTP",
    identityNumber: "3174091805880002",
    email: "hasan.abdullah@example.com",
    phone: "+62 812 3300 4412",
    address: "Jl. Sudirman Kav. 52",
    city: "Jakarta",
    country: "Indonesia",
    countryCode: "ID",
    kycStatus: "verified",
    riskRating: "low",
    notes: "Prefers quarterly ujrah schedule.",
    createdAt: "2026-04-01T03:00:00.000Z",
  }),
  customer({
    id: "CUS-2026-0008",
    name: "Sofia Martinez",
    identityType: "Passport",
    identityNumber: "PAD449102",
    email: "sofia.martinez@example.com",
    phone: "+34 612 440 118",
    address: "Calle Serrano 44",
    city: "Madrid",
    country: "Spain",
    countryCode: "ES",
    kycStatus: "pending",
    riskRating: "medium",
    notes: "New walk-in. KYC pack started.",
    createdAt: "2026-09-08T14:20:00.000Z",
  }),
  customer({
    id: "CUS-2026-0009",
    name: "David Chen",
    identityType: "Passport",
    identityNumber: "US44821990",
    email: "david.chen@example.com",
    phone: "+1 212 555 0148",
    address: "210 Madison Avenue",
    city: "New York",
    country: "United States",
    countryCode: "US",
    kycStatus: "verified",
    riskRating: "high",
    notes: "Account in recovery. Missed three collections.",
    createdAt: "2025-09-18T15:00:00.000Z",
  }),
  customer({
    id: "CUS-2026-0010",
    name: "Nurul Izzah",
    identityType: "MyKad",
    identityNumber: "900214-01-5482",
    email: "nurul.izzah@example.com",
    phone: "+60 16 772 3301",
    address: "No. 7 Jalan Tebrau",
    city: "Johor Bahru",
    country: "Malaysia",
    countryCode: "MY",
    kycStatus: "verified",
    riskRating: "low",
    notes: "Redeemed a prior facility in 2025.",
    createdAt: "2025-06-11T02:10:00.000Z",
  }),
  customer({
    id: "CUS-2026-0011",
    name: "Khalid Hassan",
    identityType: "National ID",
    identityNumber: "1099442281",
    email: "khalid.hassan@example.com",
    phone: "+966 55 880 2214",
    address: "Olaya Street, Al Olaya",
    city: "Riyadh",
    country: "Saudi Arabia",
    countryCode: "SA",
    kycStatus: "verified",
    riskRating: "medium",
    notes: "Interested in certificate transfer after settlement.",
    createdAt: "2026-05-19T09:45:00.000Z",
  }),
  customer({
    id: "CUS-2026-0012",
    name: "Amara Okafor",
    identityType: "Passport",
    identityNumber: "A00991822",
    email: "amara.okafor@example.com",
    phone: "+234 803 441 2290",
    address: "12 Banana Island Road",
    city: "Lagos",
    country: "Nigeria",
    countryCode: "NG",
    kycStatus: "in_review",
    riskRating: "medium",
    notes: "Gold intake complete. Financing pending KYC clearance.",
    createdAt: "2026-09-02T13:00:00.000Z",
  }),
]

const documents: CustomerDocument[] = [
  { id: "DOC-001", customerId: "CUS-2026-0001", name: "Passport bio page", type: "Identity", uploadedAt: "2025-11-02T09:20:00.000Z", status: "approved" },
  { id: "DOC-002", customerId: "CUS-2026-0001", name: "Proof of address", type: "Address", uploadedAt: "2025-11-02T09:22:00.000Z", status: "approved" },
  { id: "DOC-003", customerId: "CUS-2026-0002", name: "Emirates ID", type: "Identity", uploadedAt: "2025-12-14T11:25:00.000Z", status: "approved" },
  { id: "DOC-004", customerId: "CUS-2026-0004", name: "Source of wealth letter", type: "SOW", uploadedAt: "2026-08-22T10:10:00.000Z", status: "needs_info" },
  { id: "DOC-005", customerId: "CUS-2026-0008", name: "Passport scan", type: "Identity", uploadedAt: "2026-09-08T14:25:00.000Z", status: "pending" },
  { id: "DOC-006", customerId: "CUS-2026-0009", name: "Passport bio page", type: "Identity", uploadedAt: "2025-09-18T15:10:00.000Z", status: "approved" },
  { id: "DOC-007", customerId: "CUS-2026-0012", name: "Utility bill", type: "Address", uploadedAt: "2026-09-02T13:10:00.000Z", status: "pending" },
]

function gold(partial: Omit<GoldItem, "fineness" | "assessedValueUsd" | "photos"> & { photos?: string[] }): GoldItem {
  const fineness = finenessFromKarat(partial.karat)
  const assessedValueUsd = assessGoldValue(partial.netWeightGrams, partial.karat, partial.goldRateUsdPerGram)
  return {
    ...partial,
    fineness,
    assessedValueUsd,
    photos: partial.photos ?? ["https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800&q=80"],
  }
}

const goldItems: GoldItem[] = [
  gold({
    id: "GLD-2026-0001",
    customerId: "CUS-2026-0001",
    itemType: "jewelry",
    description: "22K bridal necklace with matching pair of bangles",
    grossWeightGrams: 186.4,
    netWeightGrams: 178.2,
    karat: 22,
    goldRateUsdPerGram: REF_PRICE,
    assayLab: "OneGold Assay Desk",
    assayRef: "ASY-4412",
    assayDate: "2026-03-04T08:00:00.000Z",
    verified: true,
    status: "in_custody",
    vaultId: "VLT-A",
    lockerId: "A-01",
    packetId: "PKT-2026-0001",
    sealId: "SEL-2026-0001",
    custodyStatus: "secured",
    depositDate: "2026-03-04T10:00:00.000Z",
    movements: [
      { id: "mv-1", at: "2026-03-04T08:10:00.000Z", from: "Receiving counter", to: "Vault C / C-01", reason: "Intake", actor: "Shop Operator" },
      { id: "mv-2", at: "2026-03-04T10:00:00.000Z", from: "Vault C / C-01", to: "Vault A / A-01", reason: "Financing approved — secured custody", actor: "Vault Officer" },
    ],
    createdAt: "2026-03-04T08:00:00.000Z",
  }),
  gold({
    id: "GLD-2026-0002",
    customerId: "CUS-2026-0002",
    itemType: "bar",
    description: "1kg LBMA-style cast bar, serial B-8821",
    grossWeightGrams: 1000,
    netWeightGrams: 999.9,
    karat: 24,
    goldRateUsdPerGram: REF_PRICE,
    assayLab: "Emirates Assay Partner",
    assayRef: "ASY-5501",
    assayDate: "2026-01-16T07:00:00.000Z",
    verified: true,
    status: "in_custody",
    vaultId: "VLT-B",
    lockerId: "B-01",
    packetId: "PKT-2026-0002",
    sealId: "SEL-2026-0002",
    custodyStatus: "secured",
    depositDate: "2026-01-16T09:30:00.000Z",
    movements: [
      { id: "mv-3", at: "2026-01-16T09:30:00.000Z", from: "Receiving", to: "Vault B / B-01", reason: "High-value bar secured", actor: "Vault Officer" },
    ],
    createdAt: "2026-01-16T07:00:00.000Z",
  }),
  gold({
    id: "GLD-2026-0003",
    customerId: "CUS-2026-0003",
    itemType: "jewelry",
    description: "18K diamond-set bracelet (gold weight only)",
    grossWeightGrams: 64.2,
    netWeightGrams: 51.8,
    karat: 18,
    goldRateUsdPerGram: REF_PRICE,
    assayLab: "OneGold Assay Desk",
    assayRef: "ASY-6104",
    assayDate: "2026-06-02T05:00:00.000Z",
    verified: true,
    status: "in_custody",
    vaultId: "VLT-A",
    lockerId: "A-03",
    packetId: "PKT-2026-0003",
    sealId: "SEL-2026-0003",
    custodyStatus: "secured",
    depositDate: "2026-06-02T07:20:00.000Z",
    movements: [
      { id: "mv-4", at: "2026-06-02T07:20:00.000Z", from: "Receiving", to: "Vault A / A-03", reason: "Secured after financing", actor: "Vault Officer" },
    ],
    createdAt: "2026-06-02T05:00:00.000Z",
  }),
  gold({
    id: "GLD-2026-0004",
    customerId: "CUS-2026-0005",
    itemType: "coin",
    description: "Set of 20 x 1oz fine gold coins",
    grossWeightGrams: 622.07,
    netWeightGrams: 622.07,
    karat: 24,
    goldRateUsdPerGram: REF_PRICE,
    assayLab: "Abu Dhabi Assay Desk",
    assayRef: "ASY-7002",
    assayDate: "2026-02-11T08:00:00.000Z",
    verified: true,
    status: "in_custody",
    vaultId: "VLT-B",
    lockerId: "B-03",
    packetId: "PKT-2026-0004",
    sealId: "SEL-2026-0004",
    custodyStatus: "secured",
    depositDate: "2026-02-11T10:00:00.000Z",
    movements: [
      { id: "mv-5", at: "2026-02-11T10:00:00.000Z", from: "Receiving", to: "Vault B / B-03", reason: "Coin set sealed", actor: "Vault Officer" },
    ],
    createdAt: "2026-02-11T08:00:00.000Z",
  }),
  gold({
    id: "GLD-2026-0005",
    customerId: "CUS-2026-0006",
    itemType: "ornament",
    description: "Temple jewelry set — necklace, waist belt, earrings",
    grossWeightGrams: 412.5,
    netWeightGrams: 388.0,
    karat: 22,
    goldRateUsdPerGram: REF_PRICE,
    assayLab: "Mumbai Partner Lab",
    assayRef: "ASY-7710",
    assayDate: "2026-03-14T06:00:00.000Z",
    verified: true,
    status: "in_custody",
    vaultId: "VLT-A",
    lockerId: "A-05",
    packetId: "PKT-2026-0005",
    sealId: "SEL-2026-0005",
    custodyStatus: "secured",
    depositDate: "2026-03-14T08:40:00.000Z",
    movements: [
      { id: "mv-6", at: "2026-03-14T08:40:00.000Z", from: "Receiving", to: "Vault A / A-05", reason: "Secured custody", actor: "Vault Officer" },
    ],
    createdAt: "2026-03-14T06:00:00.000Z",
  }),
  gold({
    id: "GLD-2026-0006",
    customerId: "CUS-2026-0007",
    itemType: "biscuit",
    description: "10 x 10g minted biscuits",
    grossWeightGrams: 100.2,
    netWeightGrams: 100.0,
    karat: 24,
    goldRateUsdPerGram: REF_PRICE,
    assayLab: "OneGold Assay Desk",
    assayRef: "ASY-8011",
    assayDate: "2026-04-06T03:30:00.000Z",
    verified: true,
    status: "in_custody",
    vaultId: "VLT-A",
    lockerId: "A-07",
    packetId: "PKT-2026-0006",
    sealId: "SEL-2026-0006",
    custodyStatus: "secured",
    depositDate: "2026-04-06T05:00:00.000Z",
    movements: [
      { id: "mv-7", at: "2026-04-06T05:00:00.000Z", from: "Receiving", to: "Vault A / A-07", reason: "Secured custody", actor: "Vault Officer" },
    ],
    createdAt: "2026-04-06T03:30:00.000Z",
  }),
  gold({
    id: "GLD-2026-0007",
    customerId: "CUS-2026-0009",
    itemType: "bar",
    description: "500g cast bar, serial NY-1044",
    grossWeightGrams: 500.4,
    netWeightGrams: 500.0,
    karat: 24,
    goldRateUsdPerGram: 88.1,
    assayLab: "NY Assay Desk",
    assayRef: "ASY-2201",
    assayDate: "2025-10-02T14:00:00.000Z",
    verified: true,
    status: "in_custody",
    vaultId: "VLT-B",
    lockerId: "B-05",
    packetId: "PKT-2026-0007",
    sealId: "SEL-2026-0007",
    custodyStatus: "secured",
    depositDate: "2025-10-02T16:00:00.000Z",
    movements: [
      { id: "mv-8", at: "2025-10-02T16:00:00.000Z", from: "Receiving", to: "Vault B / B-05", reason: "Secured custody", actor: "Vault Officer" },
    ],
    createdAt: "2025-10-02T14:00:00.000Z",
  }),
  gold({
    id: "GLD-2026-0008",
    customerId: "CUS-2026-0010",
    itemType: "jewelry",
    description: "21K chain and pendant — released after redemption",
    grossWeightGrams: 42.1,
    netWeightGrams: 41.4,
    karat: 21,
    goldRateUsdPerGram: 86.2,
    assayLab: "OneGold Assay Desk",
    assayRef: "ASY-1102",
    assayDate: "2025-07-01T02:00:00.000Z",
    verified: true,
    status: "released",
    vaultId: null,
    lockerId: null,
    packetId: "PKT-2025-0088",
    sealId: "SEL-2025-0088",
    custodyStatus: "released",
    depositDate: "2025-07-01T04:00:00.000Z",
    movements: [
      { id: "mv-9", at: "2025-07-01T04:00:00.000Z", from: "Receiving", to: "Vault A / A-09", reason: "Secured custody", actor: "Vault Officer" },
      { id: "mv-10", at: "2026-01-12T04:30:00.000Z", from: "Vault A / A-09", to: "Customer release desk", reason: "Redeemed — physical release", actor: "Shop Operator" },
    ],
    createdAt: "2025-07-01T02:00:00.000Z",
  }),
  gold({
    id: "GLD-2026-0009",
    customerId: "CUS-2026-0011",
    itemType: "bar",
    description: "250g minted bar",
    grossWeightGrams: 250.1,
    netWeightGrams: 250.0,
    karat: 24,
    goldRateUsdPerGram: REF_PRICE,
    assayLab: "Riyadh Partner Lab",
    assayRef: "ASY-9100",
    assayDate: "2026-05-20T08:00:00.000Z",
    verified: true,
    status: "in_custody",
    vaultId: "VLT-A",
    lockerId: "A-02",
    packetId: "PKT-2026-0009",
    sealId: "SEL-2026-0009",
    custodyStatus: "secured",
    depositDate: "2026-05-20T10:20:00.000Z",
    movements: [
      { id: "mv-11", at: "2026-05-20T10:20:00.000Z", from: "Receiving", to: "Vault A / A-02", reason: "Secured custody", actor: "Vault Officer" },
    ],
    createdAt: "2026-05-20T08:00:00.000Z",
  }),
  gold({
    id: "GLD-2026-0010",
    customerId: "CUS-2026-0012",
    itemType: "jewelry",
    description: "18K chain — pending financing",
    grossWeightGrams: 38.6,
    netWeightGrams: 36.9,
    karat: 18,
    goldRateUsdPerGram: REF_PRICE,
    assayLab: "OneGold Assay Desk",
    assayRef: "ASY-9901",
    assayDate: "2026-09-02T13:20:00.000Z",
    verified: true,
    status: "verified",
    vaultId: "VLT-C",
    lockerId: "C-02",
    packetId: "PKT-2026-0010",
    sealId: "SEL-2026-0010",
    custodyStatus: "pending_deposit",
    depositDate: null,
    movements: [
      { id: "mv-12", at: "2026-09-02T13:30:00.000Z", from: "Counter", to: "Vault C / C-02", reason: "Held pending KYC and financing", actor: "Shop Operator" },
    ],
    createdAt: "2026-09-02T13:20:00.000Z",
  }),
  gold({
    id: "GLD-2026-0011",
    customerId: "CUS-2026-0002",
    itemType: "coin",
    description: "5 x 1oz bullion coins — second pledge",
    grossWeightGrams: 155.52,
    netWeightGrams: 155.52,
    karat: 24,
    goldRateUsdPerGram: REF_PRICE,
    assayLab: "Emirates Assay Partner",
    assayRef: "ASY-5518",
    assayDate: "2026-07-08T07:00:00.000Z",
    verified: true,
    status: "in_custody",
    vaultId: "VLT-B",
    lockerId: "B-02",
    packetId: "PKT-2026-0011",
    sealId: "SEL-2026-0011",
    custodyStatus: "secured",
    depositDate: "2026-07-08T09:00:00.000Z",
    movements: [
      { id: "mv-13", at: "2026-07-08T09:00:00.000Z", from: "Receiving", to: "Vault B / B-02", reason: "Secured custody", actor: "Vault Officer" },
    ],
    createdAt: "2026-07-08T07:00:00.000Z",
  }),
  gold({
    id: "GLD-2026-0012",
    customerId: "CUS-2026-0001",
    itemType: "biscuit",
    description: "4 x 20g wafers",
    grossWeightGrams: 80.1,
    netWeightGrams: 80.0,
    karat: 24,
    goldRateUsdPerGram: REF_PRICE,
    assayLab: "OneGold Assay Desk",
    assayRef: "ASY-4420",
    assayDate: "2026-08-01T03:00:00.000Z",
    verified: true,
    status: "in_custody",
    vaultId: "VLT-A",
    lockerId: "A-04",
    packetId: "PKT-2026-0012",
    sealId: "SEL-2026-0012",
    custodyStatus: "secured",
    depositDate: "2026-08-01T05:10:00.000Z",
    movements: [
      { id: "mv-14", at: "2026-08-01T05:10:00.000Z", from: "Receiving", to: "Vault A / A-04", reason: "Secured custody", actor: "Vault Officer" },
    ],
    createdAt: "2026-08-01T03:00:00.000Z",
  }),
  gold({
    id: "GLD-2026-0013",
    customerId: "CUS-2026-0004",
    itemType: "bar",
    description: "100g minted bar — intake only",
    grossWeightGrams: 100.05,
    netWeightGrams: 100.0,
    karat: 24,
    goldRateUsdPerGram: REF_PRICE,
    assayLab: "London Partner Lab",
    assayRef: "ASY-3309",
    assayDate: "2026-08-21T11:00:00.000Z",
    verified: false,
    status: "intake",
    vaultId: "VLT-C",
    lockerId: "C-01",
    packetId: "PKT-2026-0013",
    sealId: "SEL-2026-0013",
    custodyStatus: "pending_deposit",
    depositDate: null,
    movements: [
      { id: "mv-15", at: "2026-08-21T11:20:00.000Z", from: "Counter", to: "Vault C / C-01", reason: "Held pending assay confirmation", actor: "Shop Operator" },
    ],
    createdAt: "2026-08-21T11:00:00.000Z",
  }),
  gold({
    id: "GLD-2026-0014",
    customerId: "CUS-2026-0003",
    itemType: "jewelry",
    description: "22K earrings and ring pair",
    grossWeightGrams: 28.4,
    netWeightGrams: 27.1,
    karat: 22,
    goldRateUsdPerGram: REF_PRICE,
    assayLab: "OneGold Assay Desk",
    assayRef: "ASY-6119",
    assayDate: "2026-08-18T04:00:00.000Z",
    verified: true,
    status: "in_custody",
    vaultId: "VLT-A",
    lockerId: "A-08",
    packetId: "PKT-2026-0014",
    sealId: "SEL-2026-0014",
    custodyStatus: "secured",
    depositDate: "2026-08-18T06:00:00.000Z",
    movements: [
      { id: "mv-16", at: "2026-08-18T06:00:00.000Z", from: "Receiving", to: "Vault A / A-08", reason: "Secured custody", actor: "Vault Officer" },
    ],
    createdAt: "2026-08-18T04:00:00.000Z",
  }),
  gold({
    id: "GLD-2026-0015",
    customerId: "CUS-2026-0005",
    itemType: "jewelry",
    description: "21K traditional set — maturing facility",
    grossWeightGrams: 210.0,
    netWeightGrams: 198.6,
    karat: 21,
    goldRateUsdPerGram: REF_PRICE,
    assayLab: "Abu Dhabi Assay Desk",
    assayRef: "ASY-7099",
    assayDate: "2026-03-20T08:00:00.000Z",
    verified: true,
    status: "in_custody",
    vaultId: "VLT-A",
    lockerId: "A-06",
    packetId: "PKT-2026-0015",
    sealId: "SEL-2026-0015",
    custodyStatus: "secured",
    depositDate: "2026-03-20T10:00:00.000Z",
    movements: [
      { id: "mv-17", at: "2026-03-20T10:00:00.000Z", from: "Receiving", to: "Vault A / A-06", reason: "Secured custody", actor: "Vault Officer" },
    ],
    createdAt: "2026-03-20T08:00:00.000Z",
  }),
]

function financingFrom(opts: {
  id: string
  customerId: string
  goldId: string
  amountUsd: number
  structure: Financing["structure"]
  tenureMonths: number
  paymentFrequency: Financing["paymentFrequency"]
  startDate: string
  status: Financing["status"]
  shariah: Financing["shariahReviewStatus"]
  legal: Financing["legalReviewStatus"]
  recoveryStage?: Financing["recoveryStage"]
  history?: Financing["history"]
}): Financing {
  const goldItem = goldItems.find((g) => g.id === opts.goldId)!
  const template = settings.structures.find((s) => s.id === opts.structure)!
  const fee = feeForStructure(opts.amountUsd, opts.structure, opts.tenureMonths, template.defaultFeePercent)
  const start = new Date(opts.startDate)
  const maturity = addMonths(start, opts.tenureMonths)
  return {
    id: opts.id,
    customerId: opts.customerId,
    goldId: opts.goldId,
    amountUsd: opts.amountUsd,
    structure: opts.structure,
    feeLabel: fee.feeLabel,
    feeAmountUsd: fee.feeAmountUsd,
    tenureMonths: opts.tenureMonths,
    paymentFrequency: opts.paymentFrequency,
    startDate: start.toISOString(),
    maturityDate: maturity.toISOString(),
    outstandingUsd: 0,
    status: opts.status,
    shariahReviewStatus: opts.shariah,
    legalReviewStatus: opts.legal,
    ltvPercent: DEFAULT_LTV,
    maxFinancingUsd: assessGoldValue(goldItem.netWeightGrams, goldItem.karat, goldItem.goldRateUsdPerGram) * (DEFAULT_LTV / 100),
    history: opts.history ?? [],
    recoveryStage: opts.recoveryStage,
    createdAt: start.toISOString(),
  }
}

const financings: Financing[] = [
  financingFrom({ id: "FIN-2026-0001", customerId: "CUS-2026-0001", goldId: "GLD-2026-0001", amountUsd: 10500, structure: "ar_rahnu", tenureMonths: 12, paymentFrequency: "monthly", startDate: "2026-03-04", status: "active", shariah: "approved", legal: "approved" }),
  financingFrom({ id: "FIN-2026-0002", customerId: "CUS-2026-0002", goldId: "GLD-2026-0002", amountUsd: 62000, structure: "ujrah", tenureMonths: 18, paymentFrequency: "quarterly", startDate: "2026-01-16", status: "active", shariah: "approved", legal: "approved" }),
  financingFrom({ id: "FIN-2026-0003", customerId: "CUS-2026-0003", goldId: "GLD-2026-0003", amountUsd: 2400, structure: "ar_rahnu", tenureMonths: 6, paymentFrequency: "monthly", startDate: "2026-06-02", status: "active", shariah: "approved", legal: "approved" }),
  financingFrom({ id: "FIN-2026-0004", customerId: "CUS-2026-0005", goldId: "GLD-2026-0004", amountUsd: 38000, structure: "agreed_profit", tenureMonths: 12, paymentFrequency: "monthly", startDate: "2026-02-11", status: "active", shariah: "approved", legal: "approved" }),
  financingFrom({ id: "FIN-2026-0005", customerId: "CUS-2026-0006", goldId: "GLD-2026-0005", amountUsd: 22000, structure: "ar_rahnu", tenureMonths: 9, paymentFrequency: "monthly", startDate: "2026-03-14", status: "overdue", shariah: "approved", legal: "approved" }),
  financingFrom({ id: "FIN-2026-0006", customerId: "CUS-2026-0007", goldId: "GLD-2026-0006", amountUsd: 6200, structure: "ujrah", tenureMonths: 12, paymentFrequency: "quarterly", startDate: "2026-04-06", status: "active", shariah: "approved", legal: "pending" }),
  financingFrom({
    id: "FIN-2026-0007",
    customerId: "CUS-2026-0009",
    goldId: "GLD-2026-0007",
    amountUsd: 28000,
    structure: "ar_rahnu",
    tenureMonths: 12,
    paymentFrequency: "monthly",
    startDate: "2025-10-02",
    status: "recovery",
    shariah: "approved",
    legal: "approved",
    recoveryStage: "recovery",
  }),
  financingFrom({ id: "FIN-2026-0008", customerId: "CUS-2026-0010", goldId: "GLD-2026-0008", amountUsd: 2200, structure: "ar_rahnu", tenureMonths: 6, paymentFrequency: "monthly", startDate: "2025-07-01", status: "closed", shariah: "approved", legal: "approved" }),
  financingFrom({ id: "FIN-2026-0009", customerId: "CUS-2026-0011", goldId: "GLD-2026-0009", amountUsd: 15500, structure: "agreed_profit", tenureMonths: 6, paymentFrequency: "monthly", startDate: "2026-05-20", status: "active", shariah: "approved", legal: "approved" }),
  financingFrom({ id: "FIN-2026-0010", customerId: "CUS-2026-0002", goldId: "GLD-2026-0011", amountUsd: 9800, structure: "ar_rahnu", tenureMonths: 12, paymentFrequency: "monthly", startDate: "2026-07-08", status: "active", shariah: "approved", legal: "approved" }),
  financingFrom({ id: "FIN-2026-0011", customerId: "CUS-2026-0001", goldId: "GLD-2026-0012", amountUsd: 5000, structure: "ujrah", tenureMonths: 6, paymentFrequency: "monthly", startDate: "2026-08-01", status: "maturing", shariah: "approved", legal: "approved" }),
  financingFrom({ id: "FIN-2026-0012", customerId: "CUS-2026-0003", goldId: "GLD-2026-0014", amountUsd: 1600, structure: "ar_rahnu", tenureMonths: 3, paymentFrequency: "monthly", startDate: "2026-08-18", status: "maturing", shariah: "pending", legal: "pending" }),
  financingFrom({ id: "FIN-2026-0013", customerId: "CUS-2026-0005", goldId: "GLD-2026-0015", amountUsd: 11800, structure: "ar_rahnu", tenureMonths: 6, paymentFrequency: "monthly", startDate: "2026-03-20", status: "maturing", shariah: "approved", legal: "approved" }),
]

function seedPayments(): PaymentInstallment[] {
  let existing: string[] = []
  const all: PaymentInstallment[] = []
  for (const f of financings) {
    const built = buildPaymentSchedule({
      financingId: f.id,
      customerId: f.customerId,
      amountUsd: f.amountUsd,
      feeAmountUsd: f.feeAmountUsd,
      structure: f.structure,
      tenureMonths: f.tenureMonths,
      frequency: f.paymentFrequency,
      startDate: f.startDate,
      existingPaymentIds: existing,
    })
    existing = [...existing, ...built.map((p) => p.id)]
    all.push(...built)
  }

  const today = new Date("2026-09-11T12:00:00.000Z")
  return all.map((p) => {
    const due = new Date(p.dueDate)
    const f = financings.find((x) => x.id === p.financingId)!

    if (f.status === "closed") {
      return { ...p, paidAmountUsd: p.amountUsd, status: "paid" as const, paidAt: addDays(due, -1).toISOString(), method: "Bank transfer" }
    }

    if (f.id === "FIN-2026-0007") {
      if (due < new Date("2026-04-01")) {
        return { ...p, paidAmountUsd: p.amountUsd, status: "paid" as const, paidAt: due.toISOString(), method: "Card" }
      }
      return { ...p, paidAmountUsd: 0, status: "overdue" as const, paidAt: null }
    }

    if (f.id === "FIN-2026-0005" && due < today && due > new Date("2026-07-01")) {
      return { ...p, paidAmountUsd: 0, status: "overdue" as const, paidAt: null }
    }

    if (due < today) {
      const partial = f.id === "FIN-2026-0002" && p.id.endsWith("0008")
      if (partial) {
        return { ...p, paidAmountUsd: round2(p.amountUsd * 0.4), status: "partial" as const, paidAt: due.toISOString(), method: "Bank transfer", note: "Partial collection recorded" }
      }
      return { ...p, paidAmountUsd: p.amountUsd, status: "paid" as const, paidAt: addDays(due, -2).toISOString(), method: "Bank transfer" }
    }

    return { ...p, status: "upcoming" as const }
  })
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function certificateFor(f: Financing, extra?: Partial<Certificate>): Certificate {
  const g = goldItems.find((x) => x.id === f.goldId)!
  const c = customers.find((x) => x.id === f.customerId)!
  const checks = extra?.eligibilityChecks ?? {
    ownershipClear: true,
    goldVerified: g.verified,
    complianceApproved: f.legalReviewStatus === "approved",
    shariahReviewApproved: f.shariahReviewStatus === "approved",
  }
  const suspended = f.status === "recovery" || extra?.status === "suspended"
  return {
    id: f.id.replace("FIN", "CRT"),
    goldId: g.id,
    customerId: c.id,
    financingId: f.id,
    goldType: g.description,
    weightGrams: g.netWeightGrams,
    purityKarat: g.karat,
    goldValueUsd: g.assessedValueUsd,
    financingAmountUsd: f.amountUsd,
    outstandingUsd: 0,
    issueDate: f.startDate,
    maturityDate: f.maturityDate,
    status: f.status === "closed" ? "redeemed" : f.status === "recovery" ? "suspended" : "active",
    ownershipName: c.name,
    verificationId: `VFY-${f.id.slice(-4)}${g.id.slice(-2)}`,
    eligibility: deriveEligibility(checks, suspended),
    eligibilityChecks: checks,
    ownershipHistory: [
      {
        id: `own-${f.id}-1`,
        ownerName: c.name,
        ownerType: "customer",
        from: f.startDate,
        to: null,
        event: "Issued to pledgor",
      },
    ],
    createdAt: f.startDate,
    ...extra,
  }
}

export function createSeed(): AppState {
  const payments = seedPayments()
  const certificates = financings.map((f) => {
    const related = payments.filter((p) => p.financingId === f.id)
    const outstanding = round2(related.reduce((s, p) => s + Math.max(0, p.amountUsd - p.paidAmountUsd), 0))
    const cert = certificateFor(f)
    cert.outstandingUsd = f.status === "closed" ? 0 : outstanding
    if (f.id === "FIN-2026-0009") {
      cert.eligibilityChecks = {
        ownershipClear: true,
        goldVerified: true,
        complianceApproved: true,
        shariahReviewApproved: true,
      }
      cert.eligibility = "TRADING_ELIGIBLE"
      cert.outstandingUsd = 0
      cert.ownershipHistory = [
        {
          id: "own-fin9-1",
          ownerName: "Khalid Hassan",
          ownerType: "customer",
          from: f.startDate,
          to: "2026-08-28T10:00:00.000Z",
          event: "Issued to pledgor",
        },
        {
          id: "own-fin9-2",
          ownerName: "Khalid Hassan",
          ownerType: "customer",
          from: "2026-08-28T10:00:00.000Z",
          to: null,
          event: "Facility settled — holder retained certificate",
        },
      ]
    }
    if (f.id === "FIN-2026-0002") {
      cert.eligibility = "HOLD_TO_MATURITY"
    }
    if (f.id === "FIN-2026-0004") {
      cert.eligibility = "HOLD_TO_MATURITY"
      cert.eligibilityChecks.shariahReviewApproved = true
    }
    return cert
  })

  const withOutstanding = financings.map((f) => {
    const related = payments.filter((p) => p.financingId === f.id)
    const outstanding = f.status === "closed" ? 0 : round2(related.reduce((s, p) => s + Math.max(0, p.amountUsd - p.paidAmountUsd), 0))
    if (f.id === "FIN-2026-0009") return { ...f, outstandingUsd: 0 }
    return { ...f, outstandingUsd: outstanding }
  })

  const listings: MarketplaceListing[] = [
    {
      id: "MKT-2026-0001",
      certificateId: "CRT-2026-0009",
      sellerName: "Khalid Hassan",
      askingPriceUsd: 16800,
      status: "listed",
      listedAt: "2026-09-01T09:00:00.000Z",
    },
    {
      id: "MKT-2026-0002",
      certificateId: "CRT-2026-0004",
      sellerName: "Fatima Al-Sayed",
      askingPriceUsd: 40200,
      status: "pending_review",
      listedAt: "2026-09-09T11:30:00.000Z",
    },
  ]

  return {
    settings,
    customers,
    documents,
    goldItems,
    financings: withOutstanding,
    payments,
    certificates,
    vaults,
    listings,
    reviews: [
      { id: "REV-001", type: "kyc", subjectId: "CUS-2026-0004", subjectLabel: "James Whitmore — KYC", status: "needs_info", reviewer: "Compliance Desk", notes: "Source-of-wealth letter incomplete.", updatedAt: "2026-08-24T10:00:00.000Z" },
      { id: "REV-002", type: "kyc", subjectId: "CUS-2026-0008", subjectLabel: "Sofia Martinez — KYC", status: "pending", reviewer: "Compliance Desk", notes: "Awaiting identity verification.", updatedAt: "2026-09-08T14:30:00.000Z" },
      { id: "REV-003", type: "kyc", subjectId: "CUS-2026-0012", subjectLabel: "Amara Okafor — KYC", status: "pending", reviewer: "Compliance Desk", notes: "Address document under review.", updatedAt: "2026-09-03T08:00:00.000Z" },
      { id: "REV-004", type: "aml", subjectId: "CUS-2026-0009", subjectLabel: "David Chen — AML", status: "approved", reviewer: "AML Officer", notes: "Enhanced due diligence completed 2025.", updatedAt: "2025-09-20T12:00:00.000Z" },
      { id: "REV-005", type: "gold_verification", subjectId: "GLD-2026-0013", subjectLabel: "GLD-2026-0013 assay", status: "pending", reviewer: "Assay Desk", notes: "Awaiting London partner confirmation.", updatedAt: "2026-08-21T11:30:00.000Z" },
      { id: "REV-006", type: "shariah", subjectId: "FIN-2026-0012", subjectLabel: "FIN-2026-0012 structure review", status: "pending", reviewer: "Shariah Advisor (external)", notes: "Requires advisor sign-off. OneGold does not certify compliance.", updatedAt: "2026-08-18T07:00:00.000Z" },
      { id: "REV-007", type: "shariah", subjectId: "FIN-2026-0006", subjectLabel: "FIN-2026-0006 legal/Shariah pack", status: "pending", reviewer: "Legal Desk", notes: "Legal review still open.", updatedAt: "2026-04-07T04:00:00.000Z" },
      { id: "REV-008", type: "eligibility", subjectId: "CRT-2026-0009", subjectLabel: "CRT-2026-0009 marketplace eligibility", status: "approved", reviewer: "Compliance Desk", notes: "Settled facility. Trading eligible.", updatedAt: "2026-08-29T09:00:00.000Z" },
      { id: "REV-009", type: "eligibility", subjectId: "CRT-2026-0004", subjectLabel: "CRT-2026-0004 listing request", status: "needs_info", reviewer: "Compliance Desk", notes: "Outstanding financing remains. Hold to maturity.", updatedAt: "2026-09-09T12:00:00.000Z" },
    ],
    activities: [
      { id: "act-1", entityType: "customer", entityId: "CUS-2026-0008", customerId: "CUS-2026-0008", title: "Customer created", detail: "Walk-in registration started.", at: "2026-09-08T14:20:00.000Z", actor: "Shop Operator" },
      { id: "act-2", entityType: "gold", entityId: "GLD-2026-0010", customerId: "CUS-2026-0012", title: "Gold intake", detail: "18K chain recorded and held in intake cage.", at: "2026-09-02T13:30:00.000Z", actor: "Shop Operator" },
      { id: "act-3", entityType: "financing", entityId: "FIN-2026-0011", customerId: "CUS-2026-0001", title: "Financing booked", detail: "Ujrah facility against GLD-2026-0012.", at: "2026-08-01T05:20:00.000Z", actor: "Shop Operator" },
      { id: "act-4", entityType: "certificate", entityId: "CRT-2026-0009", customerId: "CUS-2026-0011", title: "Certificate listed", detail: "CRT-2026-0009 submitted to marketplace.", at: "2026-09-01T09:00:00.000Z", actor: "Shop Operator" },
      { id: "act-5", entityType: "payment", entityId: "FIN-2026-0005", customerId: "CUS-2026-0006", title: "Collection missed", detail: "Priya Menon installment marked overdue.", at: "2026-08-14T00:00:00.000Z", actor: "System" },
      { id: "act-6", entityType: "financing", entityId: "FIN-2026-0007", customerId: "CUS-2026-0009", title: "Recovery opened", detail: "David Chen facility moved to recovery workflow.", at: "2026-06-02T15:00:00.000Z", actor: "Collections Lead" },
      { id: "act-7", entityType: "gold", entityId: "GLD-2026-0008", customerId: "CUS-2026-0010", title: "Gold released", detail: "Redeemed facility — physical gold returned.", at: "2026-01-12T04:30:00.000Z", actor: "Shop Operator" },
    ],
  }
}
