import { useState } from "react";

// Sección genérica: formulario para registrar + tabla con los registros
function RecordSection({
  title,
  description,
  countLabel,
  formTitle,
  fields,
  columns,
  rows,
  emptyIcon,
  emptyText,
  onCreate,
}) {
  const emptyValues = Object.fromEntries(fields.map((field) => [field.name, ""]));
  const [values, setValues] = useState(emptyValues);

  function changeValue(event) {
    setValues({ ...values, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const data = Object.fromEntries(
      fields.map((field) => [field.name, values[field.name].trim() || null])
    );

    const saved = await onCreate(data);
    if (saved) {
      setValues(emptyValues);
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

      <form className="inline-form" onSubmit={handleSubmit}>
        <p className="inline-form-title">{formTitle}</p>
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
          <button className="primary-button" type="submit">
            ＋ Agregar
          </button>
        </div>
      </form>

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
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {columns.map((column) => (
                    <td key={column.key}>
                      {row[column.key] ?? <span className="muted">—</span>}
                    </td>
                  ))}
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
