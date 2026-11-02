# CosoTec — Especificación del e-commerce y panel administrativo
**Fecha:** Octubre 2026 · **Autor:** @CreAi Studios  
**Cliente:** CoSoAVL (Metepec, Estado de México)

---

## 1. Resumen y decisiones
CosoTec es la nueva tienda en línea de CoSoAVL: vende e instala GPS, DashCams, seguridad para transporte y drones, y reemplaza a `cosoavl.com` cuando esté lista. Es a la vez tienda pública, cotizador para vendedores, CRM ligero e intercambio de datos con el chatbot de Meta. Todo vive en el proyecto Firebase `cosotec7`.

### Objetivos
1. Que un cliente pueda armar, pagar y agendar su instalación sin hablar con nadie.
2. Que el chatbot mande links exactos de compra o cotización con el precio calculado por el sistema.
3. Que los vendedores generen cotizaciones con diseño profesional en PDF desde el panel, sin Excel.
4. Que ningún prospecto se pierda: el sistema guarda sus datos desde el primer interés.
5. Que soporte reciba la ficha completa de cada instalación.

### Decisiones tomadas
| Tema | Decisión |
| :--- | :--- |
| **Dominio** | Arranca en la URL de Firebase; después `cosotec.com` y redirecciones desde `cosoavl.com` |
| **Catálogo** | GPS, DashCams, Seguridad, Accesorios y Drones (DJI Matrice 4E y 4T); todo editable desde el admin |
| **Nombres** | Nombre comercial como título; modelo (JC181, JC450…) como dato secundario |
| **Precios** | Públicos, con IVA incluido; 10% de descuento al comprar más de 5 unidades, en todo el catálogo |
| **Pagos** | Tarjeta con Mercado Pago (contado o MSI) y transferencia SPEI con comprobante |
| **Factura** | Fase 1: se capturan datos CFDI 4.0 y administración factura; después se automatiza por API |
| **Viáticos** | Por estado, tabla editable; sin costo en Toluca, CDMX, Monterrey, Guadalajara y Querétaro |
| **Instalaciones** | Sin límite de cupo; a soporte le llega la ficha completa |
| **Chatbot** | Hecho con Claude, corre en Hostinger + Easypanel, canales de Meta; consume la API de CosoTec |
| **Humano** | No se deriva a vendedor si el cliente puede pagar; pero se guarda su teléfono para seguimiento |
| **Contacto** | ventas@cosoavl.com · Matriz Toluca 722 134 0127 · WhatsApp 722 432 2053 |
| **Plataformas cliente** | TrackTracer, SphereGT y la plataforma de video siguen activas; se enlazan en "Acceso clientes" |

---

## 2. Arquitectura técnica
Una sola aplicación Next.js sirve la tienda, el panel admin y la API; Firebase guarda los datos y corre los procesos en segundo plano. El chatbot nunca toca la base de datos: siempre pasa por la API, que es donde vive la lógica de precios.

| Pieza | Servicio | Para qué |
| :--- | :--- | :--- |
| **Sitio + admin + API** | Next.js (App Router, TypeScript) en Firebase App Hosting | Páginas públicas con SSR para SEO, panel admin y rutas `/api/*` |
| **Base de datos** | Cloud Firestore | Catálogo, leads, carritos, cotizaciones, pedidos, instalaciones |
| **Usuarios y roles** | Firebase Auth + custom claims | Admin, vendedor, soporte; clientes como invitados |
| **Archivos** | Cloud Storage | Fotos de producto, PDFs de cotización, comprobantes SPEI, constancias fiscales |
| **Procesos en segundo plano** | Cloud Functions (2ª gen.) | Webhook de Mercado Pago, avisos a soporte, seguimiento de carritos abandonados, folios |
| **Pagos** | Mercado Pago Checkout Pro | Tarjeta de contado y MSI |
| **Secretos** | Secret Manager | API key del chatbot, token de Mercado Pago, credenciales de correo y WhatsApp |
| **Correo** | Extensión Trigger Email de Firebase o Resend | Cotizaciones, confirmaciones, ficha de instalación |

### Requisitos del proyecto `cosotec7`
- Plan Blaze (pago por uso): lo exigen App Hosting y Cloud Functions.
- Región sugerida: `us-central1`.
- App Hosting entrega su propio dominio por defecto; `cosotec.com` se conecta después como dominio personalizado.

### Reglas de oro
1. **El precio siempre se calcula en el servidor:** La web, el chatbot y el panel usan la misma función `calcularCotizacion()`. Ningún cliente manda precios; solo manda productos y cantidades.
2. **Snapshot histórico:** Cada cotización guarda una copia de los precios con los que se emitió; si cambia el catálogo, la cotización vieja no cambia.
3. **Links seguros:** Los links públicos llevan folio + token: `/c/CT-1124451?t=<token>`.
4. **Firestore Security Rules:** El público solo lee el catálogo activo y contenido; todo lo demás se escribe por la API o por usuarios con rol.

---

## 3. Roles y permisos
Cuatro tipos de persona usan el sistema; el cliente no necesita cuenta para comprar.

