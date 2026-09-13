import { useMemo, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { addHours } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/shared/PageHeader"
import { Money } from "@/components/shared/Money"
import { canCreateAuction } from "@/lib/auction"
import { isTradable } from "@/lib/eligibility"
import { formatDateTime } from "@/lib/format"
import { useAppState, useAppStore } from "@/store/AppStore"

export function CreateAuctionPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { certificates, auctions } = useAppState()
  const { createAuction } = useAppStore()
  const eligible = certificates.filter((c) => canCreateAuction(c, auctions).ok)
  const [certificateId, setCertificateId] = useState(params.get("certificate") ?? eligible[0]?.id ?? "")
  const [start, setStart] = useState("10000")
  const [reserve, setReserve] = useState("10800")
  const [hours, setHours] = useState("48")
  const cert = certificates.find((c) => c.id === certificateId)
  const gate = canCreateAuction(cert, auctions)
  const endsAt = useMemo(() => addHours(new Date(), Number(hours) || 0).toISOString(), [hours])

  return (
    <div>
      <PageHeader
        eyebrow="Origination"
        title="Create auction"
        description="Set a starting price, optional reserve, and duration. Only trading-eligible certificates can be listed."
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Auction terms</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Certificate</Label>
            <Select value={certificateId} onValueChange={setCertificateId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an eligible certificate" />
              </SelectTrigger>
              <SelectContent>
                {(cert && !eligible.some((c) => c.id === cert.id) ? [cert, ...eligible] : eligible).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.id} · {c.ownershipName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {eligible.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No certificates are currently auctionable.{" "}
                <Link className="underline" to="/certificates">
                  Review eligibility
                </Link>
                .
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>Starting price (USD)</Label>
            <Input type="number" min={1} value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Reserve price (USD, optional)</Label>
            <Input type="number" min={0} value={reserve} onChange={(e) => setReserve(e.target.value)} placeholder="Leave 0 for none" />
          </div>
          <div className="space-y-2">
            <Label>Duration (hours)</Label>
            <Select value={hours} onValueChange={setHours}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 hour</SelectItem>
                <SelectItem value="6">6 hours</SelectItem>
                <SelectItem value="24">24 hours</SelectItem>
                <SelectItem value="48">48 hours</SelectItem>
                <SelectItem value="72">72 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 text-sm">
            <p className="text-xs text-muted-foreground">Closes</p>
            <p>{formatDateTime(endsAt)}</p>
            {cert ? (
              <p className="text-muted-foreground">
                Assessed gold value <Money value={cert.goldValueUsd} />
                {" · "}
                {isTradable(cert) ? "Trading eligible" : "Not eligible"}
                {cert.outstandingUsd > 0 ? (
                  <>
                    {" · "}outstanding <Money value={cert.outstandingUsd} /> (settled on auction close)
                  </>
                ) : null}
              </p>
            ) : null}
          </div>
          {!gate.ok && cert ? <p className="text-sm text-rose-700 sm:col-span-2">{gate.error}</p> : null}
          <div className="sm:col-span-2">
            <Button
              disabled={!certificateId || !gate.ok}
              onClick={() => {
                const result = createAuction({
                  certificateId,
                  startingPriceUsd: Number(start),
                  reservePriceUsd: Number(reserve) > 0 ? Number(reserve) : null,
                  durationHours: Number(hours),
                })
                if (!result.ok || !result.data) {
                  toast.error(result.error ?? "Could not create auction")
                  return
                }
                toast.success(`${result.data.id} is live`)
                navigate(`/marketplace/auctions/${result.data.id}`)
              }}
            >
              Open auction
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
