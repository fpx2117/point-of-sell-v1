"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  LogOut,
  ShoppingCart,
  Package,
  History,
  LayoutDashboard,
  Users,
  Warehouse,
  Settings,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface NavbarProps {
  user: {
    name: string
    email: string
    role: string
  }
}

export const Navbar = ({ user }: NavbarProps) => {
  const pathname = usePathname()
  const isAdmin = user.role === "ADMIN"

  const navItems = isAdmin
    ? [
        { href: "/admin/productos", label: "Productos", icon: Package },
        { href: "/admin/inventario", label: "Inventario", icon: Warehouse },
        { href: "/admin/usuarios", label: "Usuarios", icon: Users },
        { href: "/pos", label: "Punto de Venta", icon: ShoppingCart },
        { href: "/historial", label: "Historial", icon: History },
        { href: "/admin/reportes", label: "Reportes", icon: LayoutDashboard },
        // ⚙️ Nueva sección Configuración
        { href: "/admin/config", label: "Configuración", icon: Settings },
      ]
    : [
        { href: "/pos", label: "Punto de Venta", icon: ShoppingCart },
        { href: "/historial", label: "Historial", icon: History },
      ]

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* 🛒 Logo + navegación */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
              <ShoppingCart className="h-6 w-6" />
              <span>Hooka - POS</span>
            </Link>

            <div className="flex gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className="gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* 👤 Usuario + logout */}
          <div className="flex items-center gap-4">
            <div className="text-sm text-right">
              <p className="font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.role}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
