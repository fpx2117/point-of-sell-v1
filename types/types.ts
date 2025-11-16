/* ======================================================
   TYPES FRONTEND — Alineado 100% al schema.prisma
====================================================== */

/* ─────────────────────────────────────────────
   ENUMS — iguales a Prisma, pero en frontend
────────────────────────────────────────────── */
export type UserRole = "ADMIN" | "SUPERVISOR" | "VENDEDOR";

export type PaymentMethod = "EFECTIVO" | "TARJETA" | "TRANSFERENCIA";

export type MovementType = "ENTRADA" | "SALIDA" | "AJUSTE";

export type NotificationType =
  | "STOCK_BAJO"
  | "STOCK_AGOTADO"
  | "VENCIMIENTO"
  | "VENTA"
  | "CAJA"
  | "SISTEMA";

/* ─────────────────────────────────────────────
   PRODUCT VARIANT
────────────────────────────────────────────── */
export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  value: string;
  priceAdjustment: number;

  stocks: VariantStock[];
}

/* ─────────────────────────────────────────────
   STOCK POR VARIANTE
────────────────────────────────────────────── */
export interface VariantStock {
  id: string;
  variantId: string;
  branchId: string;
  stock: number;
}

/* ─────────────────────────────────────────────
   STOCK POR PRODUCTO
────────────────────────────────────────────── */
export interface ProductStock {
  id: string;
  productId: string;
  branchId: string;
  stock: number;
}

/* ─────────────────────────────────────────────
   PRODUCTO — Modelo principal del POS
────────────────────────────────────────────── */
export interface Product {
  id: string;
  name: string;
  price: number; // Decimal convertido
  costo: number; // Decimal convertido
  barcode: string | null;
  image: string | null;
  color: string;
  expirationDate: string | null;
  stockMinimo: number | null;
  categoryId: string;
  taxId: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;

  category: {
    id: string;
    name: string;
    color: string;
  };

  variants: ProductVariant[];
  stocks: ProductStock[];
}

/* ─────────────────────────────────────────────
   SALE ITEM
────────────────────────────────────────────── */
export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  price: number; // Decimal
  subtotal: number; // Decimal

  product?: Product;
  variant?: ProductVariant;
}

/* ─────────────────────────────────────────────
   SALE (Venta completa)
────────────────────────────────────────────── */
export interface Sale {
  id: string;
  userId: string;
  branchId: string;
  total: number;
  paymentMethod: PaymentMethod;
  cashAmount: number | null;
  change: number | null;
  mesa: boolean;
  mesaNumber: string | null;
  observaciones: string | null;
  createdAt: string;

  user?: AppUser;

  items: SaleItem[];
}

/* ─────────────────────────────────────────────
   INVENTORY MOVEMENT
────────────────────────────────────────────── */
export interface InventoryMovement {
  id: string;
  productId: string;
  variantId: string | null;
  type: MovementType;
  quantity: number;
  reason: string | null;
  userId: string;
  branchId: string | null;
  createdAt: string;
}

/* ─────────────────────────────────────────────
   USER
────────────────────────────────────────────── */
export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  branchId: string | null;
}

/* ─────────────────────────────────────────────
   CATEGORY
────────────────────────────────────────────── */
export interface Category {
  id: string;
  name: string;
  color: string;
}

/* ─────────────────────────────────────────────
   NOTIFICATION
────────────────────────────────────────────── */
export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  productId: string | null;
  userId: string | null;
  read: boolean;
  createdAt: string;

  product?: Product;
}

/* ─────────────────────────────────────────────
   Producto especializado para el pos
────────────────────────────────────────────── */
export interface ProductPOS {
  id: string;
  name: string;
  price: number;
  costo: number;
  barcode: string | null;
  image: string | null;
  color: string;
  active: boolean;

  category: {
    id: string;
    name: string;
    color: string;
  };

  // ✔️ stock total en esta sucursal
  stock: number;

  // ✔️ variantes ya con su stock total
  variants: {
    id: string;
    name: string;
    value: string;
    priceAdjustment: number;
    stock: number;
  }[];
}
/* ─────────────────────────────────────────────
   PAYMENT DATA — datos del modal de pago
────────────────────────────────────────────── */
export interface PaymentData {
  paymentMethod: PaymentMethod;
  cashAmount: number | null;
  change: number | null;
}

/* ─────────────────────────────────────────────
   CART ITEM — Lo que el POS envía al backend
   (NO es SaleItem, es un carrito temporal)
────────────────────────────────────────────── */
export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;

  image: string | null;
  color: string | null;

  variantId: string | null;
  variantName: string | null;
  variantValue: string | null;

  // opcional (si necesitás stock por variante)
  variantStock?: number;
}

/* ─────────────────────────────────────────────
   SALE NOTES DATA — datos extra de la venta
────────────────────────────────────────────── */
export interface SaleNotesData {
  mesa: boolean;
  mesaNumber: string | null;
  observaciones: string;
}