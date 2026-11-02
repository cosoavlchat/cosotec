import { NextRequest, NextResponse } from "next/server";
import { saveCartToFirestore } from "@/lib/cart";
import {
  generarCartId,
  signCartSession,
  verifyCartSession,
  CART_SESSION_COOKIE_NAME,
} from "@/lib/cart/session";
import { checkRateLimit } from "@/lib/services/rate-limit";
import { z } from "zod";

const cartItemSchema = z.object({
  id: z.string(),
  tipo: z.enum(["producto", "paquete"]),
  nombre: z.string(),
  categoria: z.string(),
  precioSinIvaCentavos: z.number().int().nonnegative(),
  cantidad: z.number().int().positive(),
  esEquipoPrincipal: z.boolean(),
  incluyeInstalacion: z.boolean().optional(),
  incluyePlanPrimerAnio: z.boolean().optional(),
});

const cartContactoSchema = z.object({
  nombre: z.string().optional(),
  telefono: z.string().optional(),
  correo: z.string().email().optional().or(z.literal("")),
  empresa: z.string().optional(),
});

const cartInstalacionSchema = z.object({
  estadoClave: z.string().optional(),
  estadoNombre: z.string().optional(),
  municipio: z.string().optional(),
  direccion: z.string().optional(),
  tipoLugar: z.enum(["domicilio", "taller_cosoavl"]).optional(),
  fechaTentativa: z.string().optional(),
  horarioTentativo: z.enum(["manana", "tarde", "completo"]).optional(),
  referencias: z.string().optional(),
  viaticosPorConfirmar: z.boolean().optional(),
  viaticosCentavos: z.number().int().optional(),
});

const cartUnidadVehiculoSchema = z.object({
  id: z.string(),
  equipoIndex: z.number().int(),
  equipoNombre: z.string(),
  tipoVehiculo: z.string().optional(),
  vin: z.string().optional(),
  placas: z.string().optional(),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  anio: z.string().optional(),
  color: z.string().optional(),
  numeroEconomico: z.string().optional(),
});

const cartFacturaSchema = z.object({
  requiereFactura: z.boolean(),
  rfc: z.string().optional(),
  razonSocial: z.string().optional(),
  regimenFiscal: z.string().optional(),
  usoCfdi: z.string().optional(),
  codigoPostalFiscal: z.string().optional(),
  correoFiscal: z.string().email().optional().or(z.literal("")),
});

const cartPagoSchema = z.object({
  planSeleccionado: z.string(),
  metodoSeleccionado: z.enum(["mercadopago", "spei"]).optional(),
});

const saveCartBodySchema = z.object({
  id: z.string().optional(),
  pasoActual: z.number().int().min(1).max(5).optional(),
  estado: z.enum(["activo", "abandonado", "convertido"]).optional(),
  items: z.array(cartItemSchema).optional(),
  contacto: cartContactoSchema.optional(),
  instalacion: cartInstalacionSchema.optional(),
  unidades: z.array(cartUnidadVehiculoSchema).optional(),
  factura: cartFacturaSchema.optional(),
  pago: cartPagoSchema.optional(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting por IP (30 llamadas por minuto)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const rateResult = await checkRateLimit(ip, "cart_save", 40, 60 * 1000);
    if (!rateResult.allowed) {
      return NextResponse.json(
        { error: "Demasiadas peticiones. Por favor espera un momento." },
        { status: 429 }
      );
    }

    // 2. Validación del cuerpo de la petición
    const json = await req.json();
    const parsed = saveCartBodySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos del carrito inválidos", detalles: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // 3. Verificación y ligadura de sesión criptográfica (Cookie firmada)
    const rawCookie = req.cookies.get(CART_SESSION_COOKIE_NAME)?.value;
    const sessionCartId = verifyCartSession(rawCookie);

    let targetCartId: string;
    let shouldSetCookie = false;

    if (sessionCartId) {
      // Si la sesión existe, verificar que no intente modificar un carrito ajeno
      if (data.id && data.id !== sessionCartId) {
        return NextResponse.json(
          { error: "No tienes autorización para modificar un carrito ajeno a tu sesión." },
          { status: 403 }
        );
      }
      targetCartId = sessionCartId;
    } else {
      // No hay sesión activa: crear nuevo cartId criptográfico aleatorio y firmar cookie
      targetCartId = data.id && data.id.trim() !== "" ? data.id : generarCartId();
      shouldSetCookie = true;
    }

    const userAgent = req.headers.get("user-agent") || undefined;

    // 4. Guardar carrito en Firestore
    const savedCart = await saveCartToFirestore({
      ...data,
      id: targetCartId,
      estado: data.estado || "activo",
      userAgent,
      pasoActual: (data.pasoActual as 1 | 2 | 3 | 4 | 5) || 1,
    });

    const response = NextResponse.json({
      success: true,
      cart: savedCart,
    });

    if (shouldSetCookie) {
      const signedCookieValue = signCartSession(targetCartId);
      response.cookies.set(CART_SESSION_COOKIE_NAME, signedCookieValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 días
      });
    }

    return response;
  } catch (error: any) {
    console.error("[API Cart Save] Error guardando carrito:", error);
    return NextResponse.json(
      { error: "Error al guardar el carrito", message: error.message },
      { status: 500 }
    );
  }
}
