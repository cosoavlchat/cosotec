import type { NextConfig } from "next";
import { securityHeaders } from "./src/config/security-headers";
import { redirects } from "./src/config/redirects";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Redirecciones 301 de URLs históricas de cosoavl.com
  redirects,
  // Cabeceras de seguridad y privacidad en rutas sensibles
  headers: securityHeaders,
};

export default nextConfig;
