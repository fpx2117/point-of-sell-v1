"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Package, Trash2, RotateCcw } from "lucide-react"
import Image from "next/image"

interface ProductCardProps {
  product: {
    id: string
    name: string
    price: number
    costo: number
    barcode: string | null
    image: string | null
    color: string
    active?: boolean
    stockMinimo: number | null

    /** stock por sucursal */
    stocks?: Array<{ branchId: string; stock: number }>

    category: {
      name: string
      color: string
    }

    variants: Array<{
      id: string
      name: string
      value: string
      priceAdjustment: number
      stocks?: Array<{ branchId: string; stock: number }>
    }>
  }

  onEdit: () => void
  onDelete: () => void
  onRestore?: () => void
  showDeleted?: boolean
}

export const ProductCard = ({
  product,
  onEdit,
  onDelete,
  onRestore,
  showDeleted = false,
}: ProductCardProps) => {

  const hasVariants = product.variants.length > 0

  /** 🟩 STOCK GLOBAL
   * Si hay variantes → sumar stock de todas las variantes
   * Si NO hay variantes → usar el stock "general" del producto
   */
  const totalStock = hasVariants
    ? product.variants.reduce((acc, v) => {
        const vstocks = v.stocks ?? []
        return acc + vstocks.reduce((s, st) => s + st.stock, 0)
      }, 0)
    : (product.stocks ?? []).reduce((sum, s) => sum + s.stock, 0)

  const lowStock = totalStock < (product.stockMinimo ?? 10)

  const ganancia = product.price - product.costo
  const margen =
    product.costo > 0 ? ((ganancia / product.costo) * 100).toFixed(1) : "0"

  return (
    <Card
      className={`overflow-hidden hover:shadow-lg transition-shadow relative ${
        product.active === false ? "opacity-60" : ""
      }`}
    >
      {product.active === false && (
        <Badge className="absolute top-2 left-2 z-10" variant="destructive">
          INACTIVO
        </Badge>
      )}

      <div className="aspect-square relative bg-muted">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: product.color }}
          >
            <Package className="h-16 w-16 text-white opacity-50" />
          </div>
        )}

        <div className="absolute top-2 right-2">
          <Badge variant={lowStock ? "destructive" : "secondary"}>
            Stock: {totalStock}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="font-semibold line-clamp-2">{product.name}</h3>

          <div className="space-y-1">
            <p className="text-2xl font-bold text-primary">
              ${product.price.toFixed(2)}
            </p>

            <p className="text-sm text-muted-foreground">
              Costo: ${product.costo.toFixed(2)}
            </p>

            <p className="text-xs text-emerald-600 font-semibold">
              Ganancia: ${ganancia.toFixed(2)} ({margen}%)
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge style={{ backgroundColor: product.category.color }}>
              {product.category.name}
            </Badge>

            {product.barcode && (
              <span className="text-xs text-muted-foreground">
                {product.barcode}
              </span>
            )}
          </div>

          {hasVariants && (
            <div className="mt-2 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">
                Variantes ({product.variants.length}):
              </p>

              <div className="space-y-1">
                {product.variants.map((variant) => {
                  const variantStock = (variant.stocks ?? []).reduce(
                    (sum, s) => sum + s.stock,
                    0
                  )

                  return (
                    <div
                      key={variant.id}
                      className="text-xs flex justify-between border p-1 rounded bg-muted/40"
                    >
                      <span>{variant.value}</span>
                      <span className="text-muted-foreground">
                        Stock: {variantStock}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <div className="flex gap-2 w-full">
          {!showDeleted ? (
            <>
              <Button
                onClick={onEdit}
                variant="outline"
                size="sm"
                className="flex-1 gap-2 bg-transparent"
              >
                <Edit className="h-4 w-4" /> Editar
              </Button>

              <Button
                onClick={onDelete}
                variant="destructive"
                size="sm"
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={onRestore}
                variant="outline"
                size="sm"
                className="flex-1 gap-2 bg-transparent"
              >
                <RotateCcw className="h-4 w-4" /> Restaurar
              </Button>

              <Button
                onClick={onDelete}
                variant="destructive"
                size="sm"
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
