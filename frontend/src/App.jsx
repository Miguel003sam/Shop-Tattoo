
import { useEffect, useState } from "react";
import {
  getStyles,
  createStyle,
  getArtists,
  createArtist,
  getClients,
  createClient,
  getProducts,
  createProduct,
  getDesigns,
  getAppointments,
  createAppointment,
  updateAppointmentStatus,
} from "./api";
import RecordSection from "./RecordSection";
import "./App.css";

const NEW_CLIENT = "new";

const SECTIONS = [
  { id: "designs", icon: "✳", label: "Catálogo de diseños", title: "Catálogo de diseños" },
  { id: "new", icon: "＋", label: "Registrar cita", title: "Nueva cita" },
  { id: "appointments", icon: "▤", label: "Administrar citas", title: "Administración de citas" },
  { id: "clients", icon: "☺", label: "Clientes", title: "Clientes" },
  { id: "artists", icon: "✎", label: "Tatuadores", title: "Tatuadores" },
  { id: "styles", icon: "◈", label: "Estilos", title: "Estilos de tatuaje" },
  { id: "products", icon: "◍", label: "Productos de cuidado", title: "Productos de cuidado" },
];

const emptyForm = {
  client_id: "",
  client_name: "",
  client_phone: "",
  client_email: "",
  artist_id: "",
  tattoo_description: "",
  appointment_date: "",
  price: "",
};

