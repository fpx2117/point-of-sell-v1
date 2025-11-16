"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import bcrypt from "bcryptjs"

/* -----------------------------------------------------------
 🧩 1. Schemas de validación con Zod
----------------------------------------------------------- */
const userSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  role: z.enum(["ADMIN", "VENDEDOR"]),
  branchId: z.string().optional().nullable(),
})

const updateUserSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6).optional(),
  role: z.enum(["ADMIN", "VENDEDOR"]),
  branchId: z.string().optional().nullable(),
})

/* -----------------------------------------------------------
 🧱 2. Crear un nuevo usuario
----------------------------------------------------------- */
export async function createUser(data: z.infer<typeof userSchema>) {
  try {
    const validated = userSchema.parse(data)

    // 🔐 Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(validated.password, 10)

    const user = await prisma.user.create({
      data: {
        name: validated.name.trim(),
        email: validated.email.toLowerCase(),
        password: hashedPassword,
        role: validated.role,
        branchId: validated.branchId || null,
      },
    })

    // ✅ Revalidar vista de usuarios solo en éxito
    revalidatePath("/admin/usuarios")
    return user
  } catch (error: any) {
    console.error("[❌ createUser] Error:", error)

    // ⚠️ Manejo de errores Prisma
    if (error.code === "P2002" && error.meta?.target?.includes("email")) {
      throw new Error("Ya existe un usuario registrado con ese correo electrónico.")
    }

    // ⚠️ Manejo de errores de validación
    if (error instanceof z.ZodError) {
      throw new Error(error.errors[0]?.message || "Datos de usuario inválidos.")
    }

    throw new Error("No se pudo crear el usuario. Intenta nuevamente.")
  }
}

/* -----------------------------------------------------------
 🔄 3. Actualizar un usuario existente
----------------------------------------------------------- */
export async function updateUser(id: string, data: z.infer<typeof updateUserSchema>) {
  try {
    const validated = updateUserSchema.parse(data)

    const updateData: Record<string, any> = {
      name: validated.name.trim(),
      email: validated.email.toLowerCase(),
      role: validated.role,
      branchId: validated.branchId || null,
    }

    // Si se envía nueva contraseña → encriptar
    if (validated.password) {
      updateData.password = await bcrypt.hash(validated.password, 10)
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    })

    revalidatePath("/admin/usuarios")
    return user
  } catch (error: any) {
    console.error("[❌ updateUser] Error:", error)

    if (error.code === "P2002" && error.meta?.target?.includes("email")) {
      throw new Error("Ya existe otro usuario con ese correo electrónico.")
    }

    if (error instanceof z.ZodError) {
      throw new Error(error.errors[0]?.message || "Datos inválidos al actualizar el usuario.")
    }

    if (error.code === "P2025") {
      throw new Error("No se encontró el usuario especificado para actualizar.")
    }

    throw new Error("No se pudo actualizar el usuario. Intenta nuevamente.")
  }
}

/* -----------------------------------------------------------
 🗑 4. Eliminar usuario
----------------------------------------------------------- */
export async function deleteUser(id: string) {
  try {
    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) {
      throw new Error("El usuario no existe o ya fue eliminado.")
    }

    await prisma.user.delete({ where: { id } })
    revalidatePath("/admin/usuarios")

    return { success: true }
  } catch (error: any) {
    console.error("[❌ deleteUser] Error:", error)

    if (error.code === "P2025") {
      throw new Error("No se pudo eliminar: el usuario no existe.")
    }

    throw new Error("No se pudo eliminar el usuario. Intenta nuevamente.")
  }
}
