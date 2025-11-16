"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Edit, Trash2, Shield, UserIcon, MapPin } from "lucide-react"
import { UserDialog } from "@/components/user-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { deleteUser } from "@/app/actions/users"

// 🧩 Tipado extendido con branch
interface User {
  id: string
  email: string
  name: string
  role: string
  createdAt: Date
  branchId?: string | null
  branch?: { id: string; name: string } | null
}

interface UsersManagerProps {
  initialUsers: User[]
}

export const UsersManager = ({ initialUsers }: UsersManagerProps) => {
  const [users, setUsers] = useState(initialUsers)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  // 🔍 Filtro en tiempo real
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 🔁 Cuando se guarda un usuario
  const handleUserSaved = () => {
    setIsDialogOpen(false)
    setEditingUser(null)
    // 🔄 Refrescar lista sin recargar toda la página
    window.location.reload()
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setIsDialogOpen(true)
  }

  const handleNew = () => {
    setEditingUser(null)
    setIsDialogOpen(true)
  }

  const handleDelete = async (user: User) => {
    if (!confirm(`¿Eliminar usuario "${user.name}"?`)) return

    try {
      await deleteUser(user.id)
      // 🔄 Actualizar lista local sin reload completo
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
    } catch (error) {
      console.error("[UsersManager] Error eliminando usuario:", error)
      alert("❌ Error al eliminar el usuario.")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">Administra los usuarios del sistema y sus sucursales</p>
        </div>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Buscar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Listado */}
      <div className="grid gap-4">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No se encontraron usuarios</p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      {user.role === "ADMIN" ? (
                        <Shield className="h-6 w-6 text-primary" />
                      ) : (
                        <UserIcon className="h-6 w-6 text-primary" />
                      )}
                    </div>

                    {/* Info principal */}
                    <div>
                      <h3 className="font-semibold">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>

                      {/* Mostrar sucursal si existe */}
                      {user.branch?.name && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" />
                          <span>{user.branch.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Rol */}
                    <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                      {user.role}
                    </Badge>
                  </div>

                  {/* Botones */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(user)}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      onClick={() => handleDelete(user)}
                      variant="destructive"
                      size="sm"
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal */}
      <UserDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        user={editingUser}
        onSaved={handleUserSaved}
      />
    </div>
  )
}
