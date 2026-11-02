# Guía de Operación y Verificación — Fase 1 (Base y Catálogo)

**Proyecto Firebase:** `cosotec7`  
**Cliente:** CoSoAVL (Metepec, Edomex)

---

## 1. Cómo correr el entorno y emuladores

### Modo Rápido (Desarrollo sin dependencias externas)
La aplicación cuenta con sincronización automática en `.data/local-seed.json`. Puedes levantar el servidor inmediatamente sin necesidad de tener Java instalado:
```bash
npm run dev
```
Abre tu navegador en: [http://localhost:3000](http://localhost:3000) o directo al panel en [http://localhost:3000/admin](http://localhost:3000/admin).

### Modo Firebase Emulator Suite (Firestore, Auth, Storage)
Para ejecutar los emuladores oficiales de Firebase (requiere Java JRE):
```bash
npx firebase emulators:start --only firestore,auth,storage
```
Puertos configurados:
- **Auth Emulator:** `localhost:9099`
- **Firestore Emulator:** `localhost:8080`
- **Storage Emulator:** `localhost:9199`
- **Emulator UI:** `localhost:4000`

---

## 2. Cómo ejecutar el Seed del Catálogo

### En entorno Local / Emuladores
```bash
npm run seed:local
```
- Lee los datos oficiales de `scripts/seed-data.ts`.
- Usa el `slug` como ID de documento para garantizar **idempotencia** total (no duplica si se vuelve a correr).
- Guarda todos los precios en **centavos enteros sin IVA** (ej. $5,500.00 -> `550000`).
- Marca `revisarPrecio: true` en GPS Esencial y GPS Portable 15-D.
- Marca `activo: false` en los drones DJI Matrice 4E y 4T.
- Carga los 32 estados de México en `travelFees`, con costo $0 y marcando como **sin costo** a Toluca/Edomex, CDMX, Monterrey, Guadalajara y Querétaro.

### En Producción (`cosotec7`) — Comando explícito documentado
> [!CAUTION]
> El seed a producción sobreescribe datos maestros en el proyecto `cosotec7` en la nube. Requiere credenciales de cuenta de servicio de Firebase.

```bash
# 1. Exporta la credencial de cuenta de servicio de cosotec7:
# En PowerShell:
$env:FIREBASE_SERVICE_ACCOUNT_KEY = Get-Content path/to/serviceAccountKey.json -Raw
# 2. Ejecuta el seed hacia producción:
npm run seed:prod
```

---

## 3. Cómo crear el primer Administrador y asignar roles

### Con el script CLI (`scripts/set-role.ts`)
```bash
npx tsx scripts/set-role.ts admin@cosoavl.com admin
```
Parámetros:
1. `correo`: Correo electrónico del usuario (ej. `admin@cosoavl.com`)
2. `rol`: `admin` | `vendedor` | `soporte`

El script:
1. Crea o busca al usuario en Firebase Auth. Si es nuevo, genera una contraseña temporal segura y la muestra una sola vez en terminal.
2. Le asigna el Custom Claim `role: 'admin'`.
3. Sincroniza su ficha en la colección `users/{uid}`.
4. Genera un registro en `auditLog`.

### Desde la interfaz web (`/admin/usuarios`)
1. Ingresa a [http://localhost:3000/admin/usuarios](http://localhost:3000/admin/usuarios).
2. Haz clic en **"Dar de Alta Usuario"**.
3. Ingresa nombre, correo, contraseña y selecciona el rol (`admin`, `vendedor`, `soporte`).
4. Si es vendedor, asigna el **tope de descuento** (ej. 5%).
5. Al enviar, el backend asigna el custom claim y registra la acción en `auditLog`.

---

## 4. Verificación de criterios de "Listo cuando"

| Criterio de la especificación | Cómo probarlo | Resultado esperado |
| :--- | :--- | :--- |
| **1. Admin crea un producto nuevo** | Ve a `/admin/catalogo`, clic en "Nuevo Producto", llena nombre, modelo, precio sin IVA (ej. 4500) y sube una foto o URL. Clic en "Guardar Producto". | El producto aparece en la tabla con su precio sin IVA, cálculo automático de IVA y total, y se registra en `auditLog`. |
| **2. Admin edita un producto existente** | En la fila de cualquier producto (ej. "GPS Flotilla Pro"), clic en el icono de lápiz (Editar). Cambia el precio o nombre y guarda. | El cambio se actualiza inmediatamente en el listado y queda registrado el valor anterior y nuevo en `auditLog`. |
| **3. Admin oculta / activa un producto** | En la tabla de `/admin/catalogo`, clic en el icono de ojo (`Eye` / `EyeOff`). | El estado cambia entre **Activo** y **Oculto** al instante; cuando esté oculto no se mostrará a clientes públicos. |
| **4. Vendedor no puede editar precios ni catálogo** | En la barra lateral izquierda, cambia el "Simulador de Rol" a **Vendedor**. | El botón "Nuevo Producto" y los botones de edición quedan bloqueados, indicando "Modo Solo Lectura: Como vendedor no tienes permisos para alterar precios ni catálogo". |
| **5. Precios y Reglas editables** | Ve a `/admin/precios`. Modifica el IVA (16%), el umbral de descuento por volumen (5 unidades), o cambia el costo de viático de un estado. Clic en "Guardar Reglas". | Las reglas se guardan y quedan listas para el motor de cotizaciones. |
| **6. Pruebas unitarias de precios** | Ejecuta en terminal: `npm test` | Vitest corre 6 pruebas automatizadas validando cálculo de IVA en centavos exacto, desglose y formato MXN. |

---

## 5. Arquitectura de Seguridad en Fase 1
- **Regla de Centavos:** Toda la base de datos almacena números enteros en centavos (`precioSinIvaCentavos`, `montoPorVisitaCentavos`). Ningún float se guarda en Firestore.
- **Doble barrera de permisos:**
  1. **Barrera de Servidor:** Rutas de API y Server Actions validan con Zod y verifican permisos de sesión.
  2. **Barrera de Base de Datos:** `firestore.rules` prohíbe escrituras a quien no tenga el custom claim `request.auth.token.role == 'admin'`.
- **Datos Bancarios Protegidos:** `settings/bank` tiene `allow read: if isAdmin();` y nunca es accesible públicamente.

