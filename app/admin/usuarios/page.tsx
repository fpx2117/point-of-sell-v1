import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { UsersManager } from "@/components/users-manager"

export default async function UsuariosPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login")
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  })

  return (
    <main className="container mx-auto p-6">
      <UsersManager initialUsers={users} />
    </main>
  )
}
