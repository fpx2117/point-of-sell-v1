import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAdmin = token?.role === "ADMIN"
    const isVendedor = token?.role === "VENDEDOR"

    // Rutas solo para admin
    if (req.nextUrl.pathname.startsWith("/admin") && !isAdmin) {
      return NextResponse.redirect(new URL("/pos", req.url))
    }

    // Redirect desde root según rol
    if (req.nextUrl.pathname === "/" && token) {
      if (isAdmin) {
        return NextResponse.redirect(new URL("/admin/productos", req.url))
      }
      if (isVendedor) {
        return NextResponse.redirect(new URL("/pos", req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  },
)

export const config = {
  matcher: ["/", "/admin/:path*", "/pos/:path*", "/historial/:path*"],
}
