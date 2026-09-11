import { useMemo, useState, type ReactNode } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { PageHeader } from "@/components/shared/PageHeader"
import { Money } from "@/components/shared/Money"
import { ComplianceNote } from "@/components/shared/Disclaimer"
import { formatGrams, formatPercent } from "@/lib/money"
import { FREQUENCY_LABELS, GOLD_TYPE_LABELS, STRUCTURE_LABELS } from "@/lib/labels"
import { feeForStructure, maxFinancing } from "@/lib/calculations"
import { useAppState, useAppStore } from "@/store/AppStore"
import type { FinancingStructure, PaymentFrequency } from "@/types"

const STEPS = ["Customer", "Gold", "Valuation", "Terms", "Review"]

export function NewFinancingPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { customers, goldItems, vaults, settings, financings } = useAppState()
  const { createFinancing } = useAppStore()
  const [step, setStep] = useState(0)
  const [customerId, setCustomerId] = useState(params.get("customer") ?? customers[0]?.id ?? "")
  const pledged = new Set(financings.filter((f) => f.status !== "closed").map((f) => f.goldId))
  const availableGold = goldItems.filter(
    (g) => g.customerId === customerId && g.status !== "released",
  )
  const unpledged = availableGold.filter((g) => !pledged.has(g.id))
  const [goldId, setGoldId] = useState(params.get("gold") ?? unpledged[0]?.id ?? availableGold[0]?.id ?? "")
  const gold = goldItems.find((g) => g.id === goldId)
  const customer = customers.find((c) => c.id === customerId)
  const cap = gold ? maxFinancing(gold.assessedValueUsd, settings.defaultLtvPercent) : 0
  const [amount, setAmount] = useState(String(Math.round(cap * 0.85) || 1000))
  const [structure, setStructure] = useState<FinancingStructure>("ar_rahnu")
  const [tenure, setTenure] = useState("6")
  const [frequency, setFrequency] = useState<PaymentFrequency>("monthly")
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [vaultId, setVaultId] = useState(gold?.vaultId && gold.vaultId !== "VLT-C" ? gold.vaultId : "VLT-A")
  const [lockerId, setLockerId] = useState(gold?.lockerId && gold.vaultId !== "VLT-C" ? gold.lockerId : "A-10")

  const template = settings.structures.find((s) => s.id === structure)
  const fee = feeForStructure(Number(amount) || 0, structure, Number(tenure) || 1, template?.defaultFeePercent ?? 8)
  const ltv = gold && gold.assessedValueUsd > 0 ? ((Number(amount) || 0) / gold.assessedValueUsd) * 100 : 0
  const lockers = vaults.find((v) => v.id === vaultId)?.lockers ?? []

  const canNext = useMemo(() => {
    if (step === 0) return Boolean(customerId)
    if (step === 1) return Boolean(goldId)
    if (step === 3) return Number(amount) > 0 && Number(amount) <= cap + 0.01
    return true
  }, [step, customerId, goldId, amount, cap])

  return (
    <div>
      <PageHeader
        eyebrow="Origination"
        title="New financing"
        description="Customer → gold → valuation → Islamic structure → custody and certificate."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {STEPS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(i)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{STEPS[step]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 ? (
            <Select value={customerId} onValueChange={(v) => { setCustomerId(v); setGoldId("") }}>
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} · {c.kycStatus}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          {step === 1 ? (
            <div className="grid gap-3">
              {availableGold.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No gold on file. <Link className="underline" to="/gold">Record intake first</Link>.
                </p>
              ) : (
                <RadioGroup value={goldId} onValueChange={setGoldId}>
                  {availableGold.map((g) => (
                    <label key={g.id} className="flex cursor-pointer items-start gap-3 rounded-lg border p-3">
                      <RadioGroupItem value={g.id} />
                      <div>
                        <p className="font-medium">{g.id} · {GOLD_TYPE_LABELS[g.itemType]}</p>
                        <p className="text-sm text-muted-foreground">{g.description} · {formatGrams(g.netWeightGrams)}</p>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              )}
            </div>
          ) : null}

          {step === 2 && gold ? (
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <KV label="Gold value" value={<Money value={gold.assessedValueUsd} />} />
              <KV label="Policy LTV" value={formatPercent(settings.defaultLtvPercent)} />
              <KV label="Maximum financing" value={<Money value={cap} />} />
              <KV label="Requested" value={<Money value={Number(amount) || 0} />} />
              <KV label="Implied LTV" value={formatPercent(ltv)} />
              <KV label="Eligible margin" value={<Money value={Math.max(0, cap - (Number(amount) || 0))} />} />
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Financing amount (USD)</Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
                <p className="text-xs text-muted-foreground">Cap <Money value={cap} /></p>
              </div>
              <div className="space-y-2">
                <Label>Structure</Label>
                <Select value={structure} onValueChange={(v) => setStructure(v as FinancingStructure)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {settings.structures.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tenure (months)</Label>
                <Input type="number" value={tenure} onChange={(e) => setTenure(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Payment frequency</Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as PaymentFrequency)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FREQUENCY_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <KV label={fee.feeLabel} value={<Money value={fee.feeAmountUsd} />} />
              <div className="space-y-2">
                <Label>Vault</Label>
                <Select value={vaultId} onValueChange={setVaultId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {vaults.filter((v) => v.id !== "VLT-C").map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Locker</Label>
                <Select value={lockerId} onValueChange={setLockerId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {lockers.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <ComplianceNote />
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-3 text-sm">
              <KV label="Customer" value={customer?.name ?? "—"} />
              <KV label="Gold" value={`${gold?.id} · ${gold?.description}`} />
              <KV label="Amount" value={<Money value={Number(amount) || 0} />} />
              <KV label="Structure" value={STRUCTURE_LABELS[structure]} />
              <KV label="Tenure / frequency" value={`${tenure} months · ${FREQUENCY_LABELS[frequency]}`} />
              <KV label="Custody" value={`${vaultId} / ${lockerId}`} />
              <p className="text-muted-foreground">
                Confirming will create the facility, payment schedule, vault custody record and digital certificate.
              </p>
            </div>
          ) : null}

          <div className="flex justify-between pt-2">
            <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
            {step < 4 ? (
              <Button disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
                Continue
              </Button>
            ) : (
              <Button
                onClick={() => {
                  try {
                    const created = createFinancing({
                      customerId,
                      goldId,
                      amountUsd: Number(amount),
                      structure,
                      tenureMonths: Number(tenure),
                      paymentFrequency: frequency,
                      startDate,
                      vaultId,
                      lockerId,
                    })
                    toast.success(`${created.id} booked`)
                    navigate(`/financing/${created.id}`)
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Could not create financing")
                  }
                }}
              >
                Issue facility & certificate
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function KV({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="font-medium">{value}</div>
    </div>
  )
}

