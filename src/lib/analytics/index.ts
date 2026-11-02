"use client";

import { sanitizeAnalyticsParams } from "./privacy";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
  }
}

export function hasCookieConsent(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("cosotec_cookie_consent") === "accepted";
}

/**
 * REGLA: Rastreo de eventos solo si el usuario dio consentimiento de cookies.
 * Los datos sensibles del cliente y tokens se purgan antes de enviar a GA4 / Meta.
 */
export function trackAnalyticsEvent(
  eventName: "ViewContent" | "Contact" | "Lead" | "AddToCart" | "InitiateCheckout" | "Purchase",
  params?: Record<string, any>
) {
  if (typeof window === "undefined") return;
  if (!hasCookieConsent()) return;

  const sanitizedParams = sanitizeAnalyticsParams(params);

  // Google Analytics 4
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, sanitizedParams);
  }

  // Meta Pixel
  if (typeof window.fbq === "function") {
    window.fbq("track", eventName, sanitizedParams);
  }
}
