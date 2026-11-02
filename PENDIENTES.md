# Pendientes No Bloqueantes (Post Fase 3)

Este documento registra las tareas operativas y configuraciones externas que no bloquean la funcionalidad de la plataforma ni el despliegue a producción, pero que deben atenderse conforme avance la operación comercial de CoSoAVL:

---

### 1. Webhook de Producción de Mercado Pago
* **Estado actual:** El backend en App Hosting (`cosotec`) cuenta con el secreto `MP_WEBHOOK_SECRET=temporal-pendiente` en Secret Manager y el código responde `503 Service Unavailable` controlado si no se ha configurado la firma definitiva.
* **Acción operativa:** Una vez desplegado el dominio definitivo en producción, ingresar a [Mercado Pago Developers Console](https://www.mercadopago.com.mx/developers), dar de alta la URL `https://[DOMINIO]/api/webhooks/mercadopago` seleccionando los eventos `payment` y `merchant_order`, y actualizar la versión del secreto en Google Secret Manager con la clave de firma provista.

---

### 2. Verificación de Dominio en Resend (DKIM / SPF)
* **Estado actual:** El servicio de correo cuenta con la clave `RESEND_API_KEY` en Secret Manager. Si la clave no está presente o falla en pruebas locales, los correos se encolan automáticamente en la colección `emailQueue` de Firestore con estatus `pendiente`.
* **Acción operativa:** Configurar los registros DNS `TXT` (SPF) y `CNAME` (DKIM) en el proveedor del dominio `cosoavl.com` para que Resend firme los correos transaccionales con 100% de entregabilidad hacia la bandeja de entrada de los clientes.

---

### 3. Datos Bancarios Definitivos para SPEI (`settings/bank`)
* **Estado actual:** Por directriz estricta de seguridad y prevención de fraudes, `settings/bank` tiene activado el candado `esPrueba: true`. Ningún correo ni vista web muestra datos bancarios reales inventados; se muestra la marca de agua y leyenda oficial *"CUENTA DE PRUEBA – NO TRANSFERIR"*.
* **Acción operativa:** El administrador de CoSoAVL debe capturar la CLABE Interbancaria de 18 dígitos, banco y titular fiscal definitivos desde el panel `/admin/precios` (o actualizar el documento `settings/bank` en Firestore) y desactivar la bandera `esPrueba`.

---

### 4. Terminal Punto de Venta (TPV) Presencial en Taller (Opcional)
* **Estado actual:** El flujo actual de venta en línea cubre pagos con tarjeta de crédito/débito/prepago (Mercado Pago) y transferencia bancaria directa (SPEI).
* **Acción futura:** Si CoSoAVL decide habilitar cobro presencial en el taller matriz de Metepec, podrá integrarse el SDK de Mercado Pago Point o terminal bancaria física asociada a la orden del cliente.

---

### 5. Regla de Cobro de Instalación de Accesorios (`settings/pricing.instalacionAccesorioConEquipo`)
* **Estado actual:** Se incorporó el parámetro configurable `instalacionAccesorioConEquipo` en `settings/pricing` y en el formulario de `/admin/precios`.
* **Comportamiento por defecto (`false`):** Cuando una cotización incluye un equipo principal con instalación técnica incluida (e.g., GPS Estándar), los accesorios agregados a esa unidad (e.g., Botón de Pánico, Sensor de Temperatura) **no cobran mano de obra adicional** ($0 MXN extra), ya que el técnico instalador realiza la integración completa en la misma visita técnica. Si se cotizan accesorios sueltos (sin equipo principal) o excedentes en cantidad a los equipos principales, el motor desglosa automáticamente su mano de obra técnica ($950.00 MXN s/IVA por unidad) como renglón visible.
* **Confirmación con el cliente:** Pendiente de ratificación formal con la dirección comercial de CoSoAVL si este esquema de instalación incluida para accesorios con equipo principal se mantendrá como estándar o si en casos específicos se activará el cobro separado de instalación para accesorios activando `instalacionAccesorioConEquipo: true`.

