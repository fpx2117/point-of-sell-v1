/**
 * 🔄 serializePrisma<T>
 * Convierte resultados de Prisma en objetos completamente planos,
 * removiendo Decimal, BigInt, Date y objetos especiales del runtime.
 *
 * ✔ Soporta Prisma Decimal incluso si viene como objeto anidado
 * ✔ Convierte Date que no se detectan como instancia directa
 * ✔ Elimina referencias internas del runtime de Prisma
 * ✔ Evita problemas con Next.js (RSC/Client Boundary)
 */

export function serializePrisma<T>(data: unknown): T {
  return JSON.parse(
    JSON.stringify(data, (_, value) => {
      // 🔢 Prisma.Decimal detectado por método toNumber()
      if (
        value &&
        typeof value === "object" &&
        typeof (value as any).toNumber === "function"
      ) {
        return Number((value as any).toNumber());
      }

      // 🔢 BigInt → number
      if (typeof value === "bigint") {
        return Number(value);
      }

      // 🕒 Date → string (aunque date no sea instancia real de Date en Turbo)
      if (
        value &&
        typeof value === "object" &&
        Object.prototype.toString.call(value) === "[object Date]"
      ) {
        return new Date(value as any).toISOString();
      }

      // 🧹 Prisma internal fields (causan errores en Client Components)
      if (
        value &&
        typeof value === "object" &&
        ("_d" in (value as any) || "__internal" in (value as any))
      ) {
        return undefined;
      }

      return value;
    })
  ) as T;
}
