// lib/finance/price-utils.ts

/**
 * Calcula la ganancia total (venta - costo) multiplicada por cantidad.
 */
export function calcularGanancia(precioVenta: number, precioCosto: number, cantidad: number): number {
  const pv = Number(precioVenta) || 0
  const pc = Number(precioCosto) || 0
  const qty = Number(cantidad) || 0
  return (pv - pc) * qty
}

/**
 * Calcula el margen de ganancia porcentual.
 */
export function calcularMargenGanancia(totalVenta: number, totalCosto: number): number {
  const v = Number(totalVenta) || 0
  const c = Number(totalCosto) || 0
  if (v <= 0) return 0
  return ((v - c) / v) * 100
}

/**
 * Formatea un número como moneda argentina (ARS).
 */
export function formatoMoneda(valor: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(valor) || 0)
}

/**
 * Suma el total de un array numérico o string, ignorando valores no válidos.
 */
export function sumarValores(valores: Array<number | string>): number {
  return valores.reduce<number>((acc, val) => acc + (Number(val) || 0), 0)
}

/**
 * Calcula el costo total de inventario.
 */
export function calcularCostoInventario(precioCosto: number, stock: number): number {
  const pc = Number(precioCosto) || 0
  const s = Number(stock) || 0
  return pc * s
}
