import { formatUsd } from "@/lib/money"
import { cn } from "@/lib/utils"

export function Money({
  value,
  className,
  compact,
}: {
  value: number
  className?: string
  compact?: boolean
}) {
  return <span className={cn("tabular-nums", className)}>{formatUsd(value, { compact })}</span>
}
