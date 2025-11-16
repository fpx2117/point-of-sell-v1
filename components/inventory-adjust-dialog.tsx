"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { adjustInventory } from "@/app/actions/inventory"

interface InventoryAdjustDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: {
    id: string
    name: string
    stock: number
  } | null
  onSaved: () => void
}

export const InventoryAdjustDialog = ({ open, onOpenChange, product, onSaved }: InventoryAdjustDialogProps) => {
  // 👇 usar los mismos valores que el backend
  const [type, setType] = useState<"ENTRADA" | "SALIDA">("ENTRADA")
  const [quantity, setQuantity] = useState("")
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) {
      setType("ENTRADA")
      setQuantity("")
      setReason("")
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    setLoading(true)
    try {
      await adjustInventory({
        productId: product.id,
        type, // ✅ ya es compatible con "ENTRADA" | "SALIDA" | "AJUSTE"
        quantity: Number.parseInt(quantity),
        reason,
      })
      onSaved()
    } catch (error) {
      console.error("[v0] Error adjusting inventory:", error)
      alert("Error al ajustar el inventario")
    } finally {
      setLoading(false)
    }
  }

  const newStock = product
    ? type === "ENTRADA"
      ? product.stock + Number.parseInt(quantity || "0")
      : product.stock - Number.parseInt(quantity || "0")
    : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajustar Inventario: {product?.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Stock actual</p>
            <p className="text-2xl font-bold">{product?.stock}</p>
          </div>

          <div>
            <Label htmlFor="type">Tipo de Movimiento</Label>
            <Select value={type} onValueChange={(value) => setType(value as "ENTRADA" | "SALIDA")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ENTRADA">Entrada (+)</SelectItem>
                <SelectItem value="SALIDA">Salida (-)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="quantity">Cantidad</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="reason">Motivo</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Compra de mercancía, ajuste por inventario físico..."
              required
            />
          </div>

          {quantity && (
            <div className="p-4 bg-primary/10 rounded-lg">
              <p className="text-sm text-muted-foreground">Stock después del ajuste</p>
              <p className={`text-2xl font-bold ${newStock < 0 ? "text-destructive" : ""}`}>{newStock}</p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || newStock < 0}>
              {loading ? "Guardando..." : "Aplicar Ajuste"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
