"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createUser, updateUser } from "@/app/actions/users"
import { getBranches } from "@/app/actions/branch"

interface Branch {
  id: string
  name: string
}

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: {
    id: string
    name: string
    email: string
    role: string
    branchId?: string | null
    branch?: { id: string; name: string } | null
  } | null
  onSaved: () => void
}

export const UserDialog = ({
  open,
  onOpenChange,
  user,
  onSaved,
}: UserDialogProps) => {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"ADMIN" | "VENDEDOR">("VENDEDOR")
  const [branchId, setBranchId] = useState<string | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 🔁 Cargar datos del usuario cuando se abre el modal
  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
      setRole(user.role as "ADMIN" | "VENDEDOR")
      setPassword("")
      setBranchId(user.branchId ?? user.branch?.id ?? null)
    } else {
      setName("")
      setEmail("")
      setPassword("")
      setRole("VENDEDOR")
      setBranchId(null)
    }
  }, [user, open])

  // 🏢 Cargar lista de sucursales
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const data = await getBranches()
        setBranches(data)
      } catch (err) {
        console.error("[UserDialog] Error cargando sucursales:", err)
      }
    }
    loadBranches()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (user) {
        await updateUser(user.id, {
          name,
          email,
          role,
          branchId,
          ...(password ? { password } : {}),
        })
      } else {
        await createUser({
          name,
          email,
          password,
          role,
          branchId,
        })
      }

      onSaved()
    } catch (err: any) {
      console.error("[UserDialog] Error:", err)
      setError(err?.message || "Error al guardar el usuario.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="password">
              Contraseña {user && "(dejar vacío para mantener)"}
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!user}
            />
          </div>

          <div>
            <Label htmlFor="role">Rol</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as "ADMIN" | "VENDEDOR")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VENDEDOR">VENDEDOR</SelectItem>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ✅ Selector de sucursal corregido */}
          <div>
            <Label>Sucursal asignada</Label>
            <Select
              value={branchId ?? "none"}
              onValueChange={(v) => setBranchId(v === "none" ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar sucursal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin asignar</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : user ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
