import { adminDb, isFirestoreReady, recordAuditLog } from "@/lib/firebase/admin";
import { Customer, CustomerInput } from "@/types/customer";
import { UserRole } from "@/types/user";
import { normalizarWhatsapp, formatearWhatsapp } from "@/lib/utils/whatsapp";

interface ServiceUser {
  uid: string;
  email: string;
  nombre?: string;
  role: UserRole;
}

export interface CheckWhatsappResult {
  disponible: boolean;
  asignadoAOtro: boolean;
  customerId?: string;
  customer?: Customer;
  mensaje?: string;
}

/**
 * Verifica si un número de WhatsApp ya está registrado en la base de clientes.
 * Si pertenece a otro vendedor y el usuario actual es vendedor, no expone datos sensibles.
 */
export async function checkCustomerWhatsapp(
  whatsappInput: string,
  user: ServiceUser
): Promise<CheckWhatsappResult> {
  const norm = normalizarWhatsapp(whatsappInput);
  if (!norm || norm.length < 10) {
    return { disponible: false, asignadoAOtro: false, mensaje: "Número de WhatsApp no válido (se requieren 10 dígitos)." };
  }

  if (!(await isFirestoreReady())) {
    return { disponible: true, asignadoAOtro: false };
  }

  const snap = await adminDb
    .collection("customers")
    .where("whatsapp", "==", norm)
    .limit(1)
    .get();

  if (snap.empty) {
    return { disponible: true, asignadoAOtro: false };
  }

  const doc = snap.docs[0];
  const data = doc.data() as Customer;

  // Si pertenece al mismo vendedor o el usuario es admin
  if (data.vendedorId === user.uid || user.role === "admin") {
    return {
      disponible: true,
      asignadoAOtro: false,
      customerId: doc.id,
      customer: { ...data, id: doc.id },
    };
  }

  // Pertenece a otro vendedor: Proteger datos por privacidad
  return {
    disponible: false,
    asignadoAOtro: true,
    customerId: doc.id,
    mensaje: "Cliente asignado a otro asesor",
  };
}

/**
 * Obtiene la lista de clientes respetando permisos por rol:
 * - Vendedor: solo sus clientes asignados.
 * - Admin: todos los clientes (opcionalmente filtrados por vendedorId).
 */
export async function getCustomers(
  user: ServiceUser,
  filtroVendedorId?: string
): Promise<Customer[]> {
  if (!(await isFirestoreReady())) return [];

  let query: FirebaseFirestore.Query = adminDb.collection("customers");

  if (user.role === "vendedor") {
    query = query.where("vendedorId", "==", user.uid);
  } else if (filtroVendedorId) {
    query = query.where("vendedorId", "==", filtroVendedorId);
  }

  let snap;
  try {
    snap = await query.orderBy("updatedAt", "desc").get();
  } catch {
    snap = await query.get();
  }
  const customers = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Customer));
  customers.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
  return customers;
}

/**
 * Busca clientes por nombre, empresa, WhatsApp normalizado o RFC.
 */
export async function searchCustomers(
  queryText: string,
  user: ServiceUser
): Promise<Customer[]> {
  const all = await getCustomers(user);
  if (!queryText.trim()) return all.slice(0, 50);

  const q = queryText.toLowerCase().trim();
  const normQ = normalizarWhatsapp(queryText);

  return all.filter((c) => {
    const matchNombre = c.nombre?.toLowerCase().includes(q);
    const matchEmpresa = c.empresa?.toLowerCase().includes(q);
    const matchRfc = c.rfc?.toLowerCase().includes(q);
    const matchTel = normQ ? c.whatsapp.includes(normQ) : false;
    return matchNombre || matchEmpresa || matchRfc || matchTel;
  });
}

/**
 * Obtiene un cliente por su ID validando permisos.
 */
export async function getCustomerById(
  id: string,
  user: ServiceUser
): Promise<Customer | null> {
  if (!(await isFirestoreReady())) return null;

  const doc = await adminDb.collection("customers").doc(id).get();
  if (!doc.exists) return null;

  const data = { id: doc.id, ...doc.data() } as Customer;

  // Si es vendedor y no le pertenece, no permitir acceso
  if (user.role === "vendedor" && data.vendedorId !== user.uid) {
    throw new Error("No tienes permiso para ver este cliente. Asignado a otro asesor.");
  }

  return data;
}

/**
 * Crea un nuevo cliente con deduplicación por WhatsApp normalizado.
 */
