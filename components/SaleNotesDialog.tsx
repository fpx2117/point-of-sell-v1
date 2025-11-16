"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

import { PaymentData, CartItem, SaleNotesData } from "@/types/types"
import { processSale } from "@/app/actions/sales" // Server Action real

interface SaleNotesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void

  paymentData: PaymentData | null
  cart: CartItem[]
  total: number
  userId: string

  onComplete: () => void
}

export const SaleNotesDialog = ({
  open,
  onOpenChange,
  paymentData,
  cart,
  total,
  userId,
  onComplete
}: SaleNotesDialogProps) => {

  const [isMesa, setIsMesa] = useState(false)
  const [mesaNumber, setMesaNumber] = useState("")
  const [observaciones, setObservaciones] = useState("")

  /* -------------------------------------------------------
     🔥 Procesar venta REAL con server action
  ------------------------------------------------------- */
  async function procesarVenta(notas: SaleNotesData) {
    if (!paymentData) return

    const payload = {
      userId,
      total,

      // 🔥 ENVÍO COMPLETO DE ITEMS CORREGIDO
      items: cart.map((item) => ({
        productId: item.productId,
        variantId: item.variantId ?? null, // ✔ FIX CRÍTICO
        quantity: item.quantity,
        price: item.price
      })),

      // Datos de pago (basado en PaymentData real)
      paymentMethod: paymentData.paymentMethod,
      cashAmount:
        paymentData.paymentMethod === "EFECTIVO"
          ? paymentData.cashAmount
          : null,

      change:
        paymentData.paymentMethod === "EFECTIVO"
          ? paymentData.change
          : null,

      // Datos adicionales
      mesa: notas.mesa,
      mesaNumber: notas.mesaNumber,
      observaciones: notas.observaciones
    }

    console.log("📦 Enviando venta al backend...", payload)

    await processSale(payload)

    onComplete()
  }

  /* -------------------------------------------------------
     ➡ Continuar
  ------------------------------------------------------- */
  const handleContinue = async () => {
    const notas: SaleNotesData = {
      mesa: isMesa,
      mesaNumber: isMesa ? mesaNumber || null : null,
      observaciones: isMesa ? observaciones : ""
    }

    await procesarVenta(notas)

    onOpenChange(false)

    // Reset UI
    setIsMesa(false)
    setMesaNumber("")
    setObservaciones("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Información adicional de la venta</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-medium">¿La venta corresponde a una mesa?</p>
            <Switch checked={isMesa} onCheckedChange={setIsMesa} />
          </div>

          {isMesa && (
            <Input
              placeholder="Número de mesa"
              value={mesaNumber}
              onChange={(e) => setMesaNumber(e.target.value)}
            />
          )}

          {isMesa && (
            <Textarea
              placeholder="Observaciones..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleContinue}>Confirmar venta</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
