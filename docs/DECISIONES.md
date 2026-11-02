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

### [2026-10-30] — Paso 3.4: Mercado Pago Checkout Pro, Gestión de Secretos en App Hosting y Tolerancia Cero

1. **Gestión de Secretos en Firebase App Hosting (`apphosting.yaml` y Secret Manager):**
   - Los secretos del servidor (`MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `QUOTES_TOKEN_SECRET`, `CART_SESSION_SECRET`) no se guardan en el repositorio ni en variables de entorno públicas.
   - Se aprovisionan mediante el comando oficial de Firebase CLI:
     ```bash
     firebase apphosting:secrets:set MP_ACCESS_TOKEN
     firebase apphosting:secrets:set MP_WEBHOOK_SECRET
     firebase apphosting:secrets:set QUOTES_TOKEN_SECRET
     firebase apphosting:secrets:set CART_SESSION_SECRET
     ```
   - Este comando crea automáticamente el secreto en Google Cloud Secret Manager del proyecto `cosotec7` y otorga permisos de lectura (`roles/secretmanager.secretAccessor`) a la cuenta de servicio de App Hosting (`service-358372577691@gcp-sa-apphosting.iam.gserviceaccount.com`).
   - En `apphosting.yaml` se referencian bajo la clave `env:` para su inyección segura en tiempo de ejecución.
   - **Fallo preventivo al arrancar:** En `src/lib/config/secrets.ts`, si alguno de estos secretos obligatorios no está presente al arrancar en producción, la aplicación arroja un error crítico inmediato (`[FATAL - SECRET MANAGER]`), bloqueando la ejecución para evitar procesar transacciones en estados inconsistentes.

2. **Tolerancia Cero en Validación de Montos (`transaction_amount` en Centavos):**
   - El monto reportado por Mercado Pago se convierte de pesos a centavos mediante:
     $$\text{montoCentavos} = \text{Math.round}(\text{payment.transaction\_amount} \times 100)$$
   - Se exige **igualdad estricta (tolerancia cero)** contra el monto esperado del pago en centavos:
     $$\text{montoCentavos} === \text{pagoEsperado.montoCentavos}$$
   - Cualquier variación, aunque sea de 1 centavo, traslada inmediatamente la orden al estado `"revision_manual"` con motivo `"monto_discrepante"` y registra una alerta en `auditLog`.

3. **Referencia Granular por Exhibición (`external_reference = CT-XXXXXXX:P1`, `:P2`, `:P3`):**
   - Para soportar planes diferidos (`credi_contado` 55%/45% y `enganche_mensualidades`), cada exhibición individual genera su propia preferencia de pago en Mercado Pago con `external_reference = "${folio}:${pagoId}"`.
   - El webhook parsea el folio y el identificador de pago (`:P1`, `:P2`, etc.) y valida el monto exclusivamente contra esa cuota específica.
   - La orden en Firestore mantiene el estado granular de cada cuota: `estado` ("pendiente" | "aprobado" | "rechazado"), `preferenceId`, `paymentId` y `pagadoAt`.

4. **Protección Criptográfica en `/pedido/[folio]`:**
   - Al igual que `/c/[folio]`, la página de seguimiento `/pedido/[folio]?t=token` exige un token criptográfico no adivinable (`crypto.randomBytes(24)` en base64url).
   - En la base de datos solo vive el hash SHA-256 del token. Peticiones sin token o con token erróneo reciben pantalla de acceso denegado.
   - **Manejo de retornos de Mercado Pago (`back_urls`):** El cliente retornado a `/pedido/[folio]?t=token&mp_status=processing` ve un estado de *"Procesando pago..."*. La acreditación oficial y el cambio a `"pagado"` o `"anticipo_pagado"` es potestad exclusiva del Webhook tras validar la firma criptográfica y consultar a `/v1/payments/{id}`.

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

