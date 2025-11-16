"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InventoryAdjustDialog } from "@/components/inventory-adjust-dialog"
import { Package, Search, TrendingUp, TrendingDown } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Product {
  id: string
  name: string
  stock: number
  category: {
    name: string
    color: string
  }
}

interface Movement {
  id: string
  type: string
  quantity: number
  reason: string | null
  createdAt: Date
  product: {
    id: string
    name: string
    category: {
      name: string
      color: string
    }
  }
  user: {
    name: string
  }
}

interface InventoryManagerProps {
  products: Product[]
  movements: Movement[]
}

export const InventoryManager = ({ products, movements }: InventoryManagerProps) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const filteredProducts = products.filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleAdjust = (product: Product) => {
    setSelectedProduct(product)
    setIsAdjustDialogOpen(true)
  }

  const lowStockProducts = products.filter((p) => p.stock < 10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Inventario</h1>
        <p className="text-muted-foreground">Ajusta el stock de productos y visualiza movimientos</p>
      </div>

      {lowStockProducts.length > 0 && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="font-semibold text-destructive">
              {lowStockProducts.length} producto(s) con stock bajo (menos de 10 unidades)
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="productos">
        <TabsList>
          <TabsTrigger value="productos">Productos</TabsTrigger>
          <TabsTrigger value="movimientos">Historial de Movimientos</TabsTrigger>
        </TabsList>

        <TabsContent value="productos" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid gap-3">
            {filteredProducts.map((product) => (
              <Card key={product.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{product.name}</h3>
                        <Badge style={{ backgroundColor: product.category.color }} className="text-xs">
                          {product.category.name}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Stock actual</p>
                        <p className={`text-2xl font-bold ${product.stock < 10 ? "text-destructive" : ""}`}>
                          {product.stock}
                        </p>
                      </div>
                      <Button onClick={() => handleAdjust(product)}>Ajustar</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="movimientos" className="space-y-4">
          <div className="grid gap-3">
            {movements.map((movement) => (
              <Card key={movement.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          movement.type === "IN" ? "bg-green-100" : "bg-red-100"
                        }`}
                      >
                        {movement.type === "IN" ? (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{movement.product.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {movement.reason || (movement.type === "IN" ? "Entrada" : "Venta")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-bold ${movement.type === "IN" ? "text-green-600" : "text-red-600"}`}>
                        {movement.type === "IN" ? "+" : "-"}
                        {movement.quantity}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(movement.createdAt), "dd MMM yyyy HH:mm", { locale: es })}
                      </p>
                      <p className="text-xs text-muted-foreground">{movement.user.name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <InventoryAdjustDialog
        open={isAdjustDialogOpen}
        onOpenChange={setIsAdjustDialogOpen}
        product={selectedProduct}
        onSaved={() => {
          setIsAdjustDialogOpen(false)
          window.location.reload()
        }}
      />
    </div>
  )
}
