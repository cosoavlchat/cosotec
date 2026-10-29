# Decisiones de Diseño y Arquitectura — CosoTec

Este documento registra las decisiones tomadas durante el desarrollo del proyecto cuando un detalle no estuvo completamente especificado o se optó por la alternativa más limpia y mantenible.

---

### [2026-10-28] — Arquitectura Inicial y Fase 1
1. **Framework & Estilo:**
   - Next.js 15+ con App Router y TypeScript.
   - Tailwind CSS con paleta de tokens personalizada en `tailwind.config.ts` (#7A1428 vino principal, #4A0C18 vino oscuro, #C8102E rojo marca, #C9A15B dorado acento, #F5F3F2 gris claro, #1C1C1E carbón).
   - Componentes UI modulares con Lucide Icons y Tailwind (estilo shadcn/ui).
   - Fuentes: `Manrope` para títulos y `Inter` para textos generales cargadas mediante `next/font/google`.

2. **Estrategia Firebase y Fuente Única de Datos:**
   - En desarrollo local se utiliza exclusivamente Firebase Emulator Suite (`localhost:8080`, `localhost:9099`, `localhost:9199`).
   - En producción se conecta directamente al proyecto `cosoteco`.
   - Se eliminan mocks y archivos JSON temporales para mantener total integridad.

3. **Estructura de Carpetas:**
   - `src/app`: Páginas y layouts de Next.js (App Router).
   - `src/app/(public)`: Rutas públicas del e-commerce.
   - `src/app/(admin)/admin`: Panel administrativo con autenticación y control de roles.
   - `src/app/api`: Endpoints REST (cálculo de cotización, webhook MP, webhook chatbot, seed, etc.).
   - `src/components`: Componentes UI reutilizables (botones, modales, tablas, forms, navbar, footer).
   - `src/lib`: Configuración de Firebase, utilidades de formato (`$1,234.56 MXN`), validadores Zod, motor de cálculo `calcularCotizacion()`.
   - `src/types`: Interfaces TypeScript para productos, paquetes, cotizaciones, órdenes, leads, etc.
   - `scripts`: Scripts de mantenimiento y seed (`scripts/seed.ts`).
   - `docs`: Especificación, decisiones y pendientes.

4. **Validación de Datos y Regla de Centavos:**
   - Zod para todos los esquemas de entrada en el servidor y formularios del cliente.
   - Todos los precios se guardan exclusivamente en centavos enteros sin IVA (`precioSinIvaCentavos`).

---

### [2026-10-29] — Fase 2 (Sitio Público, SEO y Redirecciones)
1. **Redirecciones 301 de URLs históricas de `cosoavl.com`:**
   - Se configuran directamente en `next.config.ts`.
   - Tienen mapeo permanente a las nuevas rutas (`/`, `/plataforma`, `/soluciones/*`, `/tienda`, `/nosotros`, `/contacto`, `/privacidad`).
   - Tendrán efecto cuando el dominio `cosoavl.com` apunte a esta aplicación Next.js en Firebase App Hosting.

2. **Botones de Compra y Cotización durante Fase 2:**
   - Dado que el motor de checkout y pagos pertenece a la Fase 3, los botones de compra y cotización se dirigen de forma interactiva y prellenada hacia el WhatsApp oficial de ventas (`722 432 2053`), indicando producto, precio y origen.
   - Se incluye el flag `modoCotizadorWhatsapp: true` en `settings/features` para conmutar al checkout en línea automáticamente al completar la Fase 3.

3. **Contenido Veraz y Ausencia de Testimonios Inventados:**
   - La colección `content/testimonios` se crea vacía. La sección de testimonios solo se muestra si existen documentos con `activo: true`.
   - Cifras exactas: "48,000 dispositivos vendidos en Norteamérica y Sudamérica" y mención de gobiernos de Nuevo León, Tamaulipas y Puebla avalados por el sistema nacional de seguridad.

4. **Tratamiento de Viáticos en `/instalacion`:**
   - Estado con `sinCosto: true` → Se renderiza como **"Sin costo"**.
   - Estado con `monto == 0` y `sinCosto: false` → Se renderiza como **"Se cotiza"**.
   - Estado con monto configurado → Se muestra el monto con IVA calculado en el servidor.

5. **Cookies, GA4 y Meta Pixel:**
   - Componente de consentimiento de cookies (`CookieConsent.tsx`). Los scripts de GA4 y Meta Pixel se inyectan únicamente tras la aceptación del usuario y si sus respectivos IDs están configurados en `settings/analytics`.
   - Eventos estándar rastreados: `ViewContent` (fichas de producto), `Contact` (clic en botón de WhatsApp), `Lead` (envío exitoso del formulario de contacto).
