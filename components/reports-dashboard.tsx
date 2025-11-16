"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DollarSign,
  TrendingUp,
  Package,
  Users,
  ShoppingCart,
  AlertCircle,
  BarChart3,
} from "lucide-react"
import {
  calcularGanancia,
  calcularMargenGanancia,
  formatoMoneda,
} from "@/lib/finance/price-utils"

// ----------------------------
// Tipos
// ----------------------------
export interface Sale {
  id: string
  total: number | string
  paymentMethod: string
  createdAt: string | Date
  user: {
    id: string
    name: string
  }
  items: Array<{
    quantity: number
    price: number | string
    subtotal: number | string
    product: {
      id: string
      name: string
      costo?: number | string
      category: {
        name: string
        color: string
      }
    }
  }>
}

export interface Product {
  id: string
  name: string
  price: number | string
  costo?: number | string
  stock: number | string
  category: {
    name: string
    color: string
  }
}

export interface Category {
  id: string
  name: string
  color: string
  _count: { products: number }
}

export interface User {
  id: string
  name: string
  role: string
  _count: { sales: number }
}

export interface ReportsDashboardProps {
  sales: Sale[]
  products: Product[]
  categories: Category[]
  users: User[]
}

// ----------------------------
// Componente principal
// ----------------------------
export const ReportsDashboard = ({
  sales,
  products,
  categories,
  users,
}: ReportsDashboardProps) => {
  // 💰 Total ingresos
  const totalRevenue = useMemo(() => {
    const total = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0)
    return Number.isFinite(total) ? total : 0
  }, [sales])

  // 💵 Ganancia total estimada (si existe campo costo)
  const totalProfit = useMemo(() => {
    return sales.reduce((sum, sale) => {
      const gananciaVenta = sale.items.reduce((acc, item) => {
        const pv = Number(item.price) || 0
        const pc = Number(item.product.costo ?? 0)
        const qty = Number(item.quantity) || 0
        return acc + calcularGanancia(pv, pc, qty)
      }, 0)
      return sum + gananciaVenta
    }, 0)
  }, [sales])

  const totalProducts = products.length
  const totalCategories = categories.length

  const lowStockProducts = useMemo(
    () => products.filter((p) => Number(p.stock) < 10),
    [products]
  )

  // 🔝 Top productos vendidos
  const topProducts = useMemo(() => {
    const productSales = new Map<
      string,
      { name: string; quantity: number; revenue: number; profit: number }
    >()

    sales.forEach((sale) =>
      sale.items.forEach((item) => {
        const qty = Number(item.quantity) || 0
        const subtotal = Number(item.subtotal) || 0
        const pv = Number(item.price) || 0
        const pc = Number(item.product.costo ?? 0)
        const ganancia = calcularGanancia(pv, pc, qty)

        const existing = productSales.get(item.product.id)
        if (existing) {
          existing.quantity += qty
          existing.revenue += subtotal
          existing.profit += ganancia
        } else {
          productSales.set(item.product.id, {
            name: item.product.name,
            quantity: qty,
            revenue: subtotal,
            profit: ganancia,
          })
        }
      })
    )

    return Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }, [sales])

  // 🏷️ Ventas por categoría
  const salesByCategory = useMemo(() => {
    const categorySales = new Map<
      string,
      { name: string; color: string; revenue: number; profit: number }
    >()

    sales.forEach((sale) =>
      sale.items.forEach((item) => {
        const subtotal = Number(item.subtotal || 0)
        const pv = Number(item.price) || 0
        const pc = Number(item.product.costo ?? 0)
        const qty = Number(item.quantity) || 0
        const ganancia = calcularGanancia(pv, pc, qty)
        const categoryName = item.product.category.name
        const categoryColor = item.product.category.color

        const existing = categorySales.get(categoryName)
        if (existing) {
          existing.revenue += subtotal
          existing.profit += ganancia
        } else {
          categorySales.set(categoryName, {
            name: categoryName,
            color: categoryColor,
            revenue: subtotal,
            profit: ganancia,
          })
        }
      })
    )

    return Array.from(categorySales.values()).sort(
      (a, b) => b.revenue - a.revenue
    )
  }, [sales])

  // 📊 Margen promedio
  const avgMarginPct = useMemo(() => {
    if (totalRevenue === 0) return 0
    const totalCosto = totalRevenue - totalProfit
    return calcularMargenGanancia(totalRevenue, totalCosto)
  }, [totalRevenue, totalProfit])

  // 🧑‍💼 Top vendedores
  const topSellers = useMemo(() => {
    const sellerSales = new Map<
      string,
      { name: string; count: number; revenue: number }
    >()

    sales.forEach((sale) => {
      const total = Number(sale.total || 0)
      const existing = sellerSales.get(sale.user.id)
      if (existing) {
        existing.count += 1
        existing.revenue += total
      } else {
        sellerSales.set(sale.user.id, {
          name: sale.user.name,
          count: 1,
          revenue: total,
        })
      }
    })

    return Array.from(sellerSales.values()).sort(
      (a, b) => b.revenue - a.revenue
    )
  }, [sales])

  // ----------------------------
  // Render
  // ----------------------------
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reportes y Estadísticas</h1>
        <p className="text-muted-foreground">
          Dashboard con métricas del negocio
        </p>
      </div>

      {/* 🧩 Widgets principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Ingresos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatoMoneda(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">{sales.length} ventas realizadas</p>
          </CardContent>
        </Card>

        {/* Ganancia */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganancia Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatoMoneda(totalProfit)}
            </div>
            <p className="text-xs text-muted-foreground">Margen {avgMarginPct.toFixed(1)}%</p>
          </CardContent>
        </Card>

        {/* Ticket promedio */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sales.length > 0 ? formatoMoneda(totalRevenue / sales.length) : "$0.00"}
            </div>
            <p className="text-xs text-muted-foreground">Por transacción</p>
          </CardContent>
        </Card>

        {/* Productos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">{totalCategories} categorías</p>
          </CardContent>
        </Card>

        {/* Stock bajo */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{lowStockProducts.length}</div>
            <p className="text-xs text-muted-foreground">Productos con stock &lt; 10</p>
          </CardContent>
        </Card>
      </div>

      {/* 🔝 Top productos y Ventas por Categoría */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top productos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top 5 Productos Más Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay datos disponibles</p>
            ) : (
              <div className="space-y-4">
                {topProducts.map((p, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{i + 1}. {p.name}</span>
                      <span className="text-sm font-bold text-primary">{formatoMoneda(p.revenue)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div className="bg-primary h-full" style={{ width: `${(p.revenue / topProducts[0].revenue) * 100}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{p.quantity} unidades</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ventas por categoría */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Ventas por Categoría
            </CardTitle>
          </CardHeader>
          <CardContent>
            {salesByCategory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay datos disponibles</p>
            ) : (
              <div className="space-y-3">
                {salesByCategory.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <Badge style={{ backgroundColor: c.color }}>{c.name}</Badge>
                    <span className="font-bold text-primary">{formatoMoneda(c.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 👥 Top vendedores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Rendimiento de Vendedores
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No hay datos disponibles</p>
          ) : (
            <div className="space-y-3">
              {topSellers.map((seller, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-1">
                  <div className="flex justify-between">
                    <span className="font-medium">{seller.name}</span>
                    <span className="font-bold text-primary">{formatoMoneda(seller.revenue)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{seller.count} ventas realizadas</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
