# Pendientes del Cliente y Proyecto — CosoTec

Lista viva de requerimientos y datos pendientes de entrega por parte del cliente CoSoAVL. Ninguno de estos puntos frena el desarrollo de la interfaz, componentes, reglas y lógica de la plataforma.

---

### 🔴 Pendientes de Infraestructura & Servicios
- [x] **Activar plan Blaze en el proyecto Firebase `cosotec7`**: Activado.
- [ ] **Credenciales de Mercado Pago Checkout Pro**:
  - Public Key y Access Token (Sandbox para desarrollo, Producción para lanzamiento).
- [ ] **Secret Manager / Variables de producción**:
  - Claves de correo (Resend API key), webhook signing secret de MP.
- [ ] **IDs de Analítica (Opcionales)**:
  - Google Analytics 4 (`G-XXXXXXXXXX`) y Meta Pixel (`XXXXXXXXXXXXXXXX`), configurables en `settings/analytics`.

---

### 🟡 Datos de Negocio y Catálogo
- [ ] **Datos bancarios oficiales para pagos SPEI (CANDADO OBLIGATORIO DE SALIDA A PRODUCCIÓN)**:
  - Reemplazar datos de prueba por cuenta fiscal real (Banco, Titular oficial, CLABE de 18 dígitos).
  - *Candado del sistema:* El panel administrativo muestra alerta roja permanente y el despliegue final a producción fallará si `settings/bank.esPrueba === true`. Actualmente está configurado con `esPrueba: true`, titular *"CUENTA DE PRUEBA – NO TRANSFERIR"* y banco *"Banco de prueba"*.
- [x] **Inclusión de instalación y primer año en precios de lista de GPS (CONFIRMADO POR EL CLIENTE)**:
  - Confirmado: Los 10 GPS de lista, las DashCam JC181 y JC450 y todos los paquetes llevan `incluyeInstalacion: true` e `incluyePlanPrimerAnio: true`. Accesorios y complementos llevan `false`. Configurado en seed, catálogo y reglas de cotización.
- [ ] **Tope máximo de descuento de vendedor**:
  - Confirmar tope autorizado de descuento aplicable por el vendedor (actualmente configurado con valor provisional del 5% en `settings/pricing.descuentoVendedorTope`).
- [ ] **Tabla de viáticos por estado**:
  - Definición de montos fijos por visita y por unidad adicional (estados gratuitos: CDMX, Estado de México/Toluca, Nuevo León/Monterrey, Jalisco/Guadalajara, Querétaro).
- [ ] **Precios públicos definitivos de inconsistencias detectadas**:
  - *GPS Estándar:* Lista amarilla indica $8,557.32 con IVA, pero cotizaciones recientes indican $5,500.00 con instalación y plan.
  - *GPS Portable 15-D:* Confirmar precio y características.
  - *Drones DJI Matrice 4E y Matrice 4T:* Definir precios de venta y ficha comercial.
  - *Modelo real / fabricante:* Modelos detrás de los nombres genéricos de la lista amarilla.

---

### 🟢 Contenido y Soporte
- [ ] **URL oficial de la Plataforma de Video DashCam**:
  - Necesaria para completar el botón de acceso en `/acceso`. (TrackTracer y SphereGT ya cuentan con sus URLs).
- [ ] **Políticas y Legales Definitivas**:
  - Texto oficial de garantía (aclarar contradicción entre "de por vida" vs "1 año"). Mientras tanto, se muestra como borrador con aviso "Documento en revisión".
  - Aviso de privacidad comercial y términos comerciales definitivos.
- [ ] **Directorio de contacto operativo de Soporte**:
  - Correo y número de WhatsApp del equipo de soporte para recibir las fichas de instalación automáticas.
- [ ] **Activos visuales y multimedia**:
  - Fotografías en alta resolución de equipos y accesorios con fondo blanco.
  - Fotografías reales de instalaciones terminadas.
  - Logotipos de clientes de gobierno (N.L., Tamaulipas, Puebla, etc.) y empresas privadas.
  - Videos o grabaciones de pantalla de TrackTracer, SphereGT y plataforma de video para la galería y demos.
- [ ] **Meta / WhatsApp Business**:
  - Plantillas de WhatsApp aprobadas en Meta para seguimiento de carritos abandonados (+24h).
- [ ] **Facturación CFDI 4.0 (Fase 2 / Fase 3)**:
  - Definir proveedor de timbrado automático (Facturapi o Facturama).
