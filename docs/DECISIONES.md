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
   - En producción se conecta directamente al proyecto `cosotec7`.
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

---

### [2026-10-30] — Fase 3: Motor de Cotización, Política de Redondeo Financiero y CFDI 4.0

1. **Cálculo Canónico Centralizado en el Servidor (`calcularCotizacion`):**
   - Todos los cálculos monetarios (subtotales, descuentos, viáticos, IVA y mensualidades) se ejecutan exclusivamente en centavos enteros (`integer`).
   - El cliente web solo envía identificadores, cantidades, selección de estado y opciones de plan. Ningún monto monetario proveniente del navegador es de confianza.

2. **Política de Redondeo Financiero de IVA:**
   - El IVA (16%) se calcula sobre la **base gravable total** (subtotal neto tras descuentos + viáticos):
     $$\text{ivaCentavos} = \text{Math.round}(\text{baseGravableCentavos} \times 0.16)$$
   - Esto previene la discrepancia acumulada que surgiría de redondear el IVA producto por producto de manera individual antes de sumar.

3. **División de Pagos en Esquemas Diferidos (Credi-Contado y Enganche):**
   - Para esquemas con múltiples pagos (`credi_contado` 55%/45%, `enganche_mensualidades` 55% + 2 cuotas, `msi`):
     - Las cuotas iniciales se calculan con redondeo estándar al centavo entero (`Math.round` o `Math.floor`).
     - **El último pago absorbe exactamente el residuo de centavos:**
       $$\text{montoUltimoPago} = \text{totalCentavos} - \sum \text{montosPagosPrevios}$$
     - **Garantía matemática:** La suma de todos los pagos individuales es $100\%$ idéntica al `totalCentavos` de la cotización/orden, evitando discrepancias de centavos en liquidaciones bancarias o contabilidad.

4. **Tolerancia y Manejo de Variación de $\pm 1$ Centavo en Facturación CFDI 4.0:**
   - El Anexo 20 del SAT (CFDI 4.0) permite calcular el impuesto a nivel concepto (`Concepto.Impuestos.Traslados`) con redondeo por renglón.
   - Cuando un pedido con múltiples conceptos con decimales se facture por renglón, la suma aritmética de los IVAs por concepto puede variar en $\pm \$0.01$ respecto al IVA global de la orden.
   - **Estrategia adoptada:**
     - En la Fase 4/Facturación, el generador de CFDI calculará la suma de importes e impuestos de los conceptos del XML.
     - Si existe una diferencia de $\pm 1$ centavo con el total efectivamente cobrado, el sistema aplicará el ajuste permitido por el SAT en el atributo `Descuento` de la última línea o ajustará el importe del concepto de mayor valor dentro de las reglas de validación de la matriz de errores del SAT.

5. **Regla de Descuento por Volumen y Tope de Vendedor:**
   - El descuento por volumen ($10\%$) se activa estrictamente cuando la suma de cantidades de equipos principales es **mayor a 5** ($\ge 6$). Los accesorios no cuentan para el umbral.
   - Al activarse, el $10\%$ aplica sobre todos los productos del pedido (equipos y accesorios), excluyendo viáticos.
   - Descuentos de vendedor son validados contra `topeDescuentoVendedor` (default $5\%$). Cotizaciones que excedan dicho tope son rechazadas inmediatamente por el servidor.

6. **Seguridad y Credenciales en Firebase App Hosting:**
   - El backend en la nube utiliza las credenciales por defecto de Google Cloud (Application Default Credentials - ADC) mediante `initializeApp()`.
   - El archivo `serviceAccountKey-cosotec7.json` está estrictamente ignorado en `.gitignore` y solo se destina a scripts locales administrativos. Jamás se sube a GitHub ni a App Hosting.

7. **Privacidad de Tokens, URLs Sensibles y Enlaces Revocables:**
   - Los enlaces de cotización pública `/c/[folio]?t=token` utilizan tokens aleatorios criptográficos de alta entropía (`crypto.randomBytes(24)` en base64url).
   - En Firestore nunca se almacena el token en texto claro, únicamente su hash HMAC-SHA256 (`tokenHash`).
   - La validación se realiza mediante comparación en tiempo constante (`crypto.timingSafeEqual`) para prevenir ataques de temporización.
   - Si un link se ve comprometido o el cliente solicita su invalidación, el administrador o vendedor asignado puede ejecutar `POST /api/quotes/[folio]/regenerar-link`, lo cual genera un nuevo token y reemplaza el hash, revocando instantáneamente los accesos anteriores.
   - En todas las rutas sensibles (`/c/*`, `/checkout`, `/pedido/*`), los scripts de GA4 y Meta Pixel son saneados para suprimir los query params (`t`, `token`, PII) de `page_location` y `page_path`. Adicionalmente, se configuran las cabeceras HTTP `Referrer-Policy: strict-origin-when-cross-origin` y `X-Robots-Tag: noindex, nofollow` para evitar la filtración de tokens en cabeceras Referer o indexación en motores de búsqueda.

