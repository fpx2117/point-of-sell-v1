"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

/* ---------------------------------------------------------
 🧾 ZOD
--------------------------------------------------------- */

const saleSchema = z.object({
  userId: z.string(),

  items: z.array(
    z.object({
      productId: z.string(),
      variantId: z.string().nullable().optional(),
      quantity: z.number().int().positive(),
      price: z.number().positive(),
    })
  ),

  total: z.number().positive(),
  paymentMethod: z.enum(["EFECTIVO", "TARJETA", "TRANSFERENCIA"]),
  cashAmount: z.number().nullable().optional(),
  change: z.number().nullable().optional(),

  mesa: z.boolean(),
  mesaNumber: z.string().nullable().optional(),
  observaciones: z.string().nullable().optional(),
}).superRefine((data, ctx) => {
  if (
    data.paymentMethod === "EFECTIVO" &&
    (!data.cashAmount || data.cashAmount <= 0)
  ) {
    ctx.addIssue({
      path: ["cashAmount"],
      code: "custom",
      message: "Debe indicar el monto recibido en efectivo.",
    })
  }

  if (data.mesa && (!data.mesaNumber || data.mesaNumber.trim() === "")) {
    ctx.addIssue({
      path: ["mesaNumber"],
      code: "custom",
      message: "Debe ingresar un número de mesa.",
    })
  }
})

/* ---------------------------------------------------------
 🔥 HELPER DEFINITIVO: SERIALIZACIÓN 100% PLAIN OBJECT
--------------------------------------------------------- */

function serialize(obj: any) {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) => {
      if (value?.constructor?.name === "Decimal") {
        return Number(value)
      }
      return value
    })
  )
}

/* ---------------------------------------------------------
 🧾 PROCESS SALE — FINAL FIXED VERSION
--------------------------------------------------------- */

export async function processSale(raw: z.infer<typeof saleSchema>) {
  console.log("🔵 Server Action → Recibiendo venta...", raw)

  const data = saleSchema.parse(raw)

  const user = await prisma.user.findUnique({
    where: { id: data.userId },
    select: { branchId: true },
  })

  if (!user?.branchId) throw new Error("El usuario no tiene sucursal.")
  const branchId = user.branchId

  /* ---------------------------------------------------------
     💳 TRANSACCIÓN COMPLETA
  --------------------------------------------------------- */

  const sale = await prisma.$transaction(async (tx) => {
    const newSale = await tx.sale.create({
      data: {
        userId: data.userId,
        branchId,
        total: data.total,
        paymentMethod: data.paymentMethod,
        cashAmount: data.cashAmount ?? null,
        change: data.change ?? null,
        mesa: data.mesa,
        mesaNumber: data.mesa ? data.mesaNumber : null,
        observaciones: data.observaciones ?? null,

        items: {
          create: data.items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId ?? null,
            quantity: i.quantity,
            price: i.price,
            subtotal: i.price * i.quantity,
          })),
        },
      },

      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    })

    // 🔻 stock
    for (const item of data.items) {
      if (item.variantId) {
        const vs = await tx.variantStock.findFirst({
          where: { variantId: item.variantId, branchId },
        })
        if (!vs) throw new Error("No hay stock para la variante.")
        if (vs.stock < item.quantity) throw new Error("Stock insuficiente.")

        await tx.variantStock.update({
          where: { id: vs.id },
          data: { stock: { decrement: item.quantity } },
        })

        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            variantId: item.variantId,
            type: "SALIDA",
            quantity: item.quantity,
            reason: `Venta #${newSale.id} (variante)`,
            userId: data.userId,
            branchId,
          },
        })
        continue
      }

      const ps = await tx.productStock.findFirst({
        where: { productId: item.productId, branchId },
      })
      if (!ps) throw new Error("No hay stock para el producto.")
      if (ps.stock < item.quantity) throw new Error("Stock insuficiente.")

      await tx.productStock.update({
        where: { id: ps.id },
        data: { stock: { decrement: item.quantity } },
      })

      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          type: "SALIDA",
          quantity: item.quantity,
          reason: `Venta #${newSale.id}`,
          userId: data.userId,
          branchId,
        },
      })
    }

    return newSale
  })

  /* ---------------------------------------------------------
     🟩 SERIALIZACIÓN FINAL — FIX DEFINITIVO
  --------------------------------------------------------- */

  const plainSale = serialize(sale)

  console.log("✅ Venta procesada:", plainSale.id)

  revalidatePath("/pos")
  revalidatePath("/historial")
  revalidatePath("/admin/productos")

  return plainSale
}
