import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { InventoryManager } from "@/components/inventory-manager"
import { serializePrisma } from "@/lib/serialize"

// 🔹 Tipos planos esperados por el cliente
type PlainProduct = {
  id: string
  name: string
  price: number
  stock: number
  barcode: string | null
  color: string
  active: boolean
  expirationDate: string | null
  stockMinimo: number | null
  category: {
    id: string
    name: string
    color: string
  }
}

type PlainMovement = {
  id: string
  type: string
  quantity: number
  reason: string | null
  createdAt: string
  product: PlainProduct
  user: {
    id: string
    name: string
    role: string
  }
}

export default async function InventarioPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login")
  }

  const [products, movements] = await Promise.all([
    prisma.product.findMany({
      include: { category: true },
      orderBy: { name: "asc" },
    }),

    prisma.inventoryMovement.findMany({
      include: {
        product: { include: { category: true } },
        user: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ])

  // Serialización segura
  const safeProducts = serializePrisma<PlainProduct[]>(products)

  // 🔥 Convertir createdAt a Date (lo que espera el componente)
  const safeMovements: any[] = serializePrisma<PlainMovement[]>(movements).map((m) => ({
    ...m,
    createdAt: new Date(m.createdAt),
  }))

  return (
    <main className="container mx-auto p-6">
      <InventoryManager products={safeProducts} movements={safeMovements} />
    </main>
  )
}
