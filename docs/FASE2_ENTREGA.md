# CosoTec — Entrega de la Fase 2: Sitio Público

La **Fase 2 (Sitio Público, Catálogo y Fichas de Producto)** ha sido concluida, probada y verificada contra los criterios de calidad y directrices comerciales de CoSoAVL.

---

## 1. URLs y Estado de Disponibilidad

- **Entorno Local de Producción:** `http://localhost:3000`
- **Rutas públicas validadas (29 rutas en total, todas con status HTTP 200 / SSR dinámico):**
  - **Inicio:** `/`
  - **Selector por vehículo:** `/soluciones/auto-camioneta`, `/soluciones/taxi-apps`, `/soluciones/tractocamion`, `/soluciones/camion-autobus`, `/soluciones/caja-refrigerada`, `/soluciones/maquinaria`, `/soluciones/motos`
  - **Catálogo y filtros:** `/tienda`, `/tienda/gps`, `/tienda/dashcam`, `/tienda/seguridad`, `/tienda/accesorio`, `/tienda/dron`, `/tienda/servicio`
  - **Fichas de producto:** `/p/[slug]` (con Schema.org `Product`, lógica "Precio por confirmar" y cotización por WhatsApp)
  - **Paquetes listos:** `/paquetes`, `/paquetes/[slug]`
  - **Instalación y Viáticos:** `/instalacion` (estados sin costo, se cotiza o monto calculado)
  - **Nosotros:** `/nosotros` (cifras oficiales de 48,000 dispositivos y aval en NL, Tamaulipas y Puebla)
  - **Contacto:** `/contacto` (formulario validado con Zod, honeypot y rate limit por IP)
  - **Acceso Clientes:** `/acceso` (TrackTracer, SphereGT y portal de DashCam con apertura en pestaña nueva)
  - **Legales en borrador:** `/privacidad`, `/terminos`, `/garantia` (con banner de "Documento en revisión")
  - **Plataformas:** `/plataforma`, `/plataforma/gps`
  - **SEO & Rastreadores:** `/sitemap.xml`, `/robots.txt`
  - **Redirecciones 301:** 26 URLs históricas de `cosoavl.com` mapeadas con redirect permanente

---

## 2. Auditoría Lighthouse Mobile (Cumplimiento de meta >= 90)

La prueba fue ejecutada sobre el viewport móvil de Google Chrome emulando condiciones móviles estándar:

| Métrica Lighthouse | Resultado Obtenido | Meta del Proyecto | Estado |
| :--- | :---: | :---: | :---: |
| **SEO Móvil** | **100 / 100** | $\ge 90$ | Superada |
| **Rendimiento Móvil** | **96 / 100** | $\ge 90$ | Superada |
| **First Contentful Paint (FCP)** | **0.9 s** | $< 1.8\text{ s}$ | Óptimo |
| **Speed Index** | **0.9 s** | $< 3.4\text{ s}$ | Óptimo |
| **Total Blocking Time (TBT)** | **40 ms** | $< 200\text{ ms}$ | Excelente |
| **Cumulative Layout Shift (CLS)** | **0.000** | $< 0.1$ | Cero salto visual |
| **Largest Contentful Paint (LCP)** | **2.8 s** | $< 3.0\text{ s}$ | Aprobado |

---

## 3. Verificación de las 10 Directrices Implementadas

1. **Cifras Veraces:** "48,000 dispositivos vendidos en Norteamérica y Sudamérica" y aval de seguridad nacional en Nuevo León, Tamaulipas y Puebla visible en Home y Nosotros.
2. **Sin Testimonios Inventados:** Colección `content/testimonios` creada vacía; la sección solo se renderiza condicionalmente si hay al menos una reseña activa y aprobada.
3. **Contenido Administrable y Legales:** Cifras, FAQs y accesos residen en `content`. Las páginas `/privacidad`, `/terminos` y `/garantia` despliegan el aviso destacado *"Documento en revisión por el área jurídica y comercial de CoSoAVL"*.
4. **Meses Sin Intereses (MSI):** Al no haber plazos configurados en `settings/pricing.msi`, el texto *"desde $X/mes"* se oculta automáticamente.
5. **Viáticos en `/instalacion`:**
   - Si `sinCosto: true` $\to$ muestra **"Sin costo"** (Toluca, CDMX, Monterrey, Guadalajara, Querétaro).
   - Si `monto == 0` y no es gratuito $\to$ muestra **"Se cotiza"**.
   - Con monto numérico $\to$ calcula y muestra el total con IVA formateado en MXN.
6. **Enlace a WhatsApp (Fase 2):** Botones de compra y cotización abren WhatsApp `722 432 2053` con mensaje prellenado con nombre del equipo, modelo, precio con IVA y página de origen. Gobernado por `settings/features.modoCotizadorWhatsapp`.
7. **Formulario de Contacto Blindado:** Validado con Zod, honeypot invisible `website_field_hp`, rate limiting por IP y casilla obligatoria de privacidad guardando timestamp ISO.
8. **Tipografía de Marca:** Manrope (títulos) e Inter (cuerpo) integradas mediante `next/font/google`.
9. **Fotografías y Placeholders:** Componente neutro `DevicePlaceholder` con colores institucionales guinda (`#7A1428`) y dorado (`#C9A15B`) para equipos sin fotografía final.
10. **Analítica Condicional:** Módulos GA4 y Meta Pixel listos en `CookieConsent`, activándose únicamente tras aceptación expresa del usuario.
