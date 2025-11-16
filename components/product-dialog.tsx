"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { createProduct, updateProduct, deleteProduct } from "@/app/actions/products"
import { Trash2, Plus, X } from "lucide-react"

interface Category {
  id: string
  name: string
  color: string
}

interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  product?: any | null
  onSaved: () => void
}

export const ProductDialog = ({
  open,
  onOpenChange,
  categories,
  product,
  onSaved
}: ProductDialogProps) => {

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    costo: "",
    barcode: "",
    categoryId: "",
    color: "#10b981",
    stock: "",
    image: "",
  })

  const [variants, setVariants] = useState<
    Array<{ id?: string; name: string; value: string; priceAdjustment: string }>
  >([])

  const [loading, setLoading] = useState(false)

  // ───────────────────────────────────────────────
  // Calcular stock total (si hay variantes)
  // ───────────────────────────────────────────────
  const getTotalStock = (product: any) => {
    if (!product) return 0

    // Si el producto tiene variantes → sumar stock de VariantStock
    if (product.variants?.length > 0) {
      const total = product.variants.reduce((sum: number, variant: any) => {
        const variantStock = variant.stocks?.reduce(
          (acc: number, s: any) => acc + Number(s.stock),
          0
        ) ?? 0

        return sum + variantStock
      }, 0)

      return total
    }

    // Si NO tiene variantes → usar product.stock
    return product.stock ?? 0
  }

  // ───────────────────────────────────────────────
  // Cargar datos cuando se abre el modal
  // ───────────────────────────────────────────────
  useEffect(() => {
    if (product) {
      const totalStock = getTotalStock(product)

      setFormData({
        name: product.name ?? "",
        price: product.price ? product.price.toString() : "",
        costo: product.costo ? product.costo.toString() : "",
        barcode: product.barcode ?? "",
        categoryId: product.category?.id ?? categories[0]?.id ?? "",
        color: product.color ?? "#10b981",
        stock: totalStock.toString(),
        image: product.image ?? "",
      })

      setVariants(
        product.variants?.map((v: any) => ({
          id: v.id,
          name: v.name ?? "",
          value: v.value ?? "",
          priceAdjustment: v.priceAdjustment?.toString() ?? "0",
        })) ?? []
      )

    } else {
      // Reset de formulario
      setFormData({
        name: "",
        price: "",
        costo: "",
        barcode: "",
        categoryId: categories[0]?.id || "",
        color: "#10b981",
        stock: "",
        image: "",
      })

      setVariants([])
    }
  }, [product, categories, open])

  // ───────────────────────────────────────────────
  // Guardar producto
  // ───────────────────────────────────────────────
  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        costo: Number(formData.costo),
        stock: Number(formData.stock),
        variants: variants.map(v => ({
          name: v.name,
          value: v.value,
          priceAdjustment: Number(v.priceAdjustment),
        }))
      }

      if (product) {
        await updateProduct(product.id, payload)
      } else {
        await createProduct(payload)
      }

      onSaved()
      onOpenChange(false)

    } catch (err) {
      console.error("Error saving product:", err)
      alert("Error al guardar")
    } finally {
      setLoading(false)
    }
  }

  // ───────────────────────────────────────────────
  // Eliminar producto
  // ───────────────────────────────────────────────
  const handleDelete = async () => {
    if (!product) return
    if (!confirm("¿Eliminar producto?")) return

    try {
      setLoading(true)
      await deleteProduct(product.id)
      onSaved()
      onOpenChange(false)

    } finally {
      setLoading(false)
    }
  }

  // ───────────────────────────────────────────────
  // Variantes
  // ───────────────────────────────────────────────
  const addVariant = () => {
    setVariants([...variants, { name: "", value: "", priceAdjustment: "0" }])
  }

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index))
  }

  const updateVariant = (index: number, field: string, value: string) => {
    const updated = [...variants]
    updated[index] = { ...updated[index], [field]: value }
    setVariants(updated)
  }

  // ───────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Campos principales */}
          <div className="grid grid-cols-2 gap-4">

            <div className="col-span-2">
              <Label>Nombre</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Precio</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>

            <div>
              <Label>Costo</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.costo}
                onChange={(e) => setFormData({ ...formData, costo: e.target.value })}
              />
            </div>

            <div>
              <Label>Stock Inicial</Label>
              <Input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              />
            </div>

            <div>
              <Label>Código de barras</Label>
              <Input
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              />
            </div>

            <div>
              <Label>Categoría</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>

                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Color</Label>
              <Input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Label>Imagen</Label>
              <Input
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              />
            </div>
          </div>

          {/* Variantes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Variantes</Label>

              <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar
              </Button>
            </div>

            {variants.map((v, index) => (
              <div key={index} className="grid grid-cols-3 gap-2 items-end">
                <Input
                  placeholder="Nombre (Ej: sabor)"
                  value={v.name}
                  onChange={(e) => updateVariant(index, "name", e.target.value)}
                />

                <Input
                  placeholder="Valor (Ej: mango)"
                  value={v.value}
                  onChange={(e) => updateVariant(index, "value", e.target.value)}
                />

                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Ajuste $"
                    value={v.priceAdjustment}
                    onChange={(e) =>
                      updateVariant(index, "priceAdjustment", e.target.value)
                    }
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeVariant(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Acciones */}
          <div className="flex justify-between mt-4">
            {product && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </Button>
            )}

            <div className="ml-auto flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>

              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : product ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
