"use server"

import { prisma } from "@/lib/prisma"

interface BranchInput {
  id?: string
  name: string
  address?: string | null
  userId: string
}

/**
 * 🏗 Crea o actualiza una sucursal.
 * - Evita duplicados.
 * - Asigna automáticamente la sucursal al usuario si se crea nueva.
 * - Devuelve mensajes claros y específicos.
 */
export async function createOrUpdateBranch(data: BranchInput) {
  if (!data?.name?.trim()) {
    throw new Error("El nombre de la sucursal es obligatorio.")
  }

  try {
    console.log("[🧩 createOrUpdateBranch] Input recibido:", data)
    let branch

    if (data.id) {
      // 🧱 Actualización
      const existing = await prisma.branch.findUnique({
        where: { id: data.id },
      })

      if (!existing) {
        throw new Error("No se encontró la sucursal especificada.")
      }

      // ⚠️ Evita conflicto si otro branch tiene el mismo nombre
      const duplicate = await prisma.branch.findFirst({
        where: {
          name: data.name.trim(),
          NOT: { id: data.id },
        },
      })

      if (duplicate) {
        throw new Error("Ya existe otra sucursal con ese nombre.")
      }

      branch = await prisma.branch.update({
        where: { id: data.id },
        data: {
          name: data.name.trim(),
          address: data.address?.trim() || null,
        },
      })

      console.log("[✅] Sucursal actualizada:", branch.id)
    } else {
      // 🆕 Creación
      const existingByName = await prisma.branch.findUnique({
        where: { name: data.name.trim() },
      })

      if (existingByName) {
        throw new Error("Ya existe una sucursal con ese nombre.")
      }

      branch = await prisma.branch.create({
        data: {
          name: data.name.trim(),
          address: data.address?.trim() || null,
        },
      })

      console.log("[✅] Sucursal creada con ID:", branch.id)

      // 🔗 Asignar al usuario creador (si existe)
      if (data.userId) {
        const user = await prisma.user.findUnique({
          where: { id: data.userId },
        })

        if (user) {
          await prisma.user.update({
            where: { id: data.userId },
            data: { branchId: branch.id },
          })
          console.log(`[🔗] Branch asignada al usuario ${data.userId}`)
        } else {
          console.warn(
            `[⚠️] Usuario ${data.userId} no encontrado. No se asignó branch.`
          )
        }
      }
    }

    return branch
  } catch (error: any) {
    console.error("[❌ createOrUpdateBranch] Error completo:", error)

    // 🔍 Prisma unique constraint (name duplicado)
    if (error.code === "P2002") {
      throw new Error("Ya existe una sucursal con ese nombre.")
    }

    // 🔁 Si ya lanzamos un mensaje claro, reenviarlo
    if (error instanceof Error && error.message) {
      throw new Error(error.message)
    }

    // 🧩 Fallback genérico
    throw new Error("No se pudo guardar la sucursal. Intenta nuevamente.")
  }
}

/**
 * 🔍 Obtiene la lista de sucursales existentes
 * Incluye los usuarios asociados (solo id, nombre, email y rol)
 */
export async function getBranches() {
  try {
    const branches = await prisma.branch.findMany({
      orderBy: { name: "asc" },
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    })

    return branches
  } catch (error) {
    console.error("[❌ getBranches] Error:", error)
    throw new Error("No se pudieron obtener las sucursales.")
  }
}

/**
 * 🗑 Elimina una sucursal (solo si no tiene usuarios ni ventas asociadas)
 */
export async function deleteBranch(id: string) {
  if (!id) throw new Error("El ID de la sucursal es obligatorio.")

  try {
    const [hasUsers, hasSales] = await Promise.all([
      prisma.user.count({ where: { branchId: id } }),
      prisma.sale.count({ where: { branchId: id } }),
    ])

    if (hasUsers > 0 || hasSales > 0) {
      throw new Error(
        "No se puede eliminar la sucursal porque tiene usuarios o ventas asociadas."
      )
    }

    await prisma.branch.delete({ where: { id } })
    return { success: true }
  } catch (error) {
    console.error("[❌ deleteBranch] Error:", error)
    throw new Error("No se pudo eliminar la sucursal.")
  }
}