function App() {
  const [section, setSection] = useState("designs");
  const [styles, setStyles] = useState([]);
  const [artists, setArtists] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedDesignId, setSelectedDesignId] = useState(null);
  const [styleFilter, setStyleFilter] = useState(null);

  const selectedDesign = designs.find((design) => design.id === selectedDesignId);
  const visibleDesigns = styleFilter
    ? designs.filter((design) => design.style_id === styleFilter)
    : designs;

  const [form, setForm] = useState(emptyForm);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [
        styleData,
        artistData,
        clientData,
        productData,
        designData,
        appointmentData,
      ] = await Promise.all([
        getStyles(),
        getArtists(),
        getClients(),
        getProducts(),
        getDesigns(),
        getAppointments(),
      ]);

      setStyles(styleData);
      setArtists(artistData);
      setClients(clientData);
      setProducts(productData);
      setDesigns(designData);
      setAppointments(appointmentData);
    } catch (err) {
      setError(err.message || "No se pudieron cargar los datos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function changeForm(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function selectDesign(design) {
    setSelectedDesignId(design ? design.id : null);
    setForm({ ...form, price: design ? String(design.price) : "" });
  }

  function chooseDesignFromCatalog(design) {
    selectDesign(design);
    setMessage("");
    setSection("new");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const details = form.tattoo_description.trim();

    try {
      let clientId = Number(form.client_id);

      if (form.client_id === NEW_CLIENT) {
        const newClient = await createClient({
          full_name: form.client_name.trim(),
          phone: form.client_phone.trim() || null,
          email: form.client_email.trim() || null,
        });
        clientId = newClient.id;
      }

      await createAppointment({
        client_id: clientId,
        artist_id: form.artist_id ? Number(form.artist_id) : null,
        design_id: selectedDesign ? selectedDesign.id : null,
        tattoo_description: details || `Diseño del catálogo: ${selectedDesign.name}`,
        price: Number(form.price),
        appointment_date: new Date(form.appointment_date).toISOString(),
      });

      setForm(emptyForm);
      setSelectedDesignId(null);

      setMessage("¡Cita registrada correctamente!");
      await loadData();
      setSection("appointments");
    } catch (err) {
      setError(err.message || "No se pudo registrar la cita.");
    }
  }

  async function createRecord(createFn, data, successMessage) {
    setError("");
    setMessage("");

    try {
      await createFn(data);
      setMessage(successMessage);
      await loadData();
      return true;
    } catch (err) {
      setError(err.message || "No se pudo guardar el registro.");
      return false;
    }
  }

  function countBy(items, key, id) {
    return items.filter((item) => item[key] === id).length;
  }

  async function changeStatus(id, status) {
    setError("");
    setMessage("");

    try {
      await updateAppointmentStatus(id, status);
      setMessage("Estado de la cita actualizado.");
      await loadData();
    } catch (err) {
      setError(err.message || "No se pudo actualizar el estado.");
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-symbol">✳</span>
          <div>
            <h2>INK HOUSE</h2>
            <p>TATTOO STUDIO</p>
          </div>
        </div>

        <p className="menu-label">MENÚ PRINCIPAL</p>

        <nav>
          {SECTIONS.map((item) => (
            <button
              key={item.id}
              className={section === item.id ? "nav-link active" : "nav-link"}
              onClick={() => setSection(item.id)}
            >
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="status-dot" />
          Sistema de gestión
          <p>Proyecto académico</p>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">ESTUDIO DE TATUAJES</p>
            <h1>{SECTIONS.find((item) => item.id === section).title}</h1>
          </div>
          <div className="topbar-tag">✳ INK HOUSE</div>
        </header>

        <section className="content">
          {error && <div className="notice error">{error}</div>}
          {message && <div className="notice success">{message}</div>}

          {loading ? (
            <div className="empty-state">Cargando información...</div>
          ) : (
            <>
              {section === "designs" && (
                <>
                  <div className="section-intro">
                    <div>
                      <h2>Encuentra tu próximo tatuaje</h2>
                      <p>
                        Explora los diseños disponibles en nuestro estudio.
                      </p>
                    </div>
                    <span className="count-badge">
                      {visibleDesigns.length} diseños
                    </span>
                  </div>

                  <div className="style-filters">
                    <button
                      className={styleFilter === null ? "filter-chip active" : "filter-chip"}
                      onClick={() => setStyleFilter(null)}
                    >
                      Todos
                    </button>
                    {styles.map((style) => (
                      <button
                        key={style.id}
                        className={
                          styleFilter === style.id ? "filter-chip active" : "filter-chip"
                        }
                        title={style.description || ""}
                        onClick={() => setStyleFilter(style.id)}
                      >
                        {style.name}
                      </button>
                    ))}
                  </div>

                  {visibleDesigns.length === 0 ? (
                    <div className="empty-state">
                      <span className="empty-icon">✳</span>
                      <h3>Aún no hay diseños</h3>
                      <p>
                        {styleFilter
                          ? "No hay diseños de este estilo por ahora."
                          : "Los diseños aparecerán aquí cuando se registren en el catálogo."}
                      </p>
                    </div>
                  ) : (
                    <div className="design-grid">
                      {visibleDesigns.map((design) => (
                        <article className="design-card" key={design.id}>
                          {design.image_url ? (
                            <img
                              className="design-image"
                              src={design.image_url}
                              alt={design.name}
                            />
                          ) : (
                            <div className="design-placeholder">✳</div>
                          )}

                          <div className="design-info">
                            <span className="style-label">{design.style}</span>
                            <h3>{design.name}</h3>
                            <div className="design-bottom">
                              <span>Precio referencial</span>
                              <strong>
                                Bs {Number(design.price).toFixed(2)}
                              </strong>
                            </div>
                            <button
                              className="choose-button"
                              onClick={() => chooseDesignFromCatalog(design)}
                            >
                              Elegir este diseño →
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}

                  <button
                    className="primary-button"
                    onClick={() => chooseDesignFromCatalog(null)}
                  >
                    ＋ Solicitar una cita
                  </button>
                </>
              )}

              {section === "new" && (
                <div className="form-panel">
                  <div className="panel-heading">
                    <span className="panel-icon">✳</span>
                    <div>
                      <h2>Reserva tu sesión</h2>
                      <p>Completa los datos para registrar una cita.</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div className="form-row">
                      <label>
                        Cliente
                        <select
                          name="client_id"
                          value={form.client_id}
                          onChange={changeForm}
                          required
                        >
                          <option value="" disabled>
                            Selecciona un cliente
                          </option>
                          {clients.map((client) => (
                            <option key={client.id} value={client.id}>
                              {client.full_name}
                            </option>
                          ))}
                          <option value={NEW_CLIENT}>＋ Nuevo cliente</option>
                        </select>
                      </label>

                      <label>
                        Tatuador
                        <select
                          name="artist_id"
                          value={form.artist_id}
                          onChange={changeForm}
                        >
                          <option value="">Sin asignar</option>
                          {artists.map((artist) => (
                            <option key={artist.id} value={artist.id}>
                              {artist.full_name}
                              {artist.specialty ? ` · ${artist.specialty}` : ""}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    {form.client_id === NEW_CLIENT && (
                      <div className="new-client">
                        <label>
                          Nombre del nuevo cliente
                          <input
                            name="client_name"
                            value={form.client_name}
                            onChange={changeForm}
                            placeholder="Nombre completo"
                            required
                          />
                        </label>

                        <div className="form-row">
                          <label>
                            Teléfono (opcional)
                            <input
                              type="tel"
                              name="client_phone"
                              value={form.client_phone}
                              onChange={changeForm}
                              placeholder="70000000"
                            />
                          </label>

                          <label>
                            Correo (opcional)
                            <input
                              type="email"
                              name="client_email"
                              value={form.client_email}
                              onChange={changeForm}
                              placeholder="cliente@correo.com"
                            />
                          </label>
                        </div>
                      </div>
                    )}

                    <fieldset className="design-picker">
                      <legend>Tatuaje que deseas realizar</legend>
                      <div className="picker-grid">
                        {designs.map((design) => (
                          <button
                            type="button"
                            key={design.id}
                            className={
                              selectedDesignId === design.id
                                ? "picker-option selected"
                                : "picker-option"
                            }
                            aria-pressed={selectedDesignId === design.id}
                            onClick={() => selectDesign(design)}
                          >
                            {design.image_url ? (
                              <img src={design.image_url} alt="" />
                            ) : (
                              <span className="picker-placeholder">✳</span>
                            )}
                            <span className="picker-name">{design.name}</span>
                            <span className="picker-meta">
                              {design.style} · Bs{" "}
                              {Number(design.price).toFixed(2)}
                            </span>
                          </button>
                        ))}

                        <button
                          type="button"
                          className={
                            selectedDesignId === null
                              ? "picker-option selected"
                              : "picker-option"
                          }
                          aria-pressed={selectedDesignId === null}
                          onClick={() => selectDesign(null)}
                        >
                          <span className="picker-placeholder">✎</span>
                          <span className="picker-name">
                            Diseño personalizado
                          </span>
                          <span className="picker-meta">
                            Describe tu idea abajo
                          </span>
                        </button>
                      </div>
                    </fieldset>

                    <label>
                      {selectedDesign
                        ? "Detalles adicionales (opcional)"
                        : "Descripción del tatuaje"}
                      <textarea
                        name="tattoo_description"
                        value={form.tattoo_description}
                        onChange={changeForm}
                        placeholder={
                          selectedDesign
                            ? "Tamaño, ubicación, cambios al diseño..."
                            : "Diseño, tamaño, ubicación..."
                        }
                        rows="4"
                        required={!selectedDesign}
                      />
                    </label>

                    <div className="form-row">
                      <label>
                        Fecha y hora
                        <input
                          type="datetime-local"
                          name="appointment_date"
                          value={form.appointment_date}
                          onChange={changeForm}
                          min={new Date().toISOString().slice(0, 16)}
                          required
                        />
                      </label>

                      <label>
                        Precio acordado (Bs)
                        <input
                          type="number"
                          name="price"
                          value={form.price}
                          onChange={changeForm}
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          required
                        />
                      </label>
                    </div>

                    <button className="primary-button" type="submit">
                      Registrar cita →
                    </button>
                  </form>
                </div>
              )}

              {section === "appointments" && (
                <>
                  <div className="section-intro">
                    <div>
                      <h2>Agenda del estudio</h2>
                      <p>
                        Consulta las reservas y actualiza su estado.
                      </p>
                    </div>
                    <span className="count-badge">
                      {appointments.length} citas
                    </span>
                  </div>

                  {appointments.length === 0 ? (
                    <div className="empty-state">
                      <span className="empty-icon">▤</span>
                      <h3>No hay citas registradas</h3>
                      <p>
                        Las citas que registres aparecerán en esta sección.
                      </p>
                      <button
                        className="primary-button"
                        onClick={() => setSection("new")}
                      >
                        Registrar primera cita
                      </button>
                    </div>
                  ) : (
                    <div className="table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>CLIENTE</th>
                            <th>TATUADOR</th>
                            <th>DISEÑO</th>
                            <th>DESCRIPCIÓN</th>
                            <th>FECHA</th>
                            <th>PRECIO</th>
                            <th>ESTADO</th>
                          </tr>
                        </thead>
                        <tbody>
                          {appointments.map((appointment) => (
                            <tr key={appointment.id}>
                              <td>{appointment.client_name}</td>
                              <td>
                                {appointment.artist_name || (
                                  <span className="muted">Sin asignar</span>
                                )}
                              </td>
                              <td>
                                {appointment.design_name || (
                                  <span className="muted">Personalizado</span>
                                )}
                              </td>
                              <td>{appointment.tattoo_description}</td>
                              <td>
                                {new Date(
                                  appointment.appointment_date
                                ).toLocaleString()}
                              </td>
                              <td>
                                Bs {Number(appointment.price).toFixed(2)}
                              </td>
                              <td>
                                <select
                                  className="status-select"
                                  value={appointment.status}
                                  onChange={(event) =>
                                    changeStatus(
                                      appointment.id,
                                      event.target.value
                                    )
                                  }
                                >
                                  <option value="pendiente">Pendiente</option>
                                  <option value="confirmada">Confirmada</option>
                                  <option value="completada">Completada</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {section === "clients" && (
                <RecordSection
                  title="Clientes del estudio"
                  description="Personas que han reservado una cita."
                  countLabel="clientes"
                  formTitle="Registrar nuevo cliente"
                  fields={[
                    { name: "full_name", label: "Nombre completo", placeholder: "Nombre y apellido", required: true },
                    { name: "phone", label: "Teléfono", placeholder: "70000000", type: "tel" },
                    { name: "email", label: "Correo", placeholder: "cliente@correo.com", type: "email" },
                  ]}
                  columns={[
                    { key: "full_name", label: "NOMBRE" },
                    { key: "phone", label: "TELÉFONO" },
                    { key: "email", label: "CORREO" },
                    { key: "appointment_count", label: "CITAS" },
                  ]}
                  rows={clients.map((client) => ({
                    ...client,
                    appointment_count: countBy(appointments, "client_id", client.id),
                  }))}
                  emptyIcon="☺"
                  emptyText="Aún no hay clientes registrados."
                  onCreate={(data) =>
                    createRecord(createClient, data, "Cliente registrado correctamente.")
                  }
                />
              )}

              {section === "artists" && (
                <RecordSection
                  title="Equipo de tatuadores"
                  description="Artistas que atienden las citas del estudio."
                  countLabel="tatuadores"
                  formTitle="Registrar nuevo tatuador"
                  fields={[
                    { name: "full_name", label: "Nombre completo", placeholder: "Nombre y apellido", required: true },
                    { name: "specialty", label: "Especialidad", placeholder: "Fine Line, Blackwork..." },
                    { name: "phone", label: "Teléfono", placeholder: "70000000", type: "tel" },
                  ]}
                  columns={[
                    { key: "full_name", label: "NOMBRE" },
                    { key: "specialty", label: "ESPECIALIDAD" },
                    { key: "phone", label: "TELÉFONO" },
                    { key: "appointment_count", label: "CITAS ASIGNADAS" },
                  ]}
                  rows={artists.map((artist) => ({
                    ...artist,
                    appointment_count: countBy(appointments, "artist_id", artist.id),
                  }))}
                  emptyIcon="✎"
                  emptyText="Aún no hay tatuadores registrados."
                  onCreate={(data) =>
                    createRecord(createArtist, data, "Tatuador registrado correctamente.")
                  }
                />
              )}

              {section === "styles" && (
                <RecordSection
                  title="Estilos de tatuaje"
                  description="Categorías que organizan el catálogo de diseños."
                  countLabel="estilos"
                  formTitle="Registrar nuevo estilo"
                  fields={[
                    { name: "name", label: "Nombre del estilo", placeholder: "Neotradicional", required: true },
                    { name: "description", label: "Descripción", placeholder: "Breve descripción del estilo" },
                  ]}
                  columns={[
                    { key: "name", label: "ESTILO" },
                    { key: "description", label: "DESCRIPCIÓN" },
                    { key: "design_count", label: "DISEÑOS" },
                  ]}
                  rows={styles.map((style) => ({
                    ...style,
                    design_count: countBy(designs, "style_id", style.id),
                  }))}
                  emptyIcon="◈"
                  emptyText="Aún no hay estilos registrados."
                  onCreate={(data) =>
                    createRecord(createStyle, data, "Estilo registrado correctamente.")
                  }
                />
              )}

              {section === "products" && (
                <RecordSection
                  title="Productos de cuidado"
                  description="Productos para el cuidado del tatuaje que vende el estudio."
                  countLabel="productos"
                  formTitle="Registrar nuevo producto"
                  fields={[
                    { name: "name", label: "Nombre del producto", placeholder: "Crema cicatrizante 50 ml", required: true },
                    { name: "price", label: "Precio (Bs)", placeholder: "0.00", type: "number", min: "0", step: "0.01", required: true },
                    { name: "stock", label: "Stock", placeholder: "0", type: "number", min: "0", step: "1" },
                  ]}
                  columns={[
                    { key: "name", label: "PRODUCTO" },
                    { key: "price_label", label: "PRECIO" },
                    { key: "stock", label: "STOCK" },
                  ]}
                  rows={products.map((product) => ({
                    ...product,
                    price_label: `Bs ${Number(product.price).toFixed(2)}`,
                  }))}
                  emptyIcon="◍"
                  emptyText="Aún no hay productos registrados."
                  onCreate={(data) =>
                    createRecord(
                      createProduct,
                      {
                        name: data.name,
                        price: Number(data.price),
                        stock: data.stock ? Number(data.stock) : 0,
                      },
                      "Producto registrado correctamente."
                    )
                  }
                />
              )}
            </>
          )}
        </section>

        <footer className="footer">
          <span>INK HOUSE · SISTEMA DE GESTIÓN</span>
          <span>Arte en la piel, precisión en cada detalle.</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