8. **Inclusión de Instalación y Primer Año de Plataforma y Datos (Confirmado por el Cliente):**
   - **Valores confirmados:** Los 10 equipos GPS de lista, las DashCam JC181 y JC450 y todos los paquetes comerciales llevan `incluyeInstalacion: true` e `incluyePlanPrimerAnio: true`. Accesorios y complementos llevan `false`.
   - **Lógica de cálculo:** Si `incluyeInstalacion: false`, [`calcularCotizacion()`](file:///e:/3.%20Proyectos%20CreAi%20Web/CosoAVL/Web%20Page%20CosoTec/src/lib/pricing/index.ts#L271) agrega automáticamente la línea de servicio técnico correspondiente por unidad (`lineasCalculadas`) al costo estándar de instalación ($950 MXN). Si es `true`, no agrega ningún cargo extra.
   - **Costo recurrente a partir del 2° año:** Si `incluyePlanPrimerAnio: true`, la renovación anual de plataforma y datos se desglosa como costo recurrente informativo *"a partir del segundo año"* sin sumarse al total del pedido inmediato.
   - **Administración y Auditoría:** En el panel admin (`ProductModal.tsx`), ambas casillas son editables con selector de servicio de instalación cuando la instalación no está incluida. Todo cambio queda registrado en `auditLog` con `before` y `after`.
   - **Inmutabilidad por Snapshot:** Los cambios de estas casillas en el catálogo impactan únicamente a las cotizaciones futuras; las cotizaciones ya emitidas preservan intacto su snapshot de precios y líneas calculadas.

---

### [2026-10-30 / 2026-11-01] — Paso 3.4: Mercado Pago Checkout Pro, Migración a Orders API y Gestión de Secretos

> [!IMPORTANT]
> **Migración Oficial de Preferencias a la API de Orders (`/v1/orders`):**
> Mercado Pago ha anunciado la discontinuación de la API de Preferencias (`/checkout/preferences`) para nuevas aplicaciones, adoptando la **Orders API (`/v1/orders`)** como el núcleo unificado para Checkout Pro, Point y QR. La integración de CosoTec fue completamente migrada a este estándar consultando la documentación técnica vigente de Mercado Pago México:
> - **Guía General de Checkout Pro con Orders:** [developers.mercadopago.com/es/docs/checkout-pro/landing](https://www.mercadopago.com.mx/developers/es/docs/checkout-pro/landing)
> - **Referencia de API - Crear Orden (`POST /v1/orders`):** [developers.mercadopago.com/es/reference/orders/_orders/post](https://www.mercadopago.com.mx/developers/es/reference/orders/_orders/post)
> - **Referencia de API - Consultar Orden (`GET /v1/orders/{order_id}`):** [developers.mercadopago.com/es/reference/orders/_orders_id/get](https://www.mercadopago.com.mx/developers/es/reference/orders/_orders_id/get)
> - **Referencia de Webhooks y Notificaciones de Órdenes:** [developers.mercadopago.com/es/docs/your-integrations/notifications/webhooks](https://www.mercadopago.com.mx/developers/es/docs/your-integrations/notifications/webhooks)

1. **Gestión de Secretos y Configuración de Entornos (`MP_ENV`):**
   - Los secretos obligatorios (`MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `QUOTES_TOKEN_SECRET`, `CART_SESSION_SECRET`) se configuran en Google Cloud Secret Manager mediante `firebase apphosting:secrets:set`.
   - Si falta algún secreto en tiempo de ejecución en producción, `src/lib/config/secrets.ts` bloquea el arranque con `[FATAL - SECRET MANAGER]`.
   - **Detección de Sandbox con `MP_ENV`:** Para soportar las nuevas credenciales de prueba de Mercado Pago (que pueden comenzar tanto con `TEST-` como con `APP_USR-`), se incorporó la variable de entorno `MP_ENV=sandbox|production` en `apphosting.yaml`.
   - La función `isMercadoPagoSandbox()` prioriza el valor explícito de `MP_ENV` y mantiene compatibilidad heurística si el token inicia con `TEST-`. En la API de Orders, la respuesta incluye directamente el `checkout_url` que gestiona de manera transparente el entorno de pruebas (`ORDTST...`) o de producción (`ORD...`).

2. **Creación de Órdenes en Checkout Pro (`POST /v1/orders`):**
   - Las órdenes se inicializan con:
     - `type: "online"` y `processing_mode: "manual"` (requerido para redirección a Checkout Pro).
     - `capture_mode: "automatic"` (captura inmediata y directa).
     - `total_amount`: Monto total de la exhibición en centavos convertidos a pesos con 2 decimales (`montoPesos.toFixed(2)`), verificado estrictamente igual a la suma de los ítems.
     - `external_reference`: Referencia granular por exhibición (`CT-XXXXXXX:P1`, `:P2`, `:P3`).
     - Header obligatorio `X-Idempotency-Key`: UUID único generado por intento (`crypto.randomUUID()`).
   - **Restricción Estricta de Medios de Pago:** En Orders API, los medios excluidos se definen en `config.payment_method.not_allowed_types`. Se excluyen: `["ticket", "atm", "bank_transfer", "account_money", "digital_currency"]`. De este modo, únicamente se aceptan tarjetas de crédito y débito bancarias (`credit_card`, `debit_card`), evitando pagos pendientes diferidos en tiendas de conveniencia.
   - **Retorno Automático:** En `config.online` se configuran `success_url`, `failure_url`, `pending_url` y `auto_return: "approved"`.

3. **Tolerancia Cero en Validación de Montos (`total_amount` en Centavos):**
   - El monto reportado por la orden o el pago de Mercado Pago se convierte de pesos a centavos mediante:
     $$\text{montoCentavosCobrado} = \text{Math.round}(\text{total\_amount} \times 100)$$
   - Se exige **igualdad estricta (tolerancia cero)** contra el monto esperado de la cuota:
     $$\text{montoCentavosCobrado} === \text{pagoEsperado.montoCentavos}$$
   - Cualquier variación, aunque sea de 1 centavo, traslada inmediatamente la orden al estado `"revision_manual"` con motivo `"monto_discrepante"` y registra una alerta en `auditLog`.

4. **Referencia Granular por Exhibición (`external_reference = CT-XXXXXXX:P1`, `:P2`, `:P3`):**
   - Para esquemas diferidos (`credi_contado` 55%/45% y `enganche_mensualidades`), cada exhibición individual genera su propia orden en Mercado Pago con `external_reference = "${folio}:${pagoId}"`.
   - El webhook descompone el folio y la cuota objetivo (`:P1`, `:P2`, etc.) y acredita el pago exclusivamente sobre esa exhibición.
   - La orden en Firestore mantiene el estado granular de cada cuota: `estado` ("pendiente" | "aprobado" | "rechazado"), `orderMpId`, `preferenceId`, `paymentId` y `pagadoAt`.

5. **Webhook con Orders API y Validación Criptográfica:**
   - **Evento a registrar en el panel de Mercado Pago Developers:** **`Order (Mercado Pago)`** (tópico `order` / `orders`).
   - El webhook en `/api/webhooks/mercadopago`:
     - Valida `MP_WEBHOOK_SECRET === "temporal-pendiente"` (responde `503 Service Unavailable` antes de registrar la URL).
     - Valida la firma criptográfica `x-signature` reconstruyendo el hash HMAC-SHA256 con la plantilla oficial `id:[data.id];request-id:[x-request-id];ts:[ts];`.
     - Si la notificación corresponde a una orden (`type === "orders"` o `dataId.startsWith("ORD")`), consulta `GET /v1/orders/{order_id}`. Si corresponde a un evento de pago heredado, consulta `GET /v1/payments/{payment_id}`.
     - Valida idempotencia (si la cuota ya fue acreditada previamente con ese mismo ID de orden/pago, retorna `200 OK` de inmediato sin reejecutar efectos secundarios).
     - Al procesarse la orden (`status: "processed"`), actualiza Firestore, crea la cita en `installations` (para P1) y notifica por correo a soporte técnico.

6. **Protección Criptográfica en `/pedido/[folio]`:**
   - Al igual que `/c/[folio]`, la página de seguimiento `/pedido/[folio]?t=token` exige un token criptográfico no adivinable (`crypto.randomBytes(24)` en base64url).
   - En la base de datos solo vive el hash SHA-256 del token. Peticiones sin token o con token erróneo reciben pantalla de acceso denegado.
   - **Manejo de retornos de Mercado Pago (`back_urls`):** El cliente retornado a `/pedido/[folio]?t=token&mp_status=processing` ve un estado de *"Procesando pago..."*. La acreditación oficial y el cambio a `"pagado"` o `"anticipo_pagado"` es potestad exclusiva del Webhook tras validar la firma criptográfica y consultar a `/v1/orders/{id}`.

5. **Medios de Pago Permitidos en Checkout Pro:**
   - Se configuran `excluded_payment_types: [{ id: "ticket" }, { id: "bank_transfer" }, { id: "atm" }]`.
   - Únicamente se permiten tarjetas de crédito y débito.
   - Se activa `binary_mode: true` para que Mercado Pago solo retorne veredictos binarios (`approved` o `rejected`), eliminando estados pendientes diferidos de tiendas de conveniencia.

6. **Flujo de Finiquito y Mensualidades Posteriores a la Instalación:**
   - Cuando un técnico o soporte marca una orden en `installations` como `"instalada"`, el sistema genera automáticamente la preferencia para el siguiente pago pendiente (`P2` - finiquito del 45% en credi-contado o primera mensualidad en enganche) y emite la notificación con su link protegido.
   - Las mensualidades subsecuentes se programan a +30 y +60 días desde la fecha de instalación concluida (plazos configurables en `settings/pricing`). Una Cloud Function programada (`/api/cron/cobros-programados`) monitorea y notifica los vencimientos del día.

7. **Protección de Endpoints Programados (`/api/cron/*`) y Cloud Scheduler:**
   - App Hosting ejecuta contenedores basados en peticiones HTTPS y no dispone de demonio cron interno.
   - La ejecución recurrente se delega a **Google Cloud Scheduler** en el proyecto `cosotec7`.
   - Para prevenir invocaciones no autorizadas, las rutas `/api/cron/*` exigen el secreto `CRON_SECRET` mediante encabezado `Authorization: Bearer <CRON_SECRET>` o `x-cron-secret: <CRON_SECRET>`. Si las credenciales faltan o no coinciden, responden inmediatamente `401 Unauthorized`.
   - **Comandos gcloud para crear los jobs oficiales en Cloud Scheduler:**
     ```bash
     # 1. Carritos abandonados: cada 15 minutos
     gcloud scheduler jobs create http cron-carritos-abandonados \
       --project=cosotec7 \
       --location=us-central1 \
       --schedule="*/15 * * * *" \
       --uri="https://<URL-APP-HOSTING>/api/cron/carritos-abandonados" \
       --http-method=GET \
       --headers="Authorization=Bearer <CRON_SECRET>" \
       --description="Revisa carritos inactivos por más de 30 min y genera leads"

     # 2. Cobros programados: diario a las 9:00 AM (Hora de México)
     gcloud scheduler jobs create http cron-cobros-programados \
       --project=cosotec7 \
       --location=us-central1 \
       --schedule="0 9 * * *" \
       --time-zone="America/Mexico_City" \
       --uri="https://<URL-APP-HOSTING>/api/cron/cobros-programados" \
       --http-method=GET \
       --headers="Authorization=Bearer <CRON_SECRET>" \
       --description="Verifica cuotas vencidas del calendario y emite links de pago"
     ```

8. **Seguridad en Comprobantes SPEI (Nombres Generados por Servidor y Magic Bytes):**
   - El cliente nunca define la ruta ni el nombre de almacenamiento en Google Cloud Storage.
   - El servidor genera una ruta con UUID criptográfico: `comprobantes-spei/{folio}/{uuid}.{ext}`.
   - La validación del tipo de archivo no confía únicamente en la extensión o el header `content-type` del navegador; examina la secuencia binaria de cabecera (**magic bytes**):
     - JPEG: `FF D8 FF`
     - PNG: `89 50 4E 47`
     - WebP: `52 49 46 46 ... 57 45 42 50`
     - PDF: `%PDF-` (`25 50 44 46 2D`)
   - Archivos que no coincidan con su firma binaria son rechazados con `400 Bad Request`.

9. **Paso 3.6: Notificaciones Transaccionales con Resend, Limitaciones de Sandbox y Configuración DNS:**
   - **Encolamiento Resiliente (`emailQueue`):** Si `RESEND_API_KEY` falta o tiene el valor `"temporal-pendiente"`, el correo se almacena en la colección `emailQueue` con estado `"pendiente"`. El checkout del cliente y el webhook de pagos nunca se interrumpen por demoras o falta de credenciales de mensajería.
   - **Limitación del Remitente de Prueba (`onboarding@resend.dev`):**
     > [!IMPORTANT]
     > En modo de prueba (`onboarding@resend.dev`), la API de Resend **únicamente entrega correos a la dirección del propietario de la cuenta registrada en Resend**. Si se intenta enviar a otro destinatario (ej. correos de clientes o personal externo), Resend rechaza la entrega con un error 403 (*"You can only send testing emails to your own email address..."*). En dicho caso, nuestro servicio intercepta el rechazo y resguarda el correo en `emailQueue` con `estado: "error"`.
   - **Registros DNS Obligatorios para Dominio Propio en Producción:**
     Para enviar a cualquier cliente final sin restricciones desde `ventas@cosotec.com` (o `notificaciones@cosotec.com`), se debe registrar el dominio en [Resend Domains](https://resend.com/domains) y dar de alta los siguientes registros DNS en el panel del registrador:
     | Tipo | Nombre de Host | Valor / Destino | Prioridad | Propósito |
     | :--- | :--- | :--- | :---: | :--- |
     | **TXT** | `resend._domainkey` | `k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQ...` *(generado por Resend)* | — | Autenticación criptográfica DKIM |
     | **TXT** | `send` | `v=spf1 include:amazonses.com ~all` | — | Autorización de servidores SPF |
     | **MX** | `send` | `feedback-smtp.us-east-1.amazonses.com` | `10` | Manejo de rebotes (*Return-Path*) |
     | **TXT** | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@cosotec.com` | — | Política de protección DMARC |
   - **Pie de Correo Corporativo Único:**
     Todos los correos emplean una firma idéntica y estandarizada (con fallback a `settings/contact`):
     `"CosoTec by CoSoAVL · Metepec, Estado de México · ventas@cosoavl.com · Tel. 722 134 0127 · WhatsApp 722 432 2053"`.
     No se utilizan razones sociales inventadas ni canales no oficiales.



10. **Compatibilidad de Dependencias en App Hosting (
pm ci) y Versi�n de Node:**
    - **Resoluci�n de Peer Dependency ERESOLVE:**
      Durante la fase uild con 
pm ci en Firebase App Hosting, el paquete @firebase/rules-unit-testing@5.0.2 causaba conflicto de dependencias pares al requerir peer firebase@"^12.0.0", mientras el proyecto utiliza irebase@^13.1.0.
      Se aplic� la **Opci�n 1** (soluci�n oficial nativa): se actualiz� @firebase/rules-unit-testing a la versi�n ^6.0.0, la cual declara oficialmente "firebase": "^13.0.0" en sus peerDependencies. Esto resolvi� el �rbol de dependencias limpiamente sin requerir parches artificiales en overrides ni forzar .npmrc con legacy-peer-deps=true.
    - **Soporte de Node 22 y Node 24:**
      El entorno de compilaci�n de Firebase App Hosting opera sobre Node 24. Se configur� "engines": { "node": ">=22 <25" } en package.json, asegurando total compatibilidad tanto en el entorno de desarrollo local (Node 22) como en el builder de producci�n de App Hosting (Node 24).
    - **Verificaci�n Local Reproducida:**
      Se valid� el ciclo limpio completo sin banderas de omisi�n: eliminaci�n de 
ode_modules, ejecuci�n exitosa de 
pm ci, 
pm run build (Turbopack) y 
pm test (105 tests unitarios en verde).


11. **Aislamiento de Configuración de Next.js (`src/config/`) y Separación de `tsconfig.json` / `tsconfig.test.json`:**
    - **Causa del Error en App Hosting:**
      Durante la fase de build en Firebase App Hosting, el adaptador empaquetador sustituye temporalmente `next.config.ts` por su propia versión generada en tiempo de compilación. Como `tsconfig.json` incluía previamente todo el árbol de archivos (incluyendo tests), la verificación de tipos de `next build` evaluaba `src/lib/analytics/analytics-privacy.test.ts` que importaba directamente `next.config.ts`, resultando en `error TS1192: Module '"/workspace/next.config"' has no default export`.
    - **Aislamiento Modular en `src/config/`:**
      Se desacopló la lógica de configuración de la app en módulos tipados reutilizables:
      - `src/config/security-headers.ts`: Función `securityHeaders()` con las cabeceras de privacidad y seguridad (`Referrer-Policy: strict-origin-when-cross-origin` y `X-Robots-Tag: noindex, nofollow` en rutas sensibles `/c/*`, `/checkout`, `/checkout/*`, `/pedido/*`).
      - `src/config/redirects.ts`: Función `redirects()` con las 26 redirecciones 301 para conservar el posicionamiento SEO de rutas históricas de cosoavl.com.
      `next.config.ts` importa estas funciones directamente. Los tests unitarios evalúan los módulos de `src/config/` sin requerir importar el archivo de configuración raíz de Next.js.
    - **Exclusión de Tests en `tsconfig.json` de Producción y Creación de `tsconfig.test.json`:**
      - `tsconfig.json`: Se agregó a `exclude` los patrones `"**/*.test.ts"`, `"**/*.test.tsx"` y `"test/**"`. Esto previene que el compilador de producción de Next.js (`next build`) analice archivos de pruebas en la nube.
      - `tsconfig.test.json`: Configuración dedicada que hereda de `tsconfig.json` e incluye explícitamente los archivos de tests (`**/*.test.ts`, `**/*.test.tsx`, `test/**/*.ts`, `test/**/*.tsx`).
      - `package.json`: Se integró el comando `"typecheck": "tsc --noEmit -p tsconfig.test.json"` para ejecutar el typecheck integral en local y en entornos de CI sin depender de `next build`.


12. **Ajustes de Validación en Mercado Pago Orders API y Manejo Resiliente de Errores en Checkout:**
    - **Corrección de `external_reference` (`CT-XXXXXXX-P1`):**
      La API de Orders de Mercado Pago exige un patrón estricto para `external_reference` correspondiente a `^[a-zA-Z0-9_-]{1,64}$`. El uso anterior de dos puntos (`:`) provocaba error 400 (*"'$.external_reference' - does not match pattern"*). Se migró el formato a guión medio (`CT-1124451-P1`) y se implementó la función validadora `validarExternalReferenceMP()` con su regex antes de realizar cualquier llamada a `/v1/orders`. El webhook en `/api/webhooks/mercadopago` parsea de forma retrocompatible tanto el formato nuevo como el legacy.
    - **Corrección de `not_allowed_types` (Exclusión de 'wallet'):**
      En la API de Orders de Mercado Pago, `wallet` no es un valor reconocido dentro del enum oficial (`credit_card`, `debit_card`, `ticket`, `atm`, `bank_transfer`, `account_money`, `digital_currency`, `prepaid_card`). Se retiró `wallet` y se excluyen exactamente los 5 métodos no deseados: `["ticket", "atm", "bank_transfer", "account_money", "digital_currency"]`, habilitando de manera exclusiva `credit_card`, `debit_card` y `prepaid_card`.
    - **Protección contra Fuga de Información y Generación de `errorId`:**
      El endpoint `/api/checkout/crear-orden` nunca expone mensajes técnicos de Mercado Pago ni detalles internos de base de datos al cliente. En caso de fallo, registra en el servidor el error completo asociado al folio y un identificador único (`errorId`), y responde al navegador únicamente: `{ error: "No pudimos generar tu orden", errorId }`.
    - **Checkout sin `alert()` y Fallback Asistido por WhatsApp:**
      En `src/app/(public)/checkout/page.tsx` y `Step5Pago.tsx` se eliminaron completamente los `alert()` nativos del navegador. Los errores se presentan dentro de la interfaz con su código de incidencia y un botón destacado para terminar la compra vía WhatsApp (+52 722 432 2053) con el mensaje prellenado detallando los productos del carrito y el ID de incidencia.
    - **Textos de Transparencia Comercial en Paso 5:**
      - Mercado Pago: *"Tarjeta de crédito, débito o prepagada"* (eliminada mención de OXXO Pay).
      - SPEI: *"Transferencia bancaria. Te mostramos los datos para transferir; validamos tu comprobante y te confirmamos por correo."* (eliminada mención de confirmación inmediata).
      - Resumen: *"Tus datos se guardan automáticamente"* (sustituyendo "Guardado en Firestore") e *"Instalación en 48–72 horas después de confirmar tu pago"*.
