import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SalesHistory } from "@/components/sales-history";
import { serializePrisma } from "@/lib/serialize";

import type { Sale, SaleItem, Product, AppUser, ProductVariant } from "@/types/types";

export default async function HistorialPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const salesFromDb = await prisma.sale.findMany({
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true, active: true, branchId: true },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              costo: true,
              image: true,
              color: true,
              barcode: true,
              expirationDate: true,
              stockMinimo: true,
              taxId: true,
              category: { select: { id: true, name: true, color: true } },
            },
          },
          variant: {
            select: {
              id: true,
              name: true,
              value: true,
              priceAdjustment: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const data = serializePrisma(salesFromDb) as any[];

  const safeSales: Sale[] = data.map((s: any): Sale => ({
    id: s.id,
    userId: s.userId,
    branchId: s.branchId,

    total: Number(s.total),
    paymentMethod: s.paymentMethod,
    cashAmount: s.cashAmount ? Number(s.cashAmount) : null,
    change: s.change ? Number(s.change) : null,

    mesa: s.mesa,
    mesaNumber: s.mesaNumber ?? null,
    observaciones: s.observaciones ?? null,
    createdAt: String(s.createdAt),

    user: s.user
      ? {
          id: s.user.id,
          name: s.user.name,
          email: s.user.email,
          role: s.user.role,
          active: s.user.active,
          branchId: s.user.branchId ?? undefined,
        }
      : undefined,

    items: s.items.map(
      (i: any): SaleItem => ({
        id: i.id,
        saleId: i.saleId,
        productId: i.productId,
        variantId: i.variantId ?? undefined,
        quantity: i.quantity,
        price: Number(i.price),
        subtotal: Number(i.subtotal),

        /* ---------- PRODUCT ---------- */
        product: i.product
          ? ({
              id: i.product.id,
              name: i.product.name,
              price: Number(i.product.price),
              costo: Number(i.product.costo),
              barcode: i.product.barcode ?? undefined,
              image: i.product.image ?? undefined,
              color: i.product.color,
              categoryId: i.product.category.id,
              expirationDate: i.product.expirationDate ?? null,
              stockMinimo: i.product.stockMinimo ?? null,
              taxId: i.product.taxId ?? undefined,

              /* campos obligatorios según types.ts */
              active: true,
              createdAt: "",
              updatedAt: "",
              variants: [],
              stocks: [],

              category: {
                id: i.product.category.id,
                name: i.product.category.name,
                color: i.product.category.color,
              },
            } as Product)
          : undefined,

        /* ---------- VARIANT ---------- */
        variant: i.variant
          ? ({
              id: i.variant.id,
              productId: i.productId,
              name: i.variant.name,
              value: i.variant.value,
              priceAdjustment: Number(i.variant.priceAdjustment),

              /* requerido por tu type ProductVariant */
              stocks: [],
            } as ProductVariant)
          : undefined,
      })
    ),
  }));

  return (
    <div className="container mx-auto px-4 py-6">
      <SalesHistory sales={safeSales} userRole={session.user.role} />
    </div>
  );
}
