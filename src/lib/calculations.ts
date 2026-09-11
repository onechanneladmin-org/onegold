import { addMonths, differenceInCalendarDays, parseISO } from "date-fns"
import type {
  ActivityEvent,
  Financing,
  FinancingStatus,
  FinancingStructure,
  PaymentFrequency,
  PaymentInstallment,
  PaymentStatus,
} from "@/types"
import { nextPaymentId, uid } from "@/lib/ids"
import { roundMoney } from "@/lib/money"

export function purityFromKarat(karat: number): number {
  return karat / 24
}

export function finenessFromKarat(karat: number): number {
  return Math.round(purityFromKarat(karat) * 1000)
}

export function assessGoldValue(
  netWeightGrams: number,
  karat: number,
  usdPerGram: number,
): number {
  return roundMoney(netWeightGrams * purityFromKarat(karat) * usdPerGram)
}

export function maxFinancing(goldValue: number, ltvPercent: number): number {
  return roundMoney(goldValue * (ltvPercent / 100))
}

export function feeForStructure(
  amountUsd: number,
  structure: FinancingStructure,
  tenureMonths: number,
  feePercent: number,
): { feeLabel: string; feeAmountUsd: number } {
  if (structure === "ar_rahnu") {
    return {
      feeLabel: "Safekeeping fee (ujrah)",
      feeAmountUsd: roundMoney(amountUsd * (feePercent / 100) * (tenureMonths / 12)),
    }
  }
  if (structure === "ujrah") {
    return {
      feeLabel: "Service fee (ujrah)",
      feeAmountUsd: roundMoney(amountUsd * (feePercent / 100) * (tenureMonths / 12)),
    }
  }
  return {
    feeLabel: "Agreed profit",
    feeAmountUsd: roundMoney(amountUsd * (feePercent / 100) * (tenureMonths / 12)),
  }
}

export function periodCount(tenureMonths: number, frequency: PaymentFrequency): number {
  if (frequency === "bullet") return 1
  if (frequency === "quarterly") return Math.max(1, Math.ceil(tenureMonths / 3))
  return Math.max(1, tenureMonths)
}

export function buildPaymentSchedule(input: {
  financingId: string
  customerId: string
  amountUsd: number
  feeAmountUsd: number
  structure: FinancingStructure
  tenureMonths: number
  frequency: PaymentFrequency
  startDate: string
  existingPaymentIds: string[]
}): PaymentInstallment[] {
  const periods = periodCount(input.tenureMonths, input.frequency)
  const start = parseISO(input.startDate)
  const monthStep = input.frequency === "quarterly" ? 3 : input.frequency === "bullet" ? input.tenureMonths : 1
  const ids: string[] = [...input.existingPaymentIds]
  const items: PaymentInstallment[] = []

  if (input.structure === "agreed_profit") {
    const installment = roundMoney((input.amountUsd + input.feeAmountUsd) / periods)
    for (let i = 0; i < periods; i += 1) {
      const id = nextPaymentId(ids)
      ids.push(id)
      const isLast = i === periods - 1
      const amount = isLast
        ? roundMoney(input.amountUsd + input.feeAmountUsd - installment * (periods - 1))
        : installment
      items.push({
        id,
        financingId: input.financingId,
        customerId: input.customerId,
        dueDate: addMonths(start, monthStep * (i + 1)).toISOString(),
        amountUsd: amount,
        paidAmountUsd: 0,
        status: "upcoming",
        paidAt: null,
      })
    }
    return items
  }

  const feeEach = roundMoney(input.feeAmountUsd / periods)
  for (let i = 0; i < periods; i += 1) {
    const id = nextPaymentId(ids)
    ids.push(id)
    const isLast = i === periods - 1
    const feePart = isLast
      ? roundMoney(input.feeAmountUsd - feeEach * (periods - 1))
      : feeEach
    items.push({
      id,
      financingId: input.financingId,
      customerId: input.customerId,
      dueDate: addMonths(start, monthStep * (i + 1)).toISOString(),
      amountUsd: isLast ? roundMoney(input.amountUsd + feePart) : feePart,
      paidAmountUsd: 0,
      status: "upcoming",
      paidAt: null,
    })
  }
  return items
}

export function derivePaymentStatus(
  payment: PaymentInstallment,
  now = new Date(),
): PaymentStatus {
  if (payment.paidAmountUsd >= payment.amountUsd && payment.amountUsd > 0) return "paid"
  if (payment.paidAmountUsd > 0 && payment.paidAmountUsd < payment.amountUsd) {
    if (parseISO(payment.dueDate) < now) return "overdue"
    return "partial"
  }
  if (parseISO(payment.dueDate) < now) return "overdue"
  return "upcoming"
}

export function deriveFinancingStatus(
  financing: Financing,
  payments: PaymentInstallment[],
  now = new Date(),
): FinancingStatus {
  if (financing.status === "closed" || financing.status === "pending" || financing.status === "recovery") {
    return financing.status
  }
  const related = payments.filter((p) => p.financingId === financing.id)
  if (related.some((p) => p.status === "overdue")) return "overdue"
  const days = differenceInCalendarDays(parseISO(financing.maturityDate), now)
  if (days <= 21) return "maturing"
  return "active"
}

export function remainingOutstanding(financing: Financing, payments: PaymentInstallment[]): number {
  const related = payments.filter((p) => p.financingId === financing.id)
  const unpaid = related.reduce((sum, p) => sum + Math.max(0, p.amountUsd - p.paidAmountUsd), 0)
  return roundMoney(unpaid)
}

export function applyPaymentStatuses(payments: PaymentInstallment[], now = new Date()): PaymentInstallment[] {
  return payments.map((p) => {
    if (p.status === "completed" || (p.paidAmountUsd >= p.amountUsd && p.amountUsd > 0)) {
      return { ...p, status: p.paidAmountUsd >= p.amountUsd ? "paid" : p.status }
    }
    return { ...p, status: derivePaymentStatus(p, now) }
  })
}

export function newActivity(
  partial: Omit<ActivityEvent, "id" | "at" | "actor"> & {
    at?: string
    actor?: string
  },
): ActivityEvent {
  return {
    id: uid("act"),
    at: partial.at ?? new Date().toISOString(),
    actor: partial.actor ?? "Shop Operator",
    entityType: partial.entityType,
    entityId: partial.entityId,
    customerId: partial.customerId,
    title: partial.title,
    detail: partial.detail,
  }
}
