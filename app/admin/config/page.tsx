// app/admin/config/page.tsx
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ConfigForm } from "@/components/config-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, CheckCircle2 } from "lucide-react"

export default async function ConfigPage() {
  // ✅ Verifica sesión
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect("/login")
  }

  // ✅ Busca al usuario con su sucursal
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { branch: true },
  })

  const branch = user?.branch

  // 🚫 Si ya tiene una sucursal asignada, muestra información en lugar del formulario
  if (branch) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle>Configuración de Sucursal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">
                Ya tenés una sucursal configurada
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <p>
                <strong>Nombre:</strong> {branch.name}
              </p>
              {branch.address && (
                <p>
                  <strong>Dirección:</strong> {branch.address}
                </p>
              )}
              <p>
                <strong>ID:</strong> {branch.id}
              </p>
            </div>

            <p className="text-muted-foreground text-sm mt-4">
              Si necesitás modificar esta información, contactá al
              administrador del sistema.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 🆕 Si no tiene sucursal → mostrar formulario
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Configuración del Sistema</h1>

      <ConfigForm initialBranch={null} userId={session.user.id} />
    </div>
  )
}
