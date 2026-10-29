"use client";

import { MessageCircle } from "lucide-react";
import { buildWhatsAppLink, WHATSAPP_DISPLAY } from "@/lib/utils/whatsapp";
import { trackAnalyticsEvent } from "@/lib/analytics";

interface WhatsAppButtonProps {
  producto?: string;
  pagina?: string;
}

export function WhatsAppButton({ producto, pagina }: WhatsAppButtonProps) {
  const whatsappUrl = buildWhatsAppLink({
    producto,
    pagina: pagina || "Sitio Web CosoTec",
    tipoConsulta: "general",
  });

  const handleClick = () => {
    trackAnalyticsEvent("Contact", {
      method: "whatsapp_floating",
      page: pagina || window.location.pathname,
    });
  };

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold rounded-full shadow-2xl transition-all hover:scale-105 group border-2 border-white/30"
    >
      <MessageCircle className="w-5 h-5 fill-current shrink-0" />
      <span className="text-xs hidden sm:inline-block font-semibold">
        WhatsApp {WHATSAPP_DISPLAY}
      </span>
      <span className="text-xs sm:hidden font-semibold">WhatsApp</span>
    </a>
  );
}

