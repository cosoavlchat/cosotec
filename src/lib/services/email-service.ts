import React from "react";
import { adminDb } from "@/lib/firebase/admin";
import { Order, OrderPagoProgramado } from "@/types/order";
import { FichaInstalacionEmail } from "@/components/emails/FichaInstalacionEmail";
import { ConfirmacionPedidoEmail } from "@/components/emails/ConfirmacionPedidoEmail";
import { AvisoSpeiEmail } from "@/components/emails/AvisoSpeiEmail";
import { CobroDiferidoEmail } from "@/components/emails/CobroDiferidoEmail";
import { DEFAULT_EMAIL_FOOTER, getAppBaseUrl } from "@/components/emails/email-helpers";
import { getBankSettings } from "@/lib/services/bank-service";
import { getTurnosSettings } from "@/lib/services/shifts-service";

async function renderHtml(element: React.ReactElement): Promise<string> {
  const { renderToStaticMarkup } = await import("react-dom/server");
  return renderToStaticMarkup(element);
}

/**
 * 2. Valida si APP_BASE_URL está configurada. Si falta, registra un error en auditLog
 * y los enlaces se generan como rutas relativas.
 */
async function checkBaseUrlConfigured(baseUrl: string) {
  if (!baseUrl || baseUrl.trim() === "") {
    console.error("[Email Service] APP_BASE_URL no está configurada en el entorno. Los enlaces se generarán relativos.");
    try {
      await adminDb.collection("auditLog").add({
        tipo: "error_configuracion_base_url",
        mensaje: "APP_BASE_URL no está configurada en el entorno. Los enlaces de correo se generaron como rutas relativas.",
        fecha: new Date().toISOString(),
      });
    } catch {
      // Ignorar fallas de auditoría
    }
  }
}

// 2. Fallback de soporte: solo ventas@cosoavl.com (eliminado soporte@cosoavl.com)
const DEFAULT_SOPORTE_EMAILS = ["ventas@cosoavl.com"];
const DEFAULT_FROM = "CosoTec <onboarding@resend.dev>";

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  tipo: "ficha_instalacion" | "confirmacion_pedido" | "aviso_spei" | "cobro_diferido";
  metadata?: Record<string, any>;
}

export interface SendEmailResult {
  success: boolean;
  queued?: boolean;
  resendId?: string;
  message?: string;
  error?: string;
}

/**
 * Obtiene la lista de correos de soporte configurados en settings/notifications.
 */
export async function getSoporteEmails(): Promise<string[]> {
  try {
    const snap = await adminDb.collection("settings").doc("notifications").get();
    if (snap.exists) {
      const data = snap.data();
      if (Array.isArray(data?.soporteEmails) && data.soporteEmails.length > 0) {
        return data.soporteEmails;
      }
    }
  } catch (err) {
    console.warn("[getSoporteEmails] No se pudo leer settings/notifications, usando defaults:", err);
  }
  return DEFAULT_SOPORTE_EMAILS;
}

/**
 * 1. Obtiene el pie corporativo desde settings/contact o retorna el predeterminado oficial.
 */
export async function getContactPie(): Promise<string> {
  try {
    const snap = await adminDb.collection("settings").doc("contact").get();
    if (snap.exists) {
      const data = snap.data();
      if (typeof data?.pieCompleto === "string" && data.pieCompleto.trim().length > 0) {
        return data.pieCompleto.trim();
      }
    }
  } catch (err) {
    // Silencioso, usar fallback oficial
  }
  return DEFAULT_EMAIL_FOOTER;
}

/**
 * Envío centralizado de correos con Resend.
 * REGLA: Si RESEND_API_KEY no está configurada, el correo se encola en Firestore ('emailQueue')
 * como 'pendiente' sin romper el flujo de pago o checkout.
 */
export async function enviarEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const nowIso = new Date().toISOString();
  const toList = Array.isArray(params.to) ? params.to : [params.to];

  if (!apiKey || apiKey.trim() === "" || apiKey === "temporal-pendiente") {
    console.info(`[Email Service] RESEND_API_KEY ausente. Encolando correo '${params.tipo}' en 'emailQueue'.`);
    try {
      const docRef = await adminDb.collection("emailQueue").add({
        estado: "pendiente",
        motivo: "RESEND_API_KEY no configurada en el entorno",
        tipo: params.tipo,
        to: toList,
        subject: params.subject,
        html: params.html,
        metadata: params.metadata || {},
        createdAt: nowIso,
      });
      return {
        success: true,
        queued: true,
        message: `Correo encolado exitosamente en emailQueue con ID ${docRef.id}.`,
      };
    } catch (queueErr: any) {
      console.error("[Email Service] Error al guardar en emailQueue:", queueErr);
      return { success: false, error: queueErr.message };
    }
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: DEFAULT_FROM,
        to: toList,
        subject: params.subject,
        html: params.html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.warn("[Email Service] Resend API retornó error:", data);
      await adminDb.collection("emailQueue").add({
        estado: "error",
        error: data.message || "Error devuelto por Resend",
        tipo: params.tipo,
        to: toList,
        subject: params.subject,
        html: params.html,
        metadata: params.metadata || {},
        createdAt: nowIso,
      });
      return { success: false, error: data.message };
    }

    await adminDb.collection("auditLog").add({
      tipo: "email_enviado_resend",
      tipoEmail: params.tipo,
      resendId: data.id,
      to: toList,
      subject: params.subject,
      fecha: nowIso,
    });

    return {
      success: true,
      resendId: data.id,
      message: "Correo enviado con éxito.",
    };
  } catch (err: any) {
    console.error("[Email Service] Excepción al enviar correo:", err);
    await adminDb.collection("emailQueue").add({
      estado: "error",
      error: err.message,
      tipo: params.tipo,
      to: toList,
      subject: params.subject,
      html: params.html,
      metadata: params.metadata || {},
      createdAt: nowIso,
    });
    return { success: false, error: err.message };
  }
}