export async function createCustomer(
  input: CustomerInput,
  user: ServiceUser
): Promise<Customer> {
  if (!input.nombre?.trim()) throw new Error("El nombre del cliente es obligatorio.");
  const norm = normalizarWhatsapp(input.whatsapp);
  if (!norm || norm.length !== 10) {
    throw new Error("El WhatsApp es obligatorio y debe contener 10 dígitos numéricos.");
  }

  const check = await checkCustomerWhatsapp(norm, user);
  if (check.asignadoAOtro) {
    throw new Error("Cliente asignado a otro asesor. Puedes solicitar la reasignación al administrador.");
  }
  if (!check.disponible && check.customer) {
    return check.customer; // Ya existe en su cartera
  }

  const now = new Date().toISOString();
  const customerDoc: Omit<Customer, "id"> = {
    nombre: input.nombre.trim(),
    empresa: input.empresa?.trim() || "",
    whatsapp: norm,
    whatsappDisplay: formatearWhatsapp(norm),
    correo: input.correo?.trim() || "",
    rfc: input.rfc?.toUpperCase().trim() || "",
    direccion: input.direccion || {},
    vendedorId: user.uid,
    vendedorNombre: user.nombre || user.email.split("@")[0],
    vendedorEmail: user.email,
    totalCotizaciones: 0,
    totalVendidoCentavos: 0,
    createdAt: now,
    updatedAt: now,
  };

  const ref = await adminDb.collection("customers").add(customerDoc);
  const created: Customer = { id: ref.id, ...customerDoc };

  await recordAuditLog({
    userId: user.uid,
    userEmail: user.email,
    entity: "customer",
    entityId: ref.id,
    action: "create",
    before: null,
    after: created,
  });

  return created;
}

/**
 * Actualiza los datos de un cliente (protegido por vendedor o admin).
 */
export async function updateCustomer(
  id: string,
  input: Partial<CustomerInput>,
  user: ServiceUser
): Promise<Customer> {
  const existing = await getCustomerById(id, user);
  if (!existing) throw new Error("Cliente no encontrado.");

  // Si actualiza el teléfono, verificar que no colisione con otro
  let norm = existing.whatsapp;
  if (input.whatsapp && input.whatsapp !== existing.whatsapp) {
    norm = normalizarWhatsapp(input.whatsapp);
    if (norm.length !== 10) throw new Error("El WhatsApp debe tener 10 dígitos.");
    const check = await checkCustomerWhatsapp(norm, user);
    if (check.asignadoAOtro || (check.customerId && check.customerId !== id)) {
      throw new Error("Este número de WhatsApp ya pertenece a otro cliente.");
    }
  }

  const now = new Date().toISOString();
  const patch: Partial<Customer> = {
    ...(input.nombre && { nombre: input.nombre.trim() }),
    ...(input.empresa !== undefined && { empresa: input.empresa.trim() }),
    ...(input.whatsapp && { whatsapp: norm, whatsappDisplay: formatearWhatsapp(norm) }),
    ...(input.correo !== undefined && { correo: input.correo.trim() }),
    ...(input.rfc !== undefined && { rfc: input.rfc.toUpperCase().trim() }),
    ...(input.direccion !== undefined && { direccion: input.direccion }),
    updatedAt: now,
  };

  await adminDb.collection("customers").doc(id).set(patch, { merge: true });
  const updated: Customer = { ...existing, ...patch };

  await recordAuditLog({
    userId: user.uid,
    userEmail: user.email,
    entity: "customer",
    entityId: id,
    action: "update",
    before: existing,
    after: updated,
  });

  return updated;
}

/**
 * Permite a un vendedor solicitar al admin la reasignación de un cliente.
 */
export async function solicitarReasignacionCliente(
  customerId: string,
  user: ServiceUser,
  motivo?: string
): Promise<{ success: boolean; mensaje: string }> {
  if (!(await isFirestoreReady())) throw new Error("Base de datos no disponible.");

  const doc = await adminDb.collection("customers").doc(customerId).get();
  if (!doc.exists) throw new Error("Cliente no encontrado.");

  const now = new Date().toISOString();
  const reasigData = {
    vendedorSolicitanteId: user.uid,
    vendedorSolicitanteNombre: user.nombre || user.email.split("@")[0],
    vendedorSolicitanteEmail: user.email,
    fecha: now,
    motivo: motivo?.trim() || "Solicitud de contacto directo con el cliente.",
  };

  await adminDb.collection("customers").doc(customerId).update({
    reasignacionSolicitada: reasigData,
    updatedAt: now,
  });

  await recordAuditLog({
    userId: user.uid,
    userEmail: user.email,
    entity: "customer",
    entityId: customerId,
    action: "request_reassign",
    before: null,
    after: reasigData,
  });

  return { success: true, mensaje: "Solicitud de reasignación enviada al administrador." };
}

/**
 * Acción exclusiva de Administrador: Reasignar un cliente a otro vendedor.
 */
export async function reasignarCliente(
  customerId: string,
  nuevoVendedor: { uid: string; nombre: string; email: string },
  adminUser: ServiceUser
): Promise<Customer> {
  if (adminUser.role !== "admin") {
    throw new Error("Solo los administradores pueden reasignar clientes.");
  }

  const doc = await adminDb.collection("customers").doc(customerId).get();
  if (!doc.exists) throw new Error("Cliente no encontrado.");

  const before = doc.data() as Customer;
  const now = new Date().toISOString();

  const patch = {
    vendedorId: nuevoVendedor.uid,
    vendedorNombre: nuevoVendedor.nombre,
    vendedorEmail: nuevoVendedor.email,
    reasignacionSolicitada: null as any,
    updatedAt: now,
  };

  await adminDb.collection("customers").doc(customerId).set(patch, { merge: true });
  const updated: Customer = { ...before, ...patch, id: customerId };

  await recordAuditLog({
    userId: adminUser.uid,
    userEmail: adminUser.email,
    entity: "customer",
    entityId: customerId,
    action: "reassign",
    before,
    after: updated,
  });

  return updated;
}
