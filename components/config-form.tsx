"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, Building2, MapPin, Loader2 } from "lucide-react"

// 🔗 Server action
import { createOrUpdateBranch } from "@/app/actions/branch"

type BranchInput = {
  id?: string
  name: string
  address?: string | null
}

interface ConfigFormProps {
  initialBranch: BranchInput | null
  userId: string
}

export function ConfigForm({ initialBranch, userId }: ConfigFormProps) {
  const [form, setForm] = useState<BranchInput>({
    id: initialBranch?.id,
    name: initialBranch?.name ?? "",
    address: initialBranch?.address ?? "",
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState<null | "ok" | "error">(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    setForm({
      id: initialBranch?.id,
      name: initialBranch?.name ?? "",
      address: initialBranch?.address ?? "",
    })
  }, [initialBranch])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name.trim()) {
      setSaved("error")
      setErrorMessage("El nombre de la sucursal es obligatorio.")
      return
    }

    try {
      setLoading(true)
      setSaved(null)
      setErrorMessage(null)

      await createOrUpdateBranch({
        id: form.id,
        name: form.name.trim(),
        address: form.address?.trim() || null,
        userId,
      })

      setSaved("ok")
    } catch (err: any) {
      console.error("[ConfigForm] Error:", err)
      setSaved("error")

      // Extrae el mensaje legible del backend
      if (err instanceof Error && err.message) {
        setErrorMessage(err.message)
      } else {
        setErrorMessage("Hubo un problema al guardar. Intentalo de nuevo.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Configuración de sucursal</CardTitle>
      </CardHeader>

      <form onSubmit={onSubmit}>
        <CardContent className="space-y-6">
          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="branch-name" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Nombre de la sucursal
            </Label>
            <Input
              id="branch-name"
              placeholder="Ej: Sucursal Central"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          {/* Dirección */}
          <div className="space-y-2">
            <Label htmlFor="branch-address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Dirección
            </Label>
            <Input
              id="branch-address"
              placeholder="Ej: Av. Principal 123"
              value={form.address ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
          </div>

          {/* Estado / feedback */}
          {saved === "ok" && (
            <p className="text-sm text-green-600">
              ✅ Cambios guardados correctamente.
            </p>
          )}

          {saved === "error" && (
            <p className="text-sm text-red-600">
              ❌ {errorMessage ?? "Hubo un problema al guardar."}
            </p>
          )}
        </CardContent>

        <CardFooter className="justify-end">
          <Button type="submit" disabled={loading} className="gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {form.id ? "Actualizar sucursal" : "Crear sucursal"}
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
