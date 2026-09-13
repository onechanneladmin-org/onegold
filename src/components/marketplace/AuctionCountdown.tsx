import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export function useCountdown(endsAt: string) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])
  const remaining = Math.max(0, new Date(endsAt).getTime() - now)
  const totalSeconds = Math.floor(remaining / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return { remaining, expired: remaining <= 0, days, hours, minutes, seconds }
}

export function AuctionCountdown({
  endsAt,
  className,
}: {
  endsAt: string
  className?: string
}) {
  const { expired, days, hours, minutes, seconds } = useCountdown(endsAt)
  if (expired) {
    return <p className={cn("font-medium text-rose-700 dark:text-rose-300", className)}>Auction ended</p>
  }
  const parts = [
    days > 0 ? `${days}d` : null,
    `${String(hours).padStart(2, "0")}h`,
    `${String(minutes).padStart(2, "0")}m`,
    `${String(seconds).padStart(2, "0")}s`,
  ].filter(Boolean)
  return (
    <p className={cn("font-mono text-sm tabular-nums text-primary", className)}>
      {parts.join(" ")} remaining
    </p>
  )
}