/**
 * 1. Envía la ficha completa de instalación técnica a soporte.
 */
export async function notificarFichaInstalacionASoporte(order: Order, siteUrl?: string) {
  const soporteEmails = await getSoporteEmails();
  const unidadesCount = order.unidades?.length || 0;
  const subject = `[Nueva Instalación] Pedido #${order.folio} - ${order.contacto.nombre} (${unidadesCount} unidades)`;
  const baseUrl = getAppBaseUrl(siteUrl);
  await checkBaseUrlConfigured(baseUrl);
  const customFooter = await getContactPie();
  const turnosSettings = await getTurnosSettings();

  const html = await renderHtml(
    React.createElement(FichaInstalacionEmail, {
      order,
      siteUrl: baseUrl,
      customFooter,
      turnosSettings,
    })
  );

  return enviarEmail({
    to: soporteEmails,
    subject,
    html,
    tipo: "ficha_instalacion",
    metadata: { folio: order.folio, cliente: order.contacto.nombre },
  });
}

/**
 * 2. Envía la confirmación oficial del pedido al cliente con su enlace protegido.
 * Dos versiones: Pago aprobado vs Pedido SPEI pendiente de validación.
 * Lee los datos bancarios dinámicamente desde settings/bank vía bank-service.
 */
export async function notificarConfirmacionPedidoCliente(order: Order, token: string, siteUrl?: string) {
  if (!order.contacto.correo) {
    console.warn(`[Email Service] Orden ${order.folio} no tiene correo de contacto registrado.`);
    return { success: false, error: "Cliente sin correo" };
  }

  const esSpeiPendiente =
    order.metodoPago === "spei" &&
    (order.estado === "pendiente_comprobante" || order.estado === "comprobante_subido");

  const subject = esSpeiPendiente
    ? `Pedido #${order.folio} Registrado - Instrucciones de Pago SPEI`
    : `¡Confirmación de tu Pedido #${order.folio} en CosoTec!`;

  const baseUrl = getAppBaseUrl(siteUrl);
  await checkBaseUrlConfigured(baseUrl);
  const customFooter = await getContactPie();
  const bankSettings = await getBankSettings();

  const html = await renderHtml(
    React.createElement(ConfirmacionPedidoEmail, {
      order,
      token,
      siteUrl: baseUrl,
      customFooter,
      bankSettings,
    })
  );

  return enviarEmail({
    to: order.contacto.correo,
    subject,
    html,
    tipo: "confirmacion_pedido",
    metadata: { folio: order.folio, cliente: order.contacto.nombre },
  });
}

/**
 * 3. Notifica al cliente la validación o rechazo de su comprobante SPEI.
 */
export async function notificarResultadoSpeiCliente(
  order: Order,
  token: string,
  accion: "aprobado" | "rechazado",
  motivoRechazo?: string,
  siteUrl?: string,
  pagoId?: string
) {
  if (!order.contacto.correo) return { success: false, error: "Cliente sin correo" };

  const subject =
    accion === "aprobado"
      ? `✓ Pago SPEI Acreditado con Éxito - Pedido #${order.folio}`
      : `Acción requerida: Comprobante SPEI de Pedido #${order.folio}`;

  const baseUrl = getAppBaseUrl(siteUrl);
  await checkBaseUrlConfigured(baseUrl);
  const customFooter = await getContactPie();

  const html = await renderHtml(
    React.createElement(AvisoSpeiEmail, {
      order,
      token,
      accion,
      motivoRechazo,
      siteUrl: baseUrl,
      customFooter,
      pagoId,
    })
  );

  return enviarEmail({
    to: order.contacto.correo,
    subject,
    html,
    tipo: "aviso_spei",
    metadata: { folio: order.folio, accion, motivoRechazo, pagoId },
  });
}

/**
 * 4. Envía el recordatorio y link de cobro diferido (P2 Finiquito o P3 Mensualidad).
 */
export async function notificarCobroDiferidoCliente(
  order: Order,
  pago: OrderPagoProgramado,
  token: string,
  linkCobro: string,
  siteUrl?: string
) {
  if (!order.contacto.correo) return { success: false, error: "Cliente sin correo" };

  const subject = `Recordatorio de Pago ${pago.id} (${pago.concepto}) - Pedido #${order.folio}`;
  const baseUrl = getAppBaseUrl(siteUrl);
  await checkBaseUrlConfigured(baseUrl);
  const customFooter = await getContactPie();

  const html = await renderHtml(
    React.createElement(CobroDiferidoEmail, {
      order,
      pago,
      token,
      linkCobro,
      siteUrl: baseUrl,
      customFooter,
    })
  );

  return enviarEmail({
    to: order.contacto.correo,
    subject,
    html,
    tipo: "cobro_diferido",
    metadata: { folio: order.folio, pagoId: pago.id, montoCentavos: pago.montoCentavos },
  });
}

