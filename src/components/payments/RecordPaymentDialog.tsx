import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Money } from "@/components/shared/Money"
import { useAppStore } from "@/store/AppStore"
import type { PaymentInstallment } from "@/types"

export function RecordPaymentDialog({
  payment,
  open,
  onOpenChange,
}: {
  payment: PaymentInstallment | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { recordPayment } = useAppStore()
  const due = payment ? payment.amountUsd - payment.paidAmountUsd : 0
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("Bank transfer")

  useEffect(() => {
    if (open && payment) setAmount(String(payment.amountUsd - payment.paidAmountUsd))
  }, [open, payment])

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>
            Mock collection only — updates outstanding balances, the certificate, and dashboard figures.
          </DialogDescription>
        </DialogHeader>
        {payment ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Remaining on {payment.id}: <Money value={due} />
            </p>
            <div className="space-y-2">
              <Label htmlFor="amt">Amount (USD)</Label>
              <Input id="amt" type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bank transfer">Bank transfer</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Internal offset">Internal offset</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : null}
        <DialogFooter>
          <Button
            onClick={() => {
              if (!payment) return
              const value = Number(amount)
              if (!value || value <= 0) {
                toast.error("Enter a valid amount")
                return
              }
              recordPayment({ paymentId: payment.id, amountUsd: value, method })
              toast.success("Payment recorded")
              onOpenChange(false)
            }}
          >
            Save collection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
