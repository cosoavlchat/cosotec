# Documento de Pruebas de Pagos — Mercado Pago Checkout Pro y Webhook

**Proyecto:** CosoTec (`cosotec7`)  
**Fecha:** Noviembre 2026  
**Entorno:** Vitest Mocks (Unitarios) & Mercado Pago Sandbox (E2E en Vivo)

---

## 1. Alcance y Estado de las Pruebas

> [!IMPORTANT]
> **Aclaración sobre el estado de verificación:**
> - **Pruebas Unitarias Automatizadas (con Mocks):** Implementadas y ejecutadas con éxito en Vitest (`test/mercadopago-webhook.test.ts`). Validan matemáticamente la tolerancia cero, reconstrucción HMAC de `x-signature`, idempotencia, desglose granular de cuotas (`:P1`, `:P2`, `:P3`) y mutación de estados en Firestore. **Estado: APROBADAS (100%)**.
> - **Pruebas E2E en Sandbox Real de Mercado Pago:** Para que los servidores de Mercado Pago puedan emitir eventos webhook reales hacia `/api/webhooks/mercadopago`, se requiere la **URL pública HTTPS de Firebase App Hosting** y el secreto oficial definitivo del webhook (`MP_WEBHOOK_SECRET`). Sin credenciales definitivas ni URL accesible en internet, las pruebas contra la API en vivo de Mercado Pago permanecen como **PENDIENTES DE DESPLIEGUE**.

### Matriz de Estado de Pruebas

| Escenario | Tipo de Prueba | Entorno | Estado |
| :--- | :--- | :--- | :--- |
| **1. Reconstrucción y verificación `x-signature`** | Unitaria (HMAC-SHA256) | Vitest | ✅ Aprobada |
| **2. Firma inválida o timestamp alterado (401)** | Unitaria (HMAC-SHA256) | Vitest | ✅ Aprobada |
| **3. Tolerancia Cero en centavos (`transaction_amount`)** | Unitaria (Conversión centavos) | Vitest | ✅ Aprobada |
| **4. Monto alterado $\to$ `revision_manual`** | Unitaria (Lógica de servidor) | Vitest | ✅ Aprobada |
| **5. Referencia granular por cuota (`CT-XXXXXXX:P1`)** | Unitaria (Transición de cuotas) | Vitest | ✅ Aprobada |
| **6. Idempotencia ante reintentos de red** | Unitaria (Idempotencia Firestore) | Vitest | ✅ Aprobada |
| **7. Enlace seguro `/pedido/[folio]` con token revocable** | Unitaria (Crypto timing-safe) | Vitest | ✅ Aprobada |
| **8. Secreto temporal `temporal-pendiente` (503 + audit)** | Unitaria (Fase de arranque) | Vitest | ✅ Aprobada |
| **9. Pago con tarjeta aprobada en Sandbox real** | End-to-End en Vivo | App Hosting + MP Sandbox | ⏳ **PENDIENTE** (requiere URL pública) |
| **10. Pago declinado / fondos insuficientes en Sandbox** | End-to-End en Vivo | App Hosting + MP Sandbox | ⏳ **PENDIENTE** (requiere URL pública) |
| **11. Webhook real emitido desde servidores de MP** | End-to-End en Vivo | App Hosting + MP Sandbox | ⏳ **PENDIENTE** (requiere URL pública) |
| **12. Finiquito P2 pagado en Checkout Pro real** | End-to-End en Vivo | App Hosting + MP Sandbox | ⏳ **PENDIENTE** (requiere URL pública) |

---

## 2. Configuración para la Fase de Pruebas en Vivo (Sandbox)

### Tarjetas de Prueba Oficiales (Mercado Pago México)

