"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, User, CreditCard, Package, UtensilsCrossed, StickyNote } from "lucide-react"

import type { Sale } from "@/types/types"

interface SaleDetailProps {
  sale: Sale | null
  onClose: () => void
}

export const SaleDetail = ({ sale, onClose }: SaleDetailProps) => {
  if (!sale) return null

  return (
    <Dialog open={!!sale} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle de Venta</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">

          {/* Información general */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">ID de Transacción</span>
              <code className="text-sm bg-muted px-2 py-1 rounded">{sale.id}</code>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Fecha y Hora
              </span>
              <span className="text-sm font-medium">
                {new Date(sale.createdAt).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {sale.user && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Vendedor
                </span>
                <span className="text-sm font-medium">{sale.user.name}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Método de Pago
              </span>
              <Badge>{sale.paymentMethod}</Badge>
            </div>
          </div>

          {/* Información de mesa */}
          {sale.mesa && (
            <>
              <Separator />

              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4" />
                  Información de Mesa
                </h3>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Número de Mesa</span>
                  <span className="font-medium">{sale.mesaNumber || "—"}</span>
                </div>

                {sale.observaciones && sale.observaciones.trim() !== "" && (
                  <div className="flex items-start gap-2">
                    <StickyNote className="h-4 w-4 text-muted-foreground mt-1" />
                    <p className="text-sm">{sale.observaciones}</p>
                  </div>
                )}
              </div>
            </>
          )}

          <Separator />

          {/* Productos */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              Productos
            </h3>

            <div className="space-y-2">
              {sale.items.map((item) => (
                <div key={item.id} className="border rounded-lg p-3 space-y-2">

                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      {/* Nombre producto */}
                      <p className="font-medium">{item.product?.name}</p>

                      {/* Categoría */}
                      {item.product && (
                        <Badge
                          className="text-xs mt-1"
                          style={{ backgroundColor: item.product.category.color }}
                        >
                          {item.product.category.name}
                        </Badge>
                      )}

                      {/* 🔥 Variante vendida */}
                      {item.variant && (
                        <p className="text-xs mt-1 text-muted-foreground">
                          Variante:{" "}
                          <span className="font-medium">
                            {item.variant.value || item.variant.name}
                          </span>
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="font-semibold">${item.subtotal.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {item.quantity} × ${item.price.toFixed(2)}
                    </span>
                  </div>

                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Totales */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">${sale.total.toFixed(2)}</span>
            </div>

            {sale.paymentMethod === "EFECTIVO" && sale.cashAmount !== null && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Monto Recibido</span>
                  <span className="font-medium">${sale.cashAmount.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cambio</span>
                  <span className="font-medium text-green-600">
                    ${(sale.change || 0).toFixed(2)}
                  </span>
                </div>
              </>
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-2xl font-bold text-primary">${sale.total.toFixed(2)}</span>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  )
}
