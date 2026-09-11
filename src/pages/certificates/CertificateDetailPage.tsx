import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CertificateView } from "@/components/certificates/CertificateView"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { EmptyState } from "@/components/shared/EmptyState"
import { ComplianceNote } from "@/components/shared/Disclaimer"
import { formatDateTime } from "@/lib/format"
import { isTradable } from "@/lib/eligibility"
import { useAppState, useAppStore } from "@/store/AppStore"

export function CertificateDetailPage() {
  const { id } = useParams()
  const { certificates, settings, financings, goldItems } = useAppState()
  const { listCertificate, updateCertificateChecks } = useAppStore()
  const certificate = certificates.find((c) => c.id === id)
  const [listOpen, setListOpen] = useState(false)
  const [price, setPrice] = useState("")

  if (!certificate) {
    return <EmptyState title="Certificate not found" action={<Button asChild><Link to="/certificates">Back</Link></Button>} />
  }

  const checks = [
    { key: "ownershipClear" as const, label: "Ownership is clear" },
    { key: "goldVerified" as const, label: "Gold verification complete" },
    { key: "complianceApproved" as const, label: "Compliance / AML review approved" },
    { key: "shariahReviewApproved" as const, label: "Shariah / legal review approved" },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Certificate"
        title={certificate.id}
        description={`Held by ${certificate.ownershipName}`}
        actions={
          <>
            <Button variant="outline" onClick={() => window.print()}>Print</Button>
            <Button
              variant="secondary"
              onClick={async () => {
                await navigator.clipboard.writeText(`${window.location.origin}/certificates/${certificate.id} · ${certificate.verificationId}`)
                toast.success("Verification link copied")
              }}
            >
              Share
            </Button>
            <Button asChild variant="ghost">
              <Link to={`/financing/${certificate.financingId}`}>Facility</Link>
            </Button>
            {certificate.status === "active" ? (
              <Button onClick={() => { setPrice(String(Math.round(certificate.goldValueUsd * 1.02))); setListOpen(true) }}>
                List on marketplace
              </Button>
            ) : null}
          </>
        }
      />

      <CertificateView certificate={certificate} shopName={settings.shopName} />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Eligibility checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Current</span>
              <StatusBadge value={certificate.eligibility} />
            </div>
            {checks.map((c) => (
              <label key={c.key} className="flex items-center gap-3 text-sm">
                <Checkbox
                  checked={certificate.eligibilityChecks[c.key]}
                  onCheckedChange={(v) => updateCertificateChecks(certificate.id, { [c.key]: Boolean(v) })}
                />
                {c.label}
              </label>
            ))}
            <ComplianceNote />
            <p className="text-xs text-muted-foreground">
              Trading eligibility also requires a settled outstanding balance. This is not a securities listing.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ownership history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {certificate.ownershipHistory.map((h) => (
              <div key={h.id} className="relative border-l-2 border-gold/40 pl-4">
                <p className="font-medium">{h.ownerName}</p>
                <p className="text-sm text-muted-foreground">{h.event}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(h.from)} {h.to ? `→ ${formatDateTime(h.to)}` : "→ current"}
                </p>
              </div>
            ))}
            <Link className="text-sm text-primary hover:underline" to={`/gold/${goldItems.find((g) => g.id === certificate.goldId)?.id}`}>
              View pledged gold
            </Link>
            <Link className="ml-4 text-sm text-primary hover:underline" to={`/financing/${financings.find((f) => f.id === certificate.financingId)?.id}`}>
              View financing
            </Link>
          </CardContent>
        </Card>
      </div>

      <Dialog open={listOpen} onOpenChange={setListOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit sell / transfer request</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Mock marketplace only. {isTradable(certificate) ? "This certificate is trading eligible." : "Eligibility gate may send this to review."}
          </p>
          <Label>Asking price (USD)</Label>
          <Input value={price} onChange={(e) => setPrice(e.target.value)} />
          <DialogFooter>
            <Button
              onClick={() => {
                listCertificate({ certificateId: certificate.id, askingPriceUsd: Number(price) })
                toast.success("Listing submitted")
                setListOpen(false)
              }}
            >
              Submit request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
