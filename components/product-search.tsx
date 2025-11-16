"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Plus } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ⬅️ Tipo real centralizado
import { ProductPOS } from "@/types/types"

// 🔒 Tipo seguro para variante
type VariantType = NonNullable<ProductPOS["variants"]>[number]

interface ProductSearchProps {
  products: ProductPOS[]
  onSelect: (product: ProductPOS, variant?: VariantType) => void
  searchTerm: string
}

export const ProductSearch = ({
  products,
  onSelect,
  searchTerm,
}: ProductSearchProps) => {
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string>
  >({})

  const handleAddToCart = (product: ProductPOS) => {
    if (product.variants && product.variants.length > 0) {
      const variantId = selectedVariants[product.id]
      const variant = product.variants?.find((v) => v.id === variantId) ?? undefined
      onSelect(product, variant)
    } else {
      onSelect(product)
    }
  }

  // 🟦 Si no hay productos encontrados
  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            No se encontraron productos para “{searchTerm}”
          </p>
        </CardContent>
      </Card>
    )
  }

  // 🟩 Render principal
  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {products.map((product) => {
            const variantSelected = selectedVariants[product.id]
            const selectedVariant =
              product.variants?.find((v) => v.id === variantSelected) ?? null

            // 🔢 Conversión segura SIEMPRE
            const basePrice = Number(product.price) || 0
            const costo = Number(product.costo) || 0
            const ajuste = Number(selectedVariant?.priceAdjustment ?? 0)

            const precioFinal = basePrice + ajuste
            const ganancia = precioFinal - costo

            return (
              <div
                key={product.id}
                className="border rounded-lg p-3 flex gap-3 hover:bg-muted/50 transition-colors"
              >
                {/* 📷 Imagen */}
                <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: product.color }}
                    >
                      <Package className="h-8 w-8 text-white opacity-50" />
                    </div>
                  )}
                </div>

                {/* 📝 Información */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div>
                    <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>

                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        className="text-xs"
                        style={{ backgroundColor: product.category.color }}
                      >
                        {product.category.name}
                      </Badge>

                      <span className="text-xs text-muted-foreground">
                        Stock: {product.stock}
                      </span>
                    </div>
                  </div>

                  {/* 🟨 Variantes */}
                  {product.variants && product.variants.length > 0 && (
                    <Select
                      value={selectedVariants[product.id]}
                      onValueChange={(value) =>
                        setSelectedVariants((prev) => ({
                          ...prev,
                          [product.id]: value,
                        }))
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Seleccionar variante" />
                      </SelectTrigger>

                      <SelectContent>
                        {product.variants.map((variant) => (
                          <SelectItem key={variant.id} value={variant.id}>
                            {variant.name}: {variant.value} (
                            {Number(variant.priceAdjustment) > 0 ? "+" : ""}
                            {Number(variant.priceAdjustment).toFixed(2)}$)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* 💰 Precio + Acción */}
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-lg font-bold text-primary block">
                        ${precioFinal.toFixed(2)}
                      </span>

                      <span className="text-[11px] text-muted-foreground">
                        Ganancia: ${ganancia.toFixed(2)}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleAddToCart(product)}
                      className="gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Agregar
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
