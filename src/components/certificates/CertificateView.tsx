import { QRPattern } from "@/components/certificates/QRPattern"
import { formatDate } from "@/lib/format"
import { formatGrams, formatUsd } from "@/lib/money"
import { CERT_STATUS_LABELS, ELIGIBILITY_LABELS } from "@/lib/labels"
import type { Certificate } from "@/types"

export function CertificateView({
  certificate,
  shopName,
}: {
  certificate: Certificate
  shopName: string
}) {
  return (
    <div className="print-certificate relative overflow-hidden rounded-2xl border border-gold/40 bg-[radial-gradient(circle_at_top_left,oklch(0.96_0.04_85),oklch(0.99_0.01_95)_42%,oklch(0.97_0.02_160))] p-8 text-foreground shadow-xl dark:bg-[radial-gradient(circle_at_top_left,oklch(0.28_0.04_85),oklch(0.2_0.03_162)_50%,oklch(0.18_0.03_162))]">
      <div className="pointer-events-none absolute inset-4 rounded-xl border border-gold/25" />
      <div className="relative space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Digital gold certificate</p>
            <h2 className="mt-2 font-serif text-3xl">{shopName}</h2>
            <p className="text-sm text-muted-foreground">System of record · custody-backed instrument</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm">{certificate.id}</p>
            <p className="text-xs text-muted-foreground">{CERT_STATUS_LABELS[certificate.status]}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Field label="Registered holder" value={certificate.ownershipName} />
          <Field label="Gold ID" value={certificate.goldId} />
          <Field label="Financing" value={certificate.financingId} />
          <Field label="Gold description" value={certificate.goldType} wide />
          <Field label="Net weight" value={formatGrams(certificate.weightGrams)} />
          <Field label="Purity" value={`${certificate.purityKarat}K`} />
          <Field label="Assessed gold value" value={formatUsd(certificate.goldValueUsd)} />
          <Field label="Financing amount" value={formatUsd(certificate.financingAmountUsd)} />
          <Field label="Outstanding" value={formatUsd(certificate.outstandingUsd)} />
          <Field label="Issued" value={formatDate(certificate.issueDate)} />
          <Field label="Maturity" value={formatDate(certificate.maturityDate)} />
          <Field label="Eligibility" value={ELIGIBILITY_LABELS[certificate.eligibility]} />
        </div>

        <div className="flex flex-wrap items-end justify-between gap-6 border-t border-gold/20 pt-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Verification</p>
            <p className="mt-1 font-mono text-sm">{certificate.verificationId}</p>
            <p className="mt-3 max-w-md text-[11px] leading-relaxed text-muted-foreground">
              This certificate is an operational record of pledged gold and financing. It is not a listed security.
              Eligibility and Shariah/legal status require independent review.
            </p>
          </div>
          <QRPattern value={certificate.verificationId} />
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "md:col-span-3" : undefined}>
      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  )
}
