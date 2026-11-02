import { adminDb } from "@/lib/firebase/admin";
import { Cart } from "@/types/cart";
import { normalizePhoneE164 } from "@/lib/utils/phone";

export interface AbandonoResultado {
  procesados: number;
  leadsCreados: number;
  detalles: Array<{
    cartId: string;
    contactoNombre?: string;
    telefonoE164?: string;
    leadId?: string;
  }>;
}

/**
 * Worker / Servicio que detecta carritos inactivos con más de `minutosInactividad` (31 min por defecto),
 * cambia su estado a "abandonado" y genera el lead correspondiente en el CRM/leads.
 */
export async function verificarCarritosAbandonados(
  minutosInactividad: number = 31
): Promise<AbandonoResultado> {
  const limiteTiempoMs = Date.now() - minutosInactividad * 60 * 1000;
  const fechaLimiteIso = new Date(limiteTiempoMs).toISOString();

  // Consultar carritos activos (filtro simple para no requerir índice compuesto preliminar)
  const snapshot = await adminDb
    .collection("carts")
    .where("estado", "==", "activo")
    .get();

  const resultado: AbandonoResultado = {
    procesados: 0,
    leadsCreados: 0,
    detalles: [],
  };

  const nowIso = new Date().toISOString();

  for (const doc of snapshot.docs) {
    const cart = doc.data() as Cart;

    // Filtrar inactividad en memoria
    if (cart.updatedAt && cart.updatedAt > fechaLimiteIso) {
      continue;
    }
    resultado.procesados += 1;

    // 1. Transición de estado a "abandonado"
    await doc.ref.update({
      estado: "abandonado",
      abandonedAt: nowIso,
      updatedAt: nowIso,
    });

    let leadId: string | undefined = undefined;
    const telE164 = cart.contacto?.telefono ? normalizePhoneE164(cart.contacto.telefono) : "";

    // 2. Si el usuario capturó datos de contacto (teléfono o correo), crear lead en CRM
    if (telE164 || cart.contacto?.correo) {
      leadId = `lead_cart_${doc.id}`;
      const leadRef = adminDb.collection("leads").doc(leadId);

      await leadRef.set(
        {
          id: leadId,
          origen: "carrito_abandonado",
          cartId: doc.id,
          nombre: cart.contacto?.nombre || "Prospecto de Carrito",
          telefono: telE164,
          correo: cart.contacto?.correo || "",
          empresa: cart.contacto?.empresa || "",
          pasoAlcanzado: cart.pasoActual,
          totalEstimadoCentavos: cart.calculo?.totalCentavos ?? 0,
          itemsResumen: (cart.items || []).map((it) => `${it.cantidad}x ${it.nombre}`).join(", "),
          estadoLead: "nuevo",
          fechaAbandono: nowIso,
          createdAt: nowIso,
        },
        { merge: true }
      );

      resultado.leadsCreados += 1;
    }

    resultado.detalles.push({
      cartId: doc.id,
      contactoNombre: cart.contacto?.nombre,
      telefonoE164: telE164,
      leadId,
    });
  }

  return resultado;
}
