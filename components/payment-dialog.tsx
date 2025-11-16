"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  DollarSign,
  CreditCard,
  ArrowRightLeft,
} from "lucide-react"

// 🧩 Tipos internos compatibles
interface CartItem {
  product: { id: string; name: string; price: number | string }
  quantity: number
  selectedVariant?: { priceAdjustment: number | string }
}

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cart: CartItem[]
  total: number

  // 🆕 NUEVO
  onPaymentConfirmed: (data: {
    paymentMethod: "EFECTIVO" | "TARJETA" | "TRANSFERENCIA"
    cashAmount: number | null
    change: number | null
  }) => void
}

export const PaymentDialog = ({
  open,
  onOpenChange,
  cart,
  total,
  onPaymentConfirmed,
}: PaymentDialogProps) => {
  const [paymentMethod, setPaymentMethod] = useState<
    "EFECTIVO" | "TARJETA" | "TRANSFERENCIA"
  >("EFECTIVO")

  const [cashAmount, setCashAmount] = useState("")

  const change =
    paymentMethod === "EFECTIVO"
      ? Math.max(0, Number(cashAmount || 0) - total)
      : 0

  const canProceed =
    paymentMethod !== "EFECTIVO" || Number(cashAmount || 0) >= total

  const handleNext = () => {
    if (!canProceed) return

    onPaymentConfirmed({
      paymentMethod,
      cashAmount:
        paymentMethod === "EFECTIVO" ? Number(cashAmount) : null,
      change: paymentMethod === "EFECTIVO" ? change : null,
    })

    // cerrar modal
    onOpenChange(false)

    // reset
    setCashAmount("")
    setPaymentMethod("EFECTIVO")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Procesar Pago</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* TOTAL */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-muted-foreground">Total a pagar:</span>
              <span className="text-3xl font-bold text-primary">
                ${total.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} productos
            </p>
          </div>

          {/* MÉTODO DE PAGO */}
          <div className="space-y-3">
            <Label>Método de Pago</Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(val) => setPaymentMethod(val as any)}
            >
              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer">
                <RadioGroupItem value="EFECTIVO" id="cash" />
                <Label htmlFor="cash" className="flex-1 flex gap-2">
                  <DollarSign className="h-4 w-4" /> Efectivo
                </Label>
              </div>

              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer">
                <RadioGroupItem value="TARJETA" id="card" />
                <Label htmlFor="card" className="flex-1 flex gap-2">
                  <CreditCard className="h-4 w-4" /> Tarjeta
                </Label>
              </div>

              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer">
                <RadioGroupItem value="TRANSFERENCIA" id="transfer" />
                <Label htmlFor="transfer" className="flex-1 flex gap-2">
                  <ArrowRightLeft className="h-4 w-4" /> Transferencia
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* EFECTIVO */}
          {paymentMethod === "EFECTIVO" && (
            <div className="space-y-4">
              <Label>Monto Recibido</Label>
              <Input
                type="number"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                placeholder="0.00"
              />

              {cashAmount && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between">
                    <span className="font-medium">Cambio:</span>
                    <span className="text-2xl font-bold text-green-600">
                      ${change.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BOTONES */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>

            <Button
              className="flex-1"
              onClick={handleNext}
              disabled={!canProceed}
            >
              Continuar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
