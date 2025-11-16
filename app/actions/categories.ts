"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const categorySchema = z.object({
  name: z.string().min(1),
  color: z.string(),
})

export async function createCategory(data: z.infer<typeof categorySchema>) {
  const validated = categorySchema.parse(data)

  const category = await prisma.category.create({
    data: validated,
  })

  revalidatePath("/admin/productos")
  return category
}

export async function deleteCategory(id: string) {
  await prisma.category.delete({
    where: { id },
  })

  revalidatePath("/admin/productos")
}
