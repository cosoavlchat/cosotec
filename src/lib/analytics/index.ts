"use client";

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
 * REGLA 10: Rastreo de eventos solo si el usuario dio consentimiento de cookies
 * Eventos: ViewContent (fichas), Contact (WhatsApp), Lead (formulario)
 */
export function trackAnalyticsEvent(
  eventName: "ViewContent" | "Contact" | "Lead",
  params?: Record<string, any>
) {
  if (typeof window === "undefined") return;
  if (!hasCookieConsent()) return;

  // Google Analytics 4
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
  }

  // Meta Pixel
  if (typeof window.fbq === "function") {
    window.fbq("track", eventName, params);
  }
}

