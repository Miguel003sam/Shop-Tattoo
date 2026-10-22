
// En Vercel se define VITE_API_URL con la URL de Render; en local usa el backend de tu PC
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export async function getDesigns() {
  const response = await fetch(`${API_URL}/designs`);

  if (!response.ok) {
    throw new Error("No se pudieron cargar los diseños");
  }

  return response.json();
}

export async function getStyles() {
  const response = await fetch(`${API_URL}/styles`);

  if (!response.ok) {
    throw new Error("No se pudieron cargar los estilos");
  }

  return response.json();
}

export async function createStyle(style) {
  const response = await fetch(`${API_URL}/styles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(style),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "No se pudo registrar el estilo");
  }

  return response.json();
}

export async function createArtist(artist) {
  const response = await fetch(`${API_URL}/artists`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(artist),
  });

  if (!response.ok) {
    throw new Error("No se pudo registrar el tatuador");
  }

  return response.json();
}

export async function getProducts() {
  const response = await fetch(`${API_URL}/products`);

  if (!response.ok) {
    throw new Error("No se pudieron cargar los productos");
  }

  return response.json();
}

export async function createProduct(product) {
  const response = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(product),
  });

  if (!response.ok) {
    throw new Error("No se pudo registrar el producto");
  }

  return response.json();
}

export async function getArtists() {
  const response = await fetch(`${API_URL}/artists`);

  if (!response.ok) {
    throw new Error("No se pudieron cargar los tatuadores");
  }

  return response.json();
}

export async function getClients() {
  const response = await fetch(`${API_URL}/clients`);

  if (!response.ok) {
    throw new Error("No se pudieron cargar los clientes");
  }

  return response.json();
}

export async function createClient(client) {
  const response = await fetch(`${API_URL}/clients`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(client),
  });

  if (!response.ok) {
    throw new Error("No se pudo registrar el cliente");
  }

  return response.json();
}

export async function getAppointments() {
  const response = await fetch(`${API_URL}/appointments`);

  if (!response.ok) {
    throw new Error("No se pudieron cargar las citas");
  }

  return response.json();
}

export async function createAppointment(appointment) {
  const response = await fetch(`${API_URL}/appointments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(appointment),
  });

  if (!response.ok) {
    throw new Error("No se pudo registrar la cita");
  }

  return response.json();
}

export async function updateAppointmentStatus(id, status) {
  const response = await fetch(
    `${API_URL}/appointments/${id}/status?status=${encodeURIComponent(status)}`,
    { method: "PATCH" }
  );

  if (!response.ok) {
    throw new Error("No se pudo actualizar la cita");
  }

  return response.json();
}
