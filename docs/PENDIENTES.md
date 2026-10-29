# Pendientes del Cliente y Proyecto — CosoTec

Lista viva de requerimientos y datos pendientes de entrega por parte del cliente CoSoAVL. Ninguno de estos puntos frena el desarrollo de la interfaz, componentes, reglas y lógica de la plataforma.

---

### 🔴 Pendientes de Infraestructura & Servicios (Requieren Plan Blaze)
- [ ] **Activar plan Blaze en el proyecto Firebase `cosoteco`**:
  - Necesario para Cloud Functions (2ª gen.) y Firebase App Hosting en producción.
  - *Estrategia actual:* Se desarrollará toda la API y backend en Next.js (App Router API routes) y Cloud Functions compatibles, pudiendo ejecutarse localmente con emuladores o despliegue intermedio.
- [ ] **Credenciales de Mercado Pago Checkout Pro**:
  - Public Key y Access Token (Sandbox para desarrollo, Producción para lanzamiento).
- [ ] **Secret Manager / Variables de producción**:
  - Claves de correo (Resend o SendGrid / Firebase Trigger Email), webhook signing secret.

---

### 🟡 Datos de Negocio y Catálogo
- [ ] **Datos bancarios oficiales para pagos SPEI**:
  - Banco, nombre del titular y CLABE interbancaria (se cargan valores editables en `settings/bank`).
- [ ] **Tabla de viáticos por estado**:
  - Definición de montos fijos por visita y por unidad adicional (estados gratuitos: CDMX, Estado de México/Toluca, Nuevo León/Monterrey, Jalisco/Guadalajara, Querétaro).
- [ ] **Precios públicos definitivos de inconsistencias detectadas**:
  - *GPS Estándar:* Lista amarilla indica $8,557.32 con IVA, pero cotizaciones recientes indican $5,500.00 con instalación y plan.
  - *GPS Portable 15-D:* Confirmar precio y características.
  - *Drones DJI Matrice 4E y Matrice 4T:* Definir precios de venta y ficha comercial.
  - *Modelo real / fabricante:* Modelos detrás de los nombres genéricos de la lista amarilla.

---

### 🟢 Contenido y Soporte
- [ ] **Directorio de contacto operativo de Soporte**:
  - Correo y número de WhatsApp del equipo de soporte para recibir las fichas de instalación automáticas.
- [ ] **Activos visuales y multimedia**:
  - Fotografías en alta resolución de equipos y accesorios con fondo blanco.
  - Fotografías reales de instalaciones terminadas.
  - Logotipos de clientes de gobierno (N.L., Tamaulipas, Puebla, etc.) y empresas privadas.
  - Videos o grabaciones de pantalla de TrackTracer, SphereGT y plataforma de video para la galería y demos.
- [ ] **Políticas y Legales**:
  - Texto oficial de garantía (aclarar contradicción entre "de por vida" vs "1 año").
  - Aviso de privacidad comercial y términos comerciales definitivos.
- [ ] **Meta / WhatsApp Business**:
  - Plantillas de WhatsApp aprobadas en Meta para seguimiento de carritos abandonados (+24h).
- [ ] **Facturación CFDI 4.0 (Fase 2)**:
  - Definir proveedor de timbrado automático (Facturapi o Facturama).

