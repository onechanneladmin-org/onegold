export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

export function formatUsd(value: number, opts?: { compact?: boolean }): string {
  if (opts?.compact && Math.abs(value) >= 1_000_000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value)
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatGrams(value: number): string {
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 3 })} g`
}

export function formatPercent(value: number): string {
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 1 })}%`
}
