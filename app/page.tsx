import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Redirigir según el rol del usuario
  if (session.user.role === "ADMIN") {
    redirect("/admin/productos")
  } else {
    redirect("/pos")
  }
}