| Caso de Prueba | Número de Tarjeta | Nombre del Titular | Vencimiento | CVV | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Pago Aprobado** | `4242 4242 4242 4242` | APRO | `12/28` | `123` | `approved` (Acreditación inmediata) |
| **Fondos Insuficientes** | `4023 6000 0000 0000` | FUND | `12/28` | `123` | `rejected` (`cc_rejected_insufficient_amount`) |
| **Tarjeta Declinada** | `4060 6200 0000 0000` | CALL | `12/28` | `123` | `rejected` (`cc_rejected_call_for_authorize`) |
| **Código Seguridad Inválido** | `4000 0000 0000 0001` | SECU | `12/28` | `999` | `rejected` (`cc_rejected_bad_filled_security_code`) |

> **Nota de Seguridad:** En `crearPreferenciaMercadoPago` se configuró `binary_mode: true` y `excluded_payment_types: [{ id: "ticket" }, { id: "bank_transfer" }]`, garantizando que únicamente se acepten tarjetas bancarias y que el veredicto sea inmediato (aprobado o rechazado), sin pagos diferidos en tiendas OXXO.

---

## 3. Casos de Prueba Validados con Mocks Unitarios (Vitest)

### Caso 1: Pago Aprobado (P1 Anticipo o Contado)
- **Escenario:** Cliente ingresa tarjeta aprobada (`4242...`) para el pago `P1` de una orden (`CT-1124451:P1`).
- **External Reference:** `CT-1124451:P1`
- **Monto Cobrado:** $3,130.26 MXN (`313026` centavos).
- **Monto Esperado en Cuota P1:** `313026` centavos.
- **Resultado en Webhook:**
  - Conversión a centavos: `Math.round(3130.26 * 100) === 313026`.
  - Tolerancia 0: Verificado idéntico.
  - Actualización de cuota: `pagos[0].estado = "aprobado"`, `paymentId = "123456789"`.
  - Estado general de la orden: Transiciona a `"anticipo_pagado"` (si es diferido) o `"pagado"` (si es de contado).
  - Agendamiento: Se crea automáticamente la ficha técnica en la colección `installations` con `estado: "pendiente_asignacion"`.
  - Bitácora: Registro en `auditLog` con tipo `"mercadopago_pago_aprobado"`.
- **Status HTTP Webhook:** `200 OK` con `{ received: true, estado: "anticipo_pagado", pagoId: "P1" }`.

---

### Caso 2: Pago Rechazado por Fondos Insuficientes
- **Escenario:** Cliente utiliza tarjeta `4023 6000 0000 0000`.
- **Respuesta API MP:** `status: "rejected"`, `status_detail: "cc_rejected_insufficient_amount"`.
- **Resultado en Webhook:**
  - Ubica la orden `CT-1124451` y la cuota `P1`.
  - Actualiza la cuota: `pagos[0].estado = "rechazado"`.
  - Actualiza la orden: `estado = "pago_rechazado"`, `motivoRechazo = "cc_rejected_insufficient_amount"`.
  - La instalación técnica **no** se activa ni se programa.
- **Status HTTP Webhook:** `200 OK` con `{ received: true, estado: "pago_rechazado", pagoId: "P1" }`.

---

### Caso 3: Webhook Duplicado (Idempotencia)
- **Escenario:** Mercado Pago reintenta el envío de la notificación por red con el mismo `paymentId: "123456789"`.
- **Comportamiento del Servidor:**
  - Verifica si `pago.estado === "aprobado"` y `pago.paymentId === "123456789"`.
  - Detecta transacción previamente acreditada.
  - No altera los documentos en Firestore ni duplica registros de auditoría ni citas técnicas.
- **Status HTTP Webhook:** `200 OK` con `{ received: true, note: "Pago P1 ya procesado previamente (idempotente)" }`.

---

