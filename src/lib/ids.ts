function pad(n: number, size = 4): string {
  return String(n).padStart(size, "0")
}

function nextNumeric(ids: string[], prefix: string): number {
  const nums = ids
    .filter((id) => id.startsWith(prefix))
    .map((id) => {
      const part = id.split("-").pop() ?? "0"
      return Number.parseInt(part, 10) || 0
    })
  return Math.max(0, ...nums) + 1
}

export function nextPrefixedId(ids: string[], prefix: string, year = 2026): string {
  return `${prefix}-${year}-${pad(nextNumeric(ids, prefix))}`
}

export function nextGoldId(ids: string[]): string {
  return nextPrefixedId(ids, "GLD")
}

export function nextCertificateId(ids: string[]): string {
  return nextPrefixedId(ids, "CRT")
}

export function nextFinancingId(ids: string[]): string {
  return nextPrefixedId(ids, "FIN")
}

export function nextCustomerId(ids: string[]): string {
  return nextPrefixedId(ids, "CUS")
}

export function nextPacketId(ids: string[]): string {
  return nextPrefixedId(ids, "PKT")
}

export function nextSealId(ids: string[]): string {
  return nextPrefixedId(ids, "SEL")
}

export function nextListingId(ids: string[]): string {
  return nextPrefixedId(ids, "MKT")
}

export function nextAuctionId(ids: string[]): string {
  return nextPrefixedId(ids, "AUC")
}

export function nextBidId(ids: string[]): string {
  return nextPrefixedId(ids, "BID")
}

export function nextPaymentId(ids: string[]): string {
  return nextPrefixedId(ids, "PAY", 2026)
}

export function nextVerificationId(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `VFY-${rand}`
}

export function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
}