| Rol | Entra a | Puede | No puede |
| :--- | :--- | :--- | :--- |
| **Visitante / cliente** | Sitio público, cotización por link, seguimiento por folio | Cotizar, comprar, pagar, subir comprobante SPEI, pedir factura, agendar | Ver nada de otros clientes |
| **Vendedor** | Panel: Cotizaciones, Clientes, Leads, Modo demo | Crear y enviar cotizaciones; aplicar descuento hasta el tope fijado; ver sus leads y clientes | Cambiar precios del catálogo; ver leads de otros vendedores (configurable) |
| **Soporte / instalaciones** | Panel: Instalaciones, Pedidos (solo lectura) | Ver fichas, cambiar estado, reprogramar, subir evidencia y número de serie instalado | Tocar precios o cotizaciones |
| **Administrador** | Todo el panel | Catálogo, precios, reglas, viáticos, usuarios, validar SPEI, facturas, API keys, contenido | — |

---

## 4. Estructura de Páginas y Vistas

### Vista pública
- `/`: Inicio (Hero animado, selector "¿Qué quieres proteger?", paquetes destacados, 4 pasos, cifras de confianza, testimonios, FAQ)
- `/soluciones/[tipo]`: Páginas por tipo de unidad (auto/camioneta, taxi y apps, camión/volteo/autobús, tractocamión, caja seca/refrigerada, maquinaria, motos)
- `/tienda` y `/tienda/[categoria]`: Catálogo con filtros por tipo de unidad y objetivo
- `/p/[slug]`: Ficha de producto
- `/paquetes` y `/paquetes/[slug]`: Kits listos con link de compra
- `/cotizar`: Asistente de 6 pasos con URL params
- `/carrito` y `/checkout`: Resumen, datos, instalación, unidades, factura, pago
- `/c/[folio]?t=`: Cotización pública con botón de pago / PDF
- `/pedido/[folio]`: Seguimiento de compra e instalación, carga de SPEI
- `/plataforma`, `/plataforma/gps`, `/plataforma/dashcam`: Demos interactivos
- `/instalacion`: Cobertura, tiempos y viáticos
- `/nosotros`, `/contacto`, `/privacidad`, `/terminos`, `/garantia`
- `/acceso`: Acceso a TrackTracer, SphereGT y plataforma de video

### Panel Admin (`/admin`)
- `/admin`: Dashboard (ventas, cotizaciones abiertas, carritos abandonados, instalaciones, leads)
- `/admin/cotizaciones`: Cotizador de vendedores, listado, estados
- `/admin/clientes`: Directorio y fichas de clientes
- `/admin/leads`: Leads y carritos abandonados por origen
- `/admin/pedidos`: Pagos MP y validación de transferencias SPEI
- `/admin/instalaciones`: Calendario, asignación de técnicos, evidencia
- `/admin/facturacion`: Solicitudes CFDI 4.0
- `/admin/catalogo`: Productos, paquetes, accesorios, drones
- `/admin/precios`: IVA, descuentos volumen, tope vendedor, viáticos por estado, MSI
- `/admin/contenido`: Banners, testimonios, FAQ, términos, datos bancarios
- `/admin/usuarios`: Gestión de roles y personal
- `/admin/integraciones`: API keys y webhooks para Chatbot y MP
- `/admin/bitacora`: Logs de auditoría

---

## 5. Modelo de Datos (Firestore)
1. `products`: Catálogo de productos, equipos y accesorios
2. `packages`: Paquetes y kits comerciales
3. `settings/pricing`: IVA, descuentos por volumen, tope vendedor, MSI, ciudades sin costo
4. `travelFees`: Viáticos por estado
5. `settings/contact` & `settings/bank`: Teléfonos, correo, horarios; banco, titular, CLABE
6. `leads`: Prospectos y sesiones
7. `carts`: Carritos en curso y abandonados
8. `customers`: Directorio de clientes y flotillas
9. `quotes`: Cotizaciones con folio `CT-XXXXXXX` y snapshot de precios
10. `orders`: Pedidos y pagos (MP / SPEI)
11. `installations`: Órdenes de servicio técnico y agendamiento
12. `invoiceRequests`: Datos fiscales CFDI 4.0
13. `users`: Usuarios del panel y roles
14. `apiKeys`: Claves de API con hash para chatbot
15. `counters/folios`: Contador atómico de folios
16. `auditLog`: Bitácora de cambios

---

## 6. Diseño Visual
- **Vino principal:** `#7A1428` (Botones principales, encabezados, hero)
- **Vino oscuro:** `#4A0C18` (Fondos secciones oscuras, footer)
- **Rojo marca:** `#C8102E` (Alertas en demos, acentos)
- **Dorado:** `#C9A15B` (Acentos finos: íconos, sellos)
- **Blanco:** `#FFFFFF` (Fondo principal)
- **Gris claro:** `#F5F3F2` (Tarjetas y fondos alternos)
- **Carbón:** `#1C1C1E` (Texto principal)
- **Tipografías:** Manrope (títulos), Inter (cuerpo)

---

## 7. Fases de Desarrollo
1. **Fase 1: Base y catálogo**
2. **Fase 2: Sitio público**
3. **Fase 3: Cotizador, carrito, checkout y pagos**
4. **Fase 4: Panel de vendedores y CRM**
5. **Fase 5: API del chatbot**
6. **Fase 6: Nuestra plataforma (demos interactivos)**

