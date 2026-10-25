
// En Vercel se define VITE_API_URL con la URL de Render; en local usa el backend de tu PC
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// Contraseña del modo administrador: se guarda solo mientras la pestaña está abierta
const ADMIN_STORAGE_KEY = "adminKey";

export function getAdminKey() {
  try {
    return sessionStorage.getItem(ADMIN_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function setAdminKey(key) {
  try {
    if (key) {
      sessionStorage.setItem(ADMIN_STORAGE_KEY, key);
    } else {
      sessionStorage.removeItem(ADMIN_STORAGE_KEY);
    }
  } catch {
    // Si el navegador bloquea el almacenamiento, el modo admin dura hasta recargar
  }
}

// Error que conserva el código HTTP (por ejemplo 401 = contraseña incorrecta)
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = "GET", body, admin = false, fallback, adminKey } = {}) {
  const headers = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (admin) {
    headers["X-Admin-Key"] = adminKey ?? getAdminKey();
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("No se pudo conectar con el servidor. Intenta de nuevo en unos segundos.", 0);
  }

  if (!response.ok) {
    // El backend explica el motivo en "detail" (ej. "El tatuador tiene 2 citas")
    const data = await response.json().catch(() => ({}));
    const detail = typeof data.detail === "string" ? data.detail : fallback;
    throw new ApiError(detail || fallback, response.status);
  }

  return response.status === 204 ? null : response.json();
}

export function verifyAdmin(key) {
  return request("/admin/verificar", {
    admin: true,
    adminKey: key,
    fallback: "No se pudo verificar la contraseña",
  });
}

// Catálogo público
export const getDesigns = () =>
  request("/designs", { fallback: "No se pudieron cargar los diseños" });
export const getStyles = () =>
  request("/styles", { fallback: "No se pudieron cargar los estilos" });
export const getArtists = () =>
  request("/artists", { fallback: "No se pudieron cargar los tatuadores" });
export const getProducts = () =>
  request("/products", { fallback: "No se pudieron cargar los productos" });

// Reserva de citas (público)
export const createClient = (client) =>
  request("/clients", { method: "POST", body: client, fallback: "No se pudo registrar el cliente" });
export const createAppointment = (appointment) =>
  request("/appointments", { method: "POST", body: appointment, fallback: "No se pudo registrar la cita" });

// Administración (requieren la contraseña)
export const getClients = () =>
  request("/clients", { admin: true, fallback: "No se pudieron cargar los clientes" });
export const getAppointments = () =>
  request("/appointments", { admin: true, fallback: "No se pudieron cargar las citas" });
export const updateAppointmentStatus = (id, status) =>
  request(`/appointments/${id}/status?status=${encodeURIComponent(status)}`, {
    method: "PATCH",
    admin: true,
    fallback: "No se pudo actualizar la cita",
  });

// Crear, editar y eliminar para estilos, tatuadores, clientes y productos
function adminCrud(path, nombre) {
  return {
    create: (data) =>
      request(path, { method: "POST", body: data, admin: true, fallback: `No se pudo registrar ${nombre}` }),
    update: (id, data) =>
      request(`${path}/${id}`, { method: "PUT", body: data, admin: true, fallback: `No se pudo actualizar ${nombre}` }),
    remove: (id) =>
      request(`${path}/${id}`, { method: "DELETE", admin: true, fallback: `No se pudo eliminar ${nombre}` }),
  };
}

export const stylesApi = adminCrud("/styles", "el estilo");
export const artistsApi = adminCrud("/artists", "el tatuador");
export const clientsApi = adminCrud("/clients", "el cliente");
export const productsApi = adminCrud("/products", "el producto");
