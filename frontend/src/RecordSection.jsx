import { useRef, useState } from "react";

// Sección genérica: formulario para registrar o editar + tabla con los registros.
// Si canManage es falso (visitantes), solo se muestra la tabla.
function RecordSection({
  title,
  description,
  countLabel,
  formTitle,
  editTitle,
  fields,
  columns,
  rows,
  emptyIcon,
  emptyText,
  canManage,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const emptyValues = Object.fromEntries(fields.map((field) => [field.name, ""]));
  const [values, setValues] = useState(emptyValues);
  const [editingId, setEditingId] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const formRef = useRef(null);

  function changeValue(event) {
    setValues({ ...values, [event.target.name]: event.target.value });
  }

  function startEdit(row) {
    setEditingId(row.id);
    setConfirmingId(null);
    setValues(
      Object.fromEntries(
        fields.map((field) => [field.name, row[field.name] == null ? "" : String(row[field.name])])
      )
    );
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelEdit() {
    setEditingId(null);
    setValues(emptyValues);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const data = Object.fromEntries(
      fields.map((field) => [field.name, values[field.name].trim() || null])
    );

    setBusy(true);
    const saved = editingId ? await onUpdate(editingId, data) : await onCreate(data);
    setBusy(false);

    if (saved) {
      cancelEdit();
    }
  }

  async function confirmDelete(id) {
    setBusy(true);
    await onDelete(id);
    setBusy(false);
    setConfirmingId(null);
    if (editingId === id) {
      cancelEdit();
    }
  }

  return (
    <>
      <div className="section-intro">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <span className="count-badge">
          {rows.length} {countLabel}
        </span>
      </div>

      {canManage && (
        <form
          ref={formRef}
          className={editingId ? "inline-form editing" : "inline-form"}
          onSubmit={handleSubmit}
        >
          <p className="inline-form-title">{editingId ? editTitle : formTitle}</p>
          <div className="inline-form-fields">
            {fields.map((field) => (
              <label key={field.name}>
                {field.label}
                <input
                  type={field.type || "text"}
                  name={field.name}
                  value={values[field.name]}
                  onChange={changeValue}
                  placeholder={field.placeholder}
                  required={field.required}
                  min={field.min}
                  step={field.step}
                />
              </label>
            ))}
            <button className="primary-button" type="submit" disabled={busy}>
              {editingId ? "Guardar cambios" : "+ Agregar"}
            </button>
            {editingId && (
              <button className="secondary-button" type="button" onClick={cancelEdit}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      {rows.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">{emptyIcon}</span>
          <p>{emptyText}</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
                {canManage && <th>ACCIONES</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={row.id === editingId ? "row-editing" : undefined}>
                  {columns.map((column) => (
                    <td key={column.key}>
                      {row[column.key] ?? <span className="muted">—</span>}
                    </td>
                  ))}
                  {canManage && (
                    <td>
                      {confirmingId === row.id ? (
                        <div className="row-actions">
                          <span className="confirm-text">¿Eliminar?</span>
                          <button
                            type="button"
                            className="action-button danger"
                            disabled={busy}
                            onClick={() => confirmDelete(row.id)}
                          >
                            Sí, eliminar
                          </button>
                          <button
                            type="button"
                            className="action-button"
                            onClick={() => setConfirmingId(null)}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="row-actions">
                          <button
                            type="button"
                            className="action-button"
                            onClick={() => startEdit(row)}
                          >
                            ✎ Editar
                          </button>
                          <button
                            type="button"
                            className="action-button danger"
                            onClick={() => setConfirmingId(row.id)}
                          >
                            🗑 Eliminar
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default RecordSection;
