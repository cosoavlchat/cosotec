"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { Shield } from "lucide-react";

interface CookieConsentProps {
  ga4Id?: string;
  metaPixelId?: string;
}

export function CookieConsent({ ga4Id, metaPixelId }: CookieConsentProps) {
  const [consent, setConsent] = useState<"accepted" | "declined" | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("cosotec_cookie_consent") as "accepted" | "declined" | null;
    if (saved) {
      setConsent(saved);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cosotec_cookie_consent", "accepted");
    setConsent("accepted");
  };

  const handleDecline = () => {
    localStorage.setItem("cosotec_cookie_consent", "declined");
    setConsent("declined");
  };

  if (!mounted) return null;

  return (
    <>
      {/* Scripts inyectados condicionalmente tras consentimiento */}
      {consent === "accepted" && ga4Id && ga4Id.trim() !== "" && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              var isSensitive = ['/c/', '/checkout', '/pedido/'].some(function(p) {
                return window.location.pathname.indexOf(p) === 0;
              });
              var safePath = window.location.pathname;
              var safeLocation = isSensitive ? (window.location.origin + safePath) : window.location.href;

              gtag('config', '${ga4Id}', {
                page_path: safePath,
                page_location: safeLocation,
                allow_google_signals: false
              });
            `}
          </Script>
        </>
      )}

      {consent === "accepted" && metaPixelId && metaPixelId.trim() !== "" && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${metaPixelId}');
            
            var isSensitive = ['/c/', '/checkout', '/pedido/'].some(function(p) {
              return window.location.pathname.indexOf(p) === 0;
            });
            // En rutas sensibles no se expone la URL con tokens ni parámetros
            if (!isSensitive) {
              fbq('track', 'PageView');
            }
          `}
        </Script>
      )}

      {/* Banner de consentimiento si aún no se ha decidido */}
      {consent === null && (
        <div className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 bg-[#1C1C1E] text-white shadow-2xl border-t border-white/10 animate-in slide-in-from-bottom duration-300">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#7A1428] text-white flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-[#C9A15B]" />
              </div>
              <p className="text-gray-300 leading-relaxed">
                Utilizamos cookies esenciales y analíticas para brindarte asesoría personalizada y optimizar nuestro cotizador de telemetría y seguridad.
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
              <button
                onClick={handleDecline}
                className="px-3.5 py-1.5 rounded-lg border border-gray-600 text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                Solo Necesarias
              </button>
              <button
                onClick={handleAccept}
                className="px-4 py-1.5 rounded-lg bg-[#7A1428] hover:bg-[#4A0C18] text-white font-bold transition-colors shadow-xs"
              >
                Aceptar Todas
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

