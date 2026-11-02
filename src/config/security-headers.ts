export interface HeaderItem {
  key: string;
  value: string;
}

export interface SecurityHeaderRule {
  source: string;
  headers: HeaderItem[];
}

/**
 * Cabeceras de seguridad y privacidad para rutas sensibles (/c/*, /checkout, /pedido/*).
 * Aplica Referrer-Policy estricta y previene indexación en buscadores.
 */
export async function securityHeaders(): Promise<SecurityHeaderRule[]> {
  return [
    {
      source: "/c/:path*",
      headers: [
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Robots-Tag", value: "noindex, nofollow" },
      ],
    },
    {
      source: "/checkout",
      headers: [
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Robots-Tag", value: "noindex, nofollow" },
      ],
    },
    {
      source: "/checkout/:path*",
      headers: [
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Robots-Tag", value: "noindex, nofollow" },
      ],
    },
    {
      source: "/pedido/:path*",
      headers: [
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Robots-Tag", value: "noindex, nofollow" },
      ],
    },
  ];
}

