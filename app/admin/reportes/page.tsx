import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ReportsDashboard } from "@/components/reports-dashboard"
import { serializePrisma } from "@/lib/serialize" // ✅ Usamos la función global

// Tipos "plain" idénticos a los que espera el componente cliente
type PlainSale = {
  id: string
  total: number
  paymentMethod: string
  createdAt: string // ya no usamos Date aquí
  user: { id: string; name: string }
  items: Array<{
    quantity: number
    price: number
    subtotal: number
    product: {
      id: string
      name: string
      category: { name: string; color: string }
    }
  }>
}

type PlainProduct = {
  id: string
  name: string
  price: number
  stock: number
  category: { name: string; color: string }
}

type PlainCategory = {
  id: string
  name: string
  color: string
  _count: { products: number }
}

type PlainUser = {
  id: string
  name: string
  role: string
  _count: { sales: number }
}

export default async function ReportesPage() {
  const session = await getServerSession(authOptions)

  // 🚫 Protección de acceso
  if (!session || session.user.role !== "ADMIN") {
    redirect("/pos")
  }

  // 🧩 Consultas Prisma paralelas
  const [sales, products, categories, users] = await Promise.all([
    prisma.sale.findMany({
      include: {
        items: { include: { product: { include: { category: true } } } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      include: { category: true },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        role: true,
        _count: { select: { sales: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  // 🧼 Serialización segura (Decimal → number, BigInt → number, Date → string)
  const safeSales = serializePrisma<PlainSale[]>(sales)
  const safeProducts = serializePrisma<PlainProduct[]>(products)
  const safeCategories = serializePrisma<PlainCategory[]>(categories)
  const safeUsers = serializePrisma<PlainUser[]>(users)

  // 🚀 Render final del dashboard
  return (
    <div className="container mx-auto px-4 py-6">
      <ReportsDashboard
        sales={safeSales}
        products={safeProducts}
        categories={safeCategories}
        users={safeUsers}
      />
    </div>
  )
}
