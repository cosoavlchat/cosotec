# Decisiones de Diseño y Arquitectura — CosoTec

Este documento registra las decisiones tomadas durante el desarrollo del proyecto cuando un detalle no estuvo completamente especificado o se optó por la alternativa más limpia y mantenible.

---

### [2026-10-28] — Arquitectura Inicial y Fase 1
1. **Framework & Estilo:**
   - Next.js 15+ con App Router y TypeScript.
   - Tailwind CSS con paleta de tokens personalizada en `tailwind.config.ts` (#7A1428 vino principal, #4A0C18 vino oscuro, #C8102E rojo marca, #C9A15B dorado acento, #F5F3F2 gris claro, #1C1C1E carbón).
   - Componentes UI modulares con Lucide Icons y Tailwind (estilo shadcn/ui).
   - Fuentes: `Manrope` para títulos y `Inter` para textos generales cargadas mediante `next/font/google`.

2. **Estrategia Firebase sin Plan Blaze Activo:**
   - Mientras el cliente activa el plan Blaze en el proyecto `cosoteco`, el desarrollo se estructura con:
     - Configuración completa de Firebase JS SDK (cliente) y Firebase Admin SDK (servidor).
     - Soporte para variables de entorno locales (`.env.local`) y emuladores de Firebase / mock de persistencia inicial si no hay credenciales directas, permitiendo avanzar al 100% en interfaces, lógica, tests y reglas sin bloquearnos.
     - Rutas `/api` en Next.js App Router para todas las operaciones seguras del servidor (cumpliendo con la regla de que el cálculo siempre ocurre en servidor).

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

4. **Validación de Datos:**
   - Zod para todos los esquemas de entrada en el servidor y formularios del cliente.

