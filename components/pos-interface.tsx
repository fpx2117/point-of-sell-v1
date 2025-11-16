"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, ShoppingCart, Trash2, Plus, Minus } from "lucide-react"
import { ProductSearch } from "@/components/product-search"
import { PaymentDialog } from "@/components/payment-dialog"
import { SaleNotesDialog } from "@/components/SaleNotesDialog"

import {
  ProductPOS,
  PaymentMethod,
  PaymentData,
  CartItem as GlobalCartItem,
} from "@/types/types"

/* -------------------------------------------------------
   ⚠️ CartItem local NO es igual al global
------------------------------------------------------- */
interface LocalCartItem {
  product: ProductPOS
  quantity: number
  selectedVariant?: {
    id: string
    name: string
    value: string
    priceAdjustment: number | string
  }
}

interface POSInterfaceProps {
  products: ProductPOS[]
  userId: string
}

export const POSInterface = ({ products, userId }: POSInterfaceProps) => {
  const [cart, setCart] = useState<LocalCartItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isSaleNotesOpen, setIsSaleNotesOpen] = useState(false)
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)

  /* -------------------------------------------------------
     🔍 Filtrar productos
  ------------------------------------------------------- */
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return []
    const term = searchTerm.toLowerCase()

    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.category.name.toLowerCase().includes(term)
      )
      .slice(0, 8)
  }, [searchTerm, products])

  /* -------------------------------------------------------
     🛒 Agregar producto
  ------------------------------------------------------- */
  const addToCart = (
    product: ProductPOS,
    variant?: LocalCartItem["selectedVariant"]
  ) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedVariant?.id === variant?.id
      )

      if (existingIndex >= 0) {
        const newCart = [...prev]
        // por ahora seguimos usando stock global del producto
        if (newCart[existingIndex].quantity < product.stock) {
          newCart[existingIndex].quantity++
        }
        return newCart
      }

      return [...prev, { product, quantity: 1, selectedVariant: variant }]
    })

    setSearchTerm("")
  }

  /* -------------------------------------------------------
     🔄 Actualizar cantidad
  ------------------------------------------------------- */
  const updateQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const newCart = [...prev]
      const item = newCart[index]
      const newQty = item.quantity + delta

      if (newQty <= 0) {
        return newCart.filter((_, i) => i !== index)
      }

      // por ahora limitamos por stock global
      if (newQty <= item.product.stock) {
        item.quantity = newQty
      }

      return newCart
    })
  }

  /* -------------------------------------------------------
     ❌ Eliminar item
  ------------------------------------------------------- */
  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index))
  }

  const clearCart = () => setCart([])

  /* -------------------------------------------------------
     💵 Total
  ------------------------------------------------------- */
  const total = useMemo(() => {
    return cart.reduce((sum, item) => {
      const base = Number(item.product.price)
      const adj = Number(item.selectedVariant?.priceAdjustment ?? 0)
      return sum + (base + adj) * item.quantity
    }, 0)
  }, [cart])

  const totalItems = useMemo(
    () => cart.reduce((s, i) => s + i.quantity, 0),
    [cart]
  )

  /* -------------------------------------------------------
     🔄 Convertir carrito local → carrito global
  ------------------------------------------------------- */
  const cartToGlobal = (): GlobalCartItem[] => {
    return cart.map((item) => {
      const price =
        Number(item.product.price) +
        Number(item.selectedVariant?.priceAdjustment ?? 0)

      return {
        productId: item.product.id,
        name: item.product.name,
        price,
        quantity: item.quantity,
        subtotal: price * item.quantity,
        image: item.product.image ?? null,
        color: item.product.color ?? null,

        // 🔥 campos que exige CartItem en types.ts
        variantId: item.selectedVariant?.id ?? null,
        variantName: item.selectedVariant?.name ?? null,
        variantValue: item.selectedVariant?.value ?? null,
        variantStock: undefined, // opcional por ahora
      }
    })
  }

  /* -------------------------------------------------------
     🏁 Venta completada
  ------------------------------------------------------- */
  const handleSaleComplete = () => {
    setIsSaleNotesOpen(false)
    setPaymentData(null)
    clearCart()
  }

  /* -------------------------------------------------------
     UI
  ------------------------------------------------------- */
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* PANEL DE PRODUCTOS */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar Productos
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o categoría..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
          </CardContent>
        </Card>

        {searchTerm && (
          <ProductSearch
            products={filteredProducts}
            onSelect={addToCart}
            searchTerm={searchTerm}
          />
        )}

        {!searchTerm && cart.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p>Comienza a buscar productos para agregarlos al carrito</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* CARRITO */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Carrito
              </span>

              {cart.length > 0 && (
                <Badge variant="secondary">{totalItems} ítems</Badge>
              )}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {cart.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Carrito vacío
              </p>
            ) : (
              <>
                {/* ITEMS */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {cart.map((item, index) => {
                    const price =
                      Number(item.product.price) +
                      Number(item.selectedVariant?.priceAdjustment ?? 0)

                    return (
                      <div
                        key={`${item.product.id}-${index}`}
                        className="border rounded-lg p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm line-clamp-2">
                              {item.product.name}
                            </p>

                            {item.selectedVariant && (
                              <Badge variant="outline" className="text-xs mt-1">
                                {item.selectedVariant.name}:{" "}
                                {item.selectedVariant.value}
                              </Badge>
                            )}

                            <Badge
                              className="text-xs mt-1"
                              style={{
                                backgroundColor: item.product.category.color,
                              }}
                            >
                              {item.product.category.name}
                            </Badge>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeFromCart(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(index, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>

                            <span className="w-12 text-center font-medium">
                              {item.quantity}
                            </span>

                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(index, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              ${price.toFixed(2)} c/u
                            </p>
                            <p className="font-semibold">
                              {(price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* FOOTER */}
                <div className="border-t pt-4 space-y-4">
                  <div className="flex items-center justify_between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-2xl text-primary">
                      ${total.toFixed(2)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => setIsPaymentDialogOpen(true)}
                    >
                      Continuar
                    </Button>

                    <Button
                      className="w-full bg-transparent"
                      variant="outline"
                      onClick={clearCart}
                    >
                      Limpiar Carrito
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* MODAL 1: MÉTODO DE PAGO */}
      <PaymentDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        cart={cart}
        total={total}
        onPaymentConfirmed={(data) => {
          setPaymentData({
            paymentMethod: data.paymentMethod as PaymentMethod,
            cashAmount: data.cashAmount,
            change: data.change,
          })

          setIsPaymentDialogOpen(false)
          setIsSaleNotesOpen(true)
        }}
      />

      {/* MODAL 2: MESA + OBSERVACIONES */}
      <SaleNotesDialog
        open={isSaleNotesOpen}
        onOpenChange={setIsSaleNotesOpen}
        paymentData={paymentData}
        cart={cartToGlobal()} // ✅ ahora coincide con CartItem
        total={total}
        userId={userId}
        onComplete={handleSaleComplete}
      />
    </div>
  )
}
