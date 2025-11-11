// frontend/src/app.js
// frontend/src/app.js
let currentTable = null;
let currentSchema = null;
let currentPage = 0;
const PAGE_SIZE = 30;

const tablesListEl = document.getElementById("tablesList");
const tableNameEl = document.getElementById("tableName");
const schemaEl = document.getElementById("schema");
const recordsEl = document.getElementById("records");
const controlsEl = document.getElementById("controls");
const refreshBtn = document.getElementById("refreshBtn");
const newBtn = document.getElementById("newBtn");
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");
const pageInfo = document.getElementById("pageInfo");

const modal = document.getElementById("formModal");
const recordForm = document.getElementById("recordForm");
const modalTitle = document.getElementById("modalTitle");
const cancelBtn = document.getElementById("cancelBtn");
const saveBtn = document.getElementById("saveBtn");

async function apiGet(endpoint) {
  const res = await fetch(`/api/${endpoint}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function apiPost(endpoint, data) {
  const res = await fetch(`/api/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function apiPut(endpoint, data) {
  const res = await fetch(`/api/${endpoint}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function apiDelete(endpoint) {
  const res = await fetch(`/api/${endpoint}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function loadTables() {
  const data = await apiGet("tables");
  tablesListEl.innerHTML = "";
  for (const t of data.tables) {
    const li = document.createElement("li");
    li.textContent = t;
    li.onclick = () => selectTable(t, li);
    tablesListEl.appendChild(li);
  }
}

async function selectTable(table, liEl = null) {
  currentTable = table;
  currentPage = 0;
  for (const li of tablesListEl.children) li.classList.remove("active");
  if (liEl) liEl.classList.add("active");
  tableNameEl.textContent = table;

  // Cargar schema
  const schemaData = await apiGet(`tables/${encodeURIComponent(table)}/schema`);
  currentSchema = schemaData;
  renderSchema(schemaData);
  controlsEl.classList.remove("hidden");

  await loadRows();
}

function renderSchema(schema) {
  schemaEl.innerHTML = "";
  if (!schema || !Array.isArray(schema.columns)) {
    console.error("Schema inválido:", schema);
    return;
  }

  for (const c of schema.columns) {
    const span = document.createElement("span");
    span.className = "schema-pill";
    span.textContent = `${c.name} (${c.type || "TEXT"})${
      c.primary_key ? " PK" : ""
    }`;
    schemaEl.appendChild(span);
  }
}

async function loadRows() {
  const offset = currentPage * PAGE_SIZE;
  const data = await apiGet(
    `tables/${encodeURIComponent(currentTable)}/rows?limit=${PAGE_SIZE}&offset=${offset}`
  );

  // ✅ Determinar columnas a mostrar desde el schema actual
  const columns = currentSchema?.columns?.map((c) => c.name) || [];
  const rows = data.rows || [];

  // ✅ Usar el valor total real que envía el backend
  const total = data.total ?? rows.length;

  renderRows(columns, rows, total);
}

function renderRows(columns, rows, total) {
  recordsEl.innerHTML = "";

  if (!Array.isArray(columns) || columns.length === 0) {
    const msg = document.createElement("p");
    msg.textContent = "No hay columnas disponibles.";
    recordsEl.appendChild(msg);
    return;
  }

  const table = document.createElement("table");
  table.className = "table";

  const thead = document.createElement("thead");
  const thr = document.createElement("tr");
  for (const c of columns) {
    const th = document.createElement("th");
    th.textContent = c;
    thr.appendChild(th);
  }

  const thActions = document.createElement("th");
  thActions.textContent = "Acciones";
  thr.appendChild(thActions);
  thead.appendChild(thr);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (const r of rows) {
    const tr = document.createElement("tr");
    for (const c of columns) {
      const td = document.createElement("td");
      const val = r[c];
      td.textContent = val ?? "";
      tr.appendChild(td);
    }

    const tdActions = document.createElement("td");
    tdActions.className = "row-actions";
    const editBtn = document.createElement("button");
    editBtn.className = "small-btn";
    editBtn.textContent = "Editar";
    editBtn.onclick = () => openEdit(r);
    const delBtn = document.createElement("button");
    delBtn.className = "small-btn";
    delBtn.textContent = "Eliminar";
    delBtn.onclick = () => destroyRow(r);
    tdActions.appendChild(editBtn);
    tdActions.appendChild(delBtn);
    tr.appendChild(tdActions);

    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  recordsEl.appendChild(table);

  const start = currentPage * PAGE_SIZE + 1;
  const end = Math.min((currentPage + 1) * PAGE_SIZE, total);
  pageInfo.textContent = `${start}-${end} / ${total}`;
  prevPageBtn.disabled = currentPage === 0;
  nextPageBtn.disabled = end >= total;
}

// --- MODAL CRUD ---

function openNew() {
  modalTitle.textContent = `Nuevo - ${currentTable}`;
  buildForm({});
  modal.classList.remove("hidden");
}

function openEdit(row) {
  modalTitle.textContent = `Editar - ${currentTable}`;
  buildForm(row);
  modal.classList.remove("hidden");
}

function buildForm(data) {
  recordForm.innerHTML = "";
  const pkCol = currentSchema.columns.find((c) => c.primary_key);
  const pkName = pkCol ? pkCol.name : null;

  for (const col of currentSchema.columns) {
    const fieldRow = document.createElement("div");
    fieldRow.className = "form-row";
    const label = document.createElement("label");
    label.textContent = col.name;
    const input = document.createElement("input");
    input.name = col.name;
    input.value = data[col.name] ?? "";
    if (col.primary_key && data[col.name] !== undefined) input.disabled = true;
    fieldRow.appendChild(label);
    fieldRow.appendChild(input);
    recordForm.appendChild(fieldRow);
  }

  recordForm.dataset.pk = pkName ? data[pkName] ?? "" : "";
}

async function saveRecord() {
  const pkCol = currentSchema.columns.find((c) => c.primary_key);
  const pkName = pkCol ? pkCol.name : null;
  const formData = new FormData(recordForm);
  const obj = {};
  for (const [k, v] of formData.entries()) {
    obj[k] = v === "" ? null : v;
  }
  const pkValue = recordForm.dataset.pk;

  try {
    if (pkValue) {
      await apiPut(
        `tables/${encodeURIComponent(currentTable)}/${encodeURIComponent(
          pkValue
        )}`,
        obj
      );
      alert("Actualizado correctamente");

 // 🔹 Evento GA4: edición de registro
      if (typeof gtag === "function") {
        gtag("event", "edit_record", {
          table_name: currentTable,
          primary_key: pkValue,
        });
      }

    } else {
      const result = await apiPost(`tables/${encodeURIComponent(currentTable)}`, obj);
      alert("Registro creado");
            // 🔹 Evento GA4: creación de registro
      if (typeof gtag === "function") {
        gtag("event", "create_record", {
          table_name: currentTable,
          created_id: result?.id || null,
        });
      }

    }
    modal.classList.add("hidden");
    await loadRows();
  } catch (err) {
    alert("Error: " + err.message);
  }
}

async function destroyRow(row) {
  const pkCol = currentSchema.columns.find((c) => c.primary_key);
  const pkName = pkCol ? pkCol.name : null;
  const pkValue = pkName ? row[pkName] : null;

  if (!pkValue) {
    alert("No se pudo identificar la PK para borrar.");
    return;
  }
  if (!confirm("¿Seguro que deseas eliminar este registro?")) return;

  try {
    await apiDelete(
      `tables/${encodeURIComponent(currentTable)}/${encodeURIComponent(pkValue)}`
    );
    alert("Eliminado correctamente");

      // 🔹 Evento GA4: eliminación de registro
    if (typeof gtag === "function") {
      gtag("event", "delete_record", {
        table_name: currentTable,
        primary_key: pkValue,
      });
    }

    await loadRows();
  } catch (err) {
    alert("Error: " + err.message);
  }
}

// --- EVENTOS ---
refreshBtn.onclick = () => loadRows();
newBtn.onclick = () => openNew();
prevPageBtn.onclick = async () => {
  if (currentPage > 0) currentPage--;
  await loadRows();
};
nextPageBtn.onclick = async () => {
  currentPage++;
  await loadRows();
};
cancelBtn.onclick = () => modal.classList.add("hidden");
saveBtn.onclick = saveRecord;

// --- INICIALIZACIÓN ---
(async function init() {
  try {
    await loadTables();
  } catch (err) {
    console.error(err);
    alert("Error cargando tablas: " + err.message);
  }
})();

