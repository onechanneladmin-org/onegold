import { Link } from "react-router-dom"
import { Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Money } from "@/components/shared/Money"
import { EmptyState } from "@/components/shared/EmptyState"
import { namesMatch } from "@/lib/auction"
import { useAppState, useAppStore } from "@/store/AppStore"

export function WonAuctionsPage() {
  const { auctions, approvedBidders, sessionBidder, certificates } = useAppState()
  const { setSessionBidder, settleAuction } = useAppStore()
  const won = auctions.filter(
    (a) => (a.status === "ended" || a.status === "settled") && a.winnerName && namesMatch(a.winnerName, sessionBidder),
  )

  return (
    <div>
      <PageHeader
        eyebrow="Wins"
        title="Won auctions"
        description="Highest valid bids that met the reserve. Settlement transfers certificate ownership."
        actions={
          <Select value={sessionBidder} onValueChange={setSessionBidder}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {approvedBidders.filter((b) => b.approved).map((b) => (
                <SelectItem key={b.id} value={b.name}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
      {won.length === 0 ? (
        <EmptyState icon={<Trophy className="h-8 w-8" />} title={`${sessionBidder} has no winning auctions`} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {won.map((a) => {
            const cert = certificates.find((c) => c.id === a.certificateId)
            return (
              <Card key={a.id}>
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{a.id}</p>
                    <StatusBadge value={a.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">{a.certificateId} · now held by {cert?.ownershipName}</p>
                  <p className="font-serif text-2xl">
                    <Money value={a.winningBidUsd ?? 0} />
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" asChild>
                      <Link to={`/marketplace/auctions/${a.id}`}>View</Link>
                    </Button>
                    {a.status === "ended" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => settleAuction(a.id)}
                      >
                        Settle
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
