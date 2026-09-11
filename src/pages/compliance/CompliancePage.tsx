import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ComplianceNote } from "@/components/shared/Disclaimer"
import { formatDateTime } from "@/lib/format"
import { REVIEW_LABELS } from "@/lib/labels"
import { useAppState, useAppStore } from "@/store/AppStore"
import type { ComplianceReview, ReviewStatus } from "@/types"
import { useState } from "react"

const TYPES = ["kyc", "aml", "gold_verification", "shariah", "eligibility"] as const

export function CompliancePage() {
  const { reviews, activities } = useAppState()
  const audit = activities.filter((a) => a.entityType === "compliance" || a.entityType === "customer" || a.entityType === "financing")

  return (
    <div>
      <PageHeader
        eyebrow="Governance"
        title="Compliance & Shariah review"
        description="Configurable approval workflows for KYC, AML, assay, Shariah and certificate eligibility."
      />
      <div className="mb-4 rounded-xl border bg-muted/40 px-4 py-3">
        <ComplianceNote />
      </div>
      <Tabs defaultValue="kyc">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="kyc">KYC</TabsTrigger>
          <TabsTrigger value="aml">AML</TabsTrigger>
          <TabsTrigger value="gold_verification">Gold verification</TabsTrigger>
          <TabsTrigger value="shariah">Shariah review</TabsTrigger>
          <TabsTrigger value="eligibility">Eligibility</TabsTrigger>
          <TabsTrigger value="audit">Audit log</TabsTrigger>
        </TabsList>
        {TYPES.map((type) => (
          <TabsContent key={type} value={type}>
            <ReviewTable rows={reviews.filter((r) => r.type === type)} />
          </TabsContent>
        ))}
        <TabsContent value="audit">
          <Card>
            <CardContent className="space-y-3 p-5">
              {audit.slice(0, 20).map((a) => (
                <div key={a.id} className="border-b pb-3 last:border-0">
                  <p className="font-medium">{a.title}</p>
                  <p className="text-sm text-muted-foreground">{a.detail}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(a.at)} · {a.actor}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ReviewTable({ rows }: { rows: ComplianceReview[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No items in this queue.</p>
  }
  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subject</TableHead>
            <TableHead>Reviewer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <ReviewRow key={r.id} review={r} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function ReviewRow({ review }: { review: ComplianceReview }) {
  const { updateReview } = useAppStore()
  const [status, setStatus] = useState<ReviewStatus>(review.status)
  const [notes, setNotes] = useState(review.notes)
  return (
    <TableRow>
      <TableCell>
        <p className="font-medium">{review.subjectLabel}</p>
        <p className="text-xs text-muted-foreground">{review.subjectId}</p>
      </TableCell>
      <TableCell>{review.reviewer}</TableCell>
      <TableCell><StatusBadge value={review.status} /></TableCell>
      <TableCell>{formatDateTime(review.updatedAt)}</TableCell>
      <TableCell className="min-w-56 space-y-2">
        <Select value={status} onValueChange={(v) => setStatus(v as ReviewStatus)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(REVIEW_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-16" />
        <Button size="sm" onClick={() => updateReview(review.id, status, notes)}>Save decision</Button>
      </TableCell>
    </TableRow>
  )
}
