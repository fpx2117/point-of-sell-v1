import { LoginForm } from "@/components/login-form"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function LoginPage() {
  const session = await getServerSession(authOptions)

  if (session) {
    if (session.user.role === "ADMIN") {
      redirect("/admin/productos")
    } else {
      redirect("/pos")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <LoginForm />
    </div>
  )
}
