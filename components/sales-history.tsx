"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

import {
  Search,
  Calendar,
  DollarSign,
  ShoppingBag,
  User,
  CreditCard,
  UtensilsCrossed
} from "lucide-react"

import { SaleDetail } from "@/components/sale-detail"
import type { Sale } from "@/types/types"

interface SalesHistoryProps {
  sales: Sale[]
  userRole: string
}

export const SalesHistory = ({ sales, userRole }: SalesHistoryProps) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [paymentFilter, setPaymentFilter] =
    useState<"all" | Sale["paymentMethod"]>("all")

  const [productFilter, setProductFilter] = useState("all")
  const [variantFilter, setVariantFilter] = useState("all")

  // 🆕 FILTRO DE MESAS
  const [tableFilter, setTableFilter] =
    useState<"all" | "with_table" | "without_table">("all")

  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)

  /* -------------------------------------------------------
      📌 Productos disponibles según ventas reales
  ------------------------------------------------------- */
  const availableProducts = useMemo(() => {
    const setProd = new Set<string>()

    sales.forEach((sale) =>
      sale.items.forEach((item) => {
        if (item.product?.name) {
          setProd.add(item.product.name)
        }
      })
    )

    return Array.from(setProd)
  }, [sales])

  /* -------------------------------------------------------
      🔍 Filtro principal
  ------------------------------------------------------- */
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const matchesSearch =
        sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)

      const matchesPayment =
        paymentFilter === "all" || sale.paymentMethod === paymentFilter

      const matchesProduct =
        productFilter === "all" ||
        sale.items.some(
          (item) => item.product?.name === productFilter
        )

      const matchesVariant =
        variantFilter === "all" ||
        sale.items.some(
          (item) => item.variant?.value === variantFilter
        )

      // 🆕 FILTRO DE MESAS
      const matchesTable =
        tableFilter === "all"
          ? true
          : tableFilter === "with_table"
          ? sale.mesa === true
          : sale.mesa !== true

      return (
        matchesSearch &&
        matchesPayment &&
        matchesProduct &&
        matchesVariant &&
        matchesTable
      )
    })
  }, [sales, searchTerm, paymentFilter, productFilter, variantFilter, tableFilter])

  /* -------------------------------------------------------
      📌 Variantes SOLO del PRODUCTO seleccionado
  ------------------------------------------------------- */
  const availableVariants = useMemo(() => {
    if (productFilter === "all") return []

    const setVar = new Set<string>()

    sales.forEach((sale) =>
      sale.items.forEach((item) => {
        if (item.product?.name === productFilter && item.variant?.value) {
          setVar.add(item.variant.value)
        }
      })
    )

    return Array.from(setVar)
  }, [sales, productFilter])

  /* -------------------------------------------------------
      ⚡ Métricas
  ------------------------------------------------------- */
  const totalRevenue = useMemo(
    () => filteredSales.reduce((sum, sale) => sum + sale.total, 0),
    [filteredSales]
  )

  const totalSales = filteredSales.length

  const paymentMethods = useMemo(() => {
    const methods = { EFECTIVO: 0, TARJETA: 0, TRANSFERENCIA: 0 }

    filteredSales.forEach((sale) => {
      methods[sale.paymentMethod]++
    })

    return methods
  }, [filteredSales])

  /* -------------------------------------------------------
      📊 KPI: Ventas por variante del producto elegido
  ------------------------------------------------------- */
  const variantStats = useMemo(() => {
    if (variantFilter === "all" || productFilter === "all") return null

    let count = 0
    let total = 0

    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (
          item.product?.name === productFilter &&
          item.variant?.value === variantFilter
        ) {
          count++
          total += item.price * item.quantity
        }
      })
    })

    return { count, total }
  }, [filteredSales, productFilter, variantFilter])

  /* -------------------------------------------------------
      Helpers UI
  ------------------------------------------------------- */
  const getPaymentIcon = (method: Sale["paymentMethod"]) => {
    switch (method) {
      case "EFECTIVO":
        return <DollarSign className="h-4 w-4" />
      case "TARJETA":
      case "TRANSFERENCIA":
        return <CreditCard className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  const getPaymentColor = (method: Sale["paymentMethod"]) => {
    switch (method) {
      case "EFECTIVO":
        return "bg-green-600"
      case "TARJETA":
        return "bg-blue-600"
      case "TRANSFERENCIA":
        return "bg-purple-600"
      default:
        return "bg-gray-600"
    }
  }

  /* -------------------------------------------------------
      Render
  ------------------------------------------------------- */
  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold">Historial de Ventas</h1>
        <p className="text-muted-foreground">Consulta todas las transacciones realizadas</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

        {/* Sales */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSales}</div>
          </CardContent>
        </Card>

        {/* Income */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        {/* Ticket */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalSales > 0 ? (totalRevenue / totalSales).toFixed(2) : "0.00"}
            </div>
          </CardContent>
        </Card>

        {/* Método Popular */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Método Popular</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {paymentMethods.EFECTIVO >= paymentMethods.TARJETA &&
              paymentMethods.EFECTIVO >= paymentMethods.TRANSFERENCIA
                ? "Efectivo"
                : paymentMethods.TARJETA >= paymentMethods.TRANSFERENCIA
                ? "Tarjeta"
                : "Transferencia"}
            </div>
          </CardContent>
        </Card>

        {/* KPI variante */}
        {variantStats && (
          <Card className="border-primary">
            <CardHeader><CardTitle className="text-sm">Ventas de variante</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{variantStats.count}</div>
              <p className="text-xs">Total: ${variantStats.total.toFixed(2)}</p>
            </CardContent>
          </Card>
        )}

      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

            {/* Buscar */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ID o vendedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Producto */}
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger><SelectValue placeholder="Producto" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {availableProducts.map((product) => (
                  <SelectItem key={product} value={product}>
                    {product}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Variantes */}
            <Select
              value={variantFilter}
              onValueChange={setVariantFilter}
              disabled={productFilter === "all"}
            >
              <SelectTrigger><SelectValue placeholder="Variante" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {availableVariants.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 🆕 Filtro de Mesas */}
            <Select
              value={tableFilter}
              onValueChange={(v) =>
                setTableFilter(v as "all" | "with_table" | "without_table")
              }
            >
              <SelectTrigger><SelectValue placeholder="Mesas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="with_table">Con mesa</SelectItem>
                <SelectItem value="without_table">Sin mesa</SelectItem>
              </SelectContent>
            </Select>

          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card>
        <CardHeader>
          <CardTitle>Transacciones ({filteredSales.length})</CardTitle>
        </CardHeader>

        <CardContent>
          {filteredSales.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingBag className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p>No se encontraron ventas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSales.map((sale) => (
                <div
                  key={sale.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedSale(sale)}
                >
                  <div className="flex items-start justify-between gap-4">

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          #{sale.id.slice(0, 8)}
                        </code>

                        <Badge className={getPaymentColor(sale.paymentMethod)}>
                          <span className="flex items-center gap-1">
                            {getPaymentIcon(sale.paymentMethod)}
                            {sale.paymentMethod}
                          </span>
                        </Badge>

                        {sale.mesa && (
                          <Badge variant="outline" className="gap-1">
                            <UtensilsCrossed className="h-3 w-3" />
                            Mesa {sale.mesaNumber}
                          </Badge>
                        )}

                        {userRole === "ADMIN" && sale.user && (
                          <Badge variant="outline" className="gap-1">
                            <User className="h-3 w-3" />
                            {sale.user.name}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(sale.createdAt).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>

                        <span className="flex items-center gap-1">
                          <ShoppingBag className="h-3 w-3" />
                          {sale.items.length} producto(s)
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        ${sale.total.toFixed(2)}
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <SaleDetail sale={selectedSale} onClose={() => setSelectedSale(null)} />
    </div>
  )
}
