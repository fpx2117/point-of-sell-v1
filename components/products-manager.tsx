"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Trash2, RefreshCcw } from "lucide-react"
import { ProductCard } from "@/components/product-card"
import { ProductDialog } from "@/components/product-dialog"
import { CategoryDialog } from "@/components/category-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import type { Product, Category } from "@/types/types"

interface ProductsManagerProps {
  initialProducts: Product[]
  categories: Category[]
}

export const ProductsManager = ({
  initialProducts,
  categories,
}: ProductsManagerProps) => {

  const [products, setProducts] = useState<Product[]>(initialProducts)

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // 🗑 Papelera
  const [showDeleted, setShowDeleted] = useState(false)

  /* -------------------------------------------------------------
     🔍 FILTRO DE PRODUCTOS
  ------------------------------------------------------------- */
  const filteredProducts = products
    .filter((p) => (showDeleted ? p.active === false : p.active !== false))
    .filter((product) => {
      const search = searchTerm.toLowerCase()

      const matchesSearch =
        product.name.toLowerCase().includes(search) ||
        product.barcode?.toLowerCase().includes(search) ||
        product.variants?.some((v) =>
          v.value.toLowerCase().includes(search)
        )

      const matchesCategory =
        selectedCategory === "all" || product.categoryId === selectedCategory

      return matchesSearch && matchesCategory
    })

  /* -------------------------------------------------------------
     📊 Contador por categoría
  ------------------------------------------------------------- */
  const countByCategory = (categoryId: string) =>
    products.filter((p) => p.categoryId === categoryId && p.active !== false)
      .length

  /* -------------------------------------------------------------
     💾 Cuando guardamos un producto
  ------------------------------------------------------------- */
  const handleProductSaved = () => {
    setIsProductDialogOpen(false)
    setEditingProduct(null)
    window.location.reload()
  }

  /* -------------------------------------------------------------
     ✏ Editar
  ------------------------------------------------------------- */
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setIsProductDialogOpen(true)
  }

  /* -------------------------------------------------------------
     ➕ Nuevo producto
  ------------------------------------------------------------- */
  const handleNewProduct = () => {
    setEditingProduct(null)
    setIsProductDialogOpen(true)
  }

  /* -------------------------------------------------------------
     🗑 Soft Delete
  ------------------------------------------------------------- */
  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`¿Eliminar "${product.name}"?`)) return

    try {
      const { deleteProduct } = await import("@/app/actions/products")
      await deleteProduct(product.id)

      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, active: false } : p
        )
      )
    } catch (err) {
      console.error(err)
      alert("Error eliminando el producto")
    }
  }

  /* -------------------------------------------------------------
     ♻ Restaurar producto
  ------------------------------------------------------------- */
  const handleRestoreProduct = async (product: Product) => {
    try {
      const { restoreProduct } = await import("@/app/actions/products")
      await restoreProduct(product.id)

      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, active: true } : p
        )
      )
    } catch (err) {
      console.error(err)
      alert("Error restaurando el producto")
    }
  }

  /* -------------------------------------------------------------
     RENDER
  ------------------------------------------------------------- */
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {showDeleted ? "Papelera" : "Gestión de Productos"}
          </h1>
          <p className="text-muted-foreground">
            {showDeleted
              ? "Productos desactivados (soft delete)"
              : "Administra inventario, categorías y variantes"}
          </p>
        </div>

        <div className="flex gap-2">
          {!showDeleted && (
            <>
              <Button variant="outline" onClick={() => setIsCategoryDialogOpen(true)}>
                Categorías
              </Button>

              <Button onClick={handleNewProduct} className="gap-2">
                <Plus className="h-4 w-4" /> Nuevo Producto
              </Button>
            </>
          )}

          <Button
            variant={showDeleted ? "destructive" : "outline"}
            onClick={() => setShowDeleted(!showDeleted)}
            className="gap-2"
          >
            {showDeleted ? (
              <>
                <RefreshCcw className="h-4 w-4" /> Volver
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" /> Papelera
              </>
            )}
          </Button>
        </div>
      </div>

      {/* BUSCADOR + TABS */}
      {!showDeleted && (
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, código o variante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <TabsList>
              <TabsTrigger value="all">
                Todos ({products.filter((p) => p.active !== false).length})
              </TabsTrigger>

              {categories.map((cat) => (
                <TabsTrigger key={cat.id} value={cat.id}>
                  {cat.name} ({countByCategory(cat.id)})
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* CONTENIDO */}
          <TabsContent value={selectedCategory} className="mt-6">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No se encontraron productos
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onEdit={() => handleEditProduct(product)}
                    onDelete={() => handleDeleteProduct(product)}
                    onRestore={() => handleRestoreProduct(product)}
                    showDeleted={false}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* PAPELERA */}
      {showDeleted && (
        <div className="mt-6">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No hay productos eliminados
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onEdit={() => handleEditProduct(product)}
                  onDelete={() => handleDeleteProduct(product)}
                  onRestore={() => handleRestoreProduct(product)}
                  showDeleted={true}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* DIALOGS */}
      <ProductDialog
        open={isProductDialogOpen}
        onOpenChange={setIsProductDialogOpen}
        categories={categories}
        product={editingProduct}
        onSaved={handleProductSaved}
      />

      <CategoryDialog
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
        categories={categories}
      />
    </div>
  )
}
