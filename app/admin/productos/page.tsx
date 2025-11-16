import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ProductsManager } from "@/components/products-manager"
import { serializePrisma } from "@/lib/serialize"

import type { Product, Category } from "@/types/types"

export default async function ProductosPage() {
  const session = await getServerSession(authOptions)

  // Solo ADMIN accede
  if (!session || session.user.role !== "ADMIN") {
    redirect("/pos")
  }

  // Obtener productos completos
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      include: {
        category: true,
        tax: true,
        stocks: true, // 🔥 stock real por sucursal
        variants: {
          include: {
            stocks: true, // 🔥 stock real por sucursal por variante
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),

    prisma.category.findMany({
      orderBy: { name: "asc" },
    }),
  ])

  // Serializar Decimals / BigInts
  const rawProducts = serializePrisma<any[]>(products)
  const rawCategories = serializePrisma<any[]>(categories)

  // Map a tipo Product global seguro
  const safeProducts: Product[] = rawProducts.map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    costo: Number(p.costo),

    barcode: p.barcode,
    image: p.image,
    color: p.color,

    active: p.active,

    expirationDate: p.expirationDate,
    stockMinimo: p.stockMinimo,
    categoryId: p.categoryId,
    taxId: p.taxId,

    createdAt: p.createdAt,
    updatedAt: p.updatedAt,

    // 🔹 Category correcta
    category: {
      id: p.category.id,
      name: p.category.name,
      color: p.category.color,
      createdAt: p.category.createdAt,
      updatedAt: p.category.updatedAt,
    },

    // 🔹 Tax correcta
    tax: p.tax
      ? {
          id: p.tax.id,
          name: p.tax.name,
          rate: Number(p.tax.rate),
          isDefault: p.tax.isDefault,
        }
      : null,

    // 🔹 Variantes + stock por sucursal
    variants: p.variants?.map((v: any) => ({
      id: v.id,
      productId: v.productId,
      name: v.name,
      value: v.value,
      priceAdjustment: Number(v.priceAdjustment),
      stocks: v.stocks?.map((s: any) => ({
        id: s.id,
        variantId: s.variantId,
        branchId: s.branchId,
        stock: Number(s.stock),
      })) ?? [],
    })) ?? [],

    // 🔥 Stock por sucursal a nivel producto
    stocks: p.stocks?.map((s: any) => ({
      id: s.id,
      productId: s.productId,
      branchId: s.branchId,
      stock: Number(s.stock),
    })) ?? [],
  }))

  const safeCategories: Category[] = rawCategories

  return (
    <div className="container mx-auto px-4 py-6">
      <ProductsManager initialProducts={safeProducts} categories={safeCategories} />
    </div>
  )
}
