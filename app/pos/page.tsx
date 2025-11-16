"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { POSInterface } from "@/components/pos-interface"
import { serializePrisma } from "@/lib/serialize"
import { ProductPOS } from "@/types/types"

export default async function POSPage() {
  const session = await getServerSession(authOptions)

  // 🚫 Redirigir si no hay sesión
  if (!session) redirect("/login")

  /**
   * 📦 Obtener productos
   * ❗ Antes filtrabas: where: { stock: { gt: 0 } }
   * ❌ Ese campo ya NO existe en Product si usás ProductStock.
   * 
   * 👉 Solución correcta:
   *    - Obtener todos los productos activos
   *    - El POS calcula el stock total desde variantStock/productStock
   */
  const products = await prisma.product.findMany({
    where: { active: true },
    include: {
      category: true,
      variants: {
        include: {
          stocks: true, // si usás VariantStock (por sucursal)
        },
      },
      stocks: true, // si usás ProductStock (stock global o por sucursal)
    },
    orderBy: { name: "asc" },
  })

  /**
   * 🔄 Serialización → Decimal a number
   * 📌 safeProducts tendrá exactamente el tipo ProductPOS[]
   */
  const safeProducts = serializePrisma<ProductPOS[]>(products)

  // 🚀 UI
  return (
    <div className="container mx-auto px-4 py-6">
      <POSInterface products={safeProducts} userId={session.user.id} />
    </div>
  )
}
