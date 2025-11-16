"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { createCategory, deleteCategory } from "@/app/actions/categories"
import { Plus, Trash2 } from "lucide-react"

interface Category {
  id: string
  name: string
  color: string
}

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
}

export const CategoryDialog = ({ open, onOpenChange, categories }: CategoryDialogProps) => {
  const [name, setName] = useState("")
  const [color, setColor] = useState("#3b82f6")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await createCategory({ name, color })
      setName("")
      setColor("#3b82f6")
      window.location.reload()
    } catch (error) {
      console.error("[v0] Error creating category:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta categoría? Los productos se mantendrán sin categoría.")) return

    setLoading(true)
    try {
      await deleteCategory(id)
      window.location.reload()
    } catch (error) {
      console.error("[v0] Error deleting category:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gestión de Categorías</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="category-name">Nombre de Categoría</Label>
              <Input
                id="category-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Electrónica"
                required
              />
            </div>
            <div>
              <Label htmlFor="category-color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="category-color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-20"
                />
                <Input value={color} readOnly />
              </div>
            </div>
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              <Plus className="h-4 w-4" />
              Crear Categoría
            </Button>
          </form>

          <div className="space-y-2">
            <Label>Categorías Existentes</Label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <Badge style={{ backgroundColor: cat.color }}>{cat.name}</Badge>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)} disabled={loading}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