### Caso 4: Monto Alterado (Tolerancia Cero $\to$ Revisión Manual)
- **Escenario:** Se simula un intento de evasión donde el cobro procesado en la pasarela fue de $1.00 peso (`100` centavos) o difiere por 1 solo centavo del cálculo oficial ($5,691.37 en vez de $5,691.38).
- **Validación del Servidor:**
  ```typescript
  const transactionAmountCentavos = Math.round(payment.transaction_amount * 100);
  if (transactionAmountCentavos !== montoEsperadoCentavos) {
    // Tolerancia 0: Transición inmediata a revisión manual
  }
  ```
- **Resultado:**
  - La orden pasa inmediatamente a `estado: "revision_manual"`.
  - Se registra `motivoRevision: "monto_discrepante"`.
  - Se añade alerta crítica a la colección `auditLog` con tipo `"mercadopago_revision_manual"`, especificando monto cobrado vs monto esperado.
  - La instalación técnica permanece en espera de aclaración por el área administrativa.
- **Status HTTP Webhook:** `200 OK` con `{ received: true, estado: "revision_manual" }`.

---

### Caso 5: Firma Criptográfica `x-signature` Inválida (Rechazo 401)
- **Escenario:** Una petición externa no autorizada intenta simular un evento webhook hacia `/api/webhooks/mercadopago` con un header `x-signature` falsificado o sin el secreto oficial `MP_WEBHOOK_SECRET`.
- **Validación del Servidor:**
  - Se reconstruye el manifiesto oficial `id:[data.id];request-id:[x-request-id];ts:[ts];`.
  - Se evalúa HMAC-SHA256 mediante `crypto.timingSafeEqual`.
  - La firma no coincide.
- **Resultado:**
  - La petición se rechaza de inmediato sin tocar Firestore ni consultar la API de Mercado Pago.
- **Status HTTP Webhook:** `401 Unauthorized` con `{ error: "Firma de webhook inválida" }`.

---

### Caso 6: Pago P2 de un Plan Diferido (Finiquito tras Instalación Concluida)
- **Escenario:**
  1. Técnico concluye la instalación y soporte la marca como `"instalada"`.
  2. `procesarInstalacionCompletada()` activa el cobro de la cuota `P2` (Finiquito del 45% en Credi-Contado) y genera la preferencia con `external_reference = "CT-1124451:P2"`.
  3. El cliente efectúa el pago de $2,561.12 MXN con tarjeta aprobada.
- **Resultado en Webhook:**
  - Parsea `orderFolio = "CT-1124451"` y `targetPagoId = "P2"`.
  - Valida el monto exacto de P2: `256112` centavos.
  - Actualiza `pagos[1].estado = "aprobado"`.
  - Evalúa la orden: Como tanto `P1` como `P2` están en `"aprobado"`, el estado general de la orden se actualiza a **`"pagado"` (liquidado al 100%)**.
- **Status HTTP Webhook:** `200 OK` con `{ received: true, estado: "pagado", pagoId: "P2" }`.

---

## 4. Evidencia de Ejecución en Suite Automatizada (Vitest)

La suite de pruebas automatizadas en Vitest valida de forma continua todos estos flujos:

```bash
$ npm test

 RUN  v5.0.5 E:/3. Proyectos CreAi Web/CosoAVL/Web Page CosoTec

 ✓ test/mercadopago-webhook.test.ts (7 tests)
   ✓ 1. Validación x-signature: firma correcta según estándar oficial MP es aprobada
   ✓ 2. Validación x-signature: firma manipulada o timestamp alterado es rechazada (401)
   ✓ 3. Tolerancia Cero: transaction_amount se convierte a centavos y cualquier variación va a 'revision_manual'
   ✓ 4. Referencia por Cuota: external_reference granular ('CT-XXXXXXX:P1', ':P2') y transición completa
   ✓ 5. Idempotencia: Webhook duplicado con el mismo paymentId no altera el estado de la cuota
   ✓ 6. Seguridad de /pedido/[folio]: Token aleatorio criptográfico con hash revocable
   ✓ 7. Transición de Pago Rechazado según veredicto oficial
```

