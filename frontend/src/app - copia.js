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

async function loadTables(){
  const data = await apiGet("tables");
  tablesListEl.innerHTML = "";
  for(const t of data.tables){
    const li = document.createElement("li");
    li.textContent = t;
    li.onclick = ()=> selectTable(t, li);
    tablesListEl.appendChild(li);
  }
}

async function selectTable(table, liEl=null){
  currentTable = table;
  currentPage = 0;
  // mark active
  for(const li of tablesListEl.children) li.classList.remove("active");
  if(liEl) liEl.classList.add("active");
  tableNameEl.textContent = table;
  // schema
  const schema = await apiGet(`tables/${encodeURIComponent(table)}/schema`);
  currentSchema = schema;
  renderSchema(schema);
  controlsEl.classList.remove("hidden");
  await loadRows();
}

function renderSchema(schema){
  schemaEl.innerHTML = "";
  for(const c of schema.columns){
    const span = document.createElement("span");
    span.className = "schema-pill";
    span.textContent = `${c.name} (${c.type || "TEXT"})${c.pk ? " PK": ""}`;
    schemaEl.appendChild(span);
  }
}

async function loadRows(){
  const offset = currentPage * PAGE_SIZE;
  const data = await apiGet(`tables/${encodeURIComponent(currentTable)}/rows?limit=${PAGE_SIZE}&offset=${offset}`);
  renderRows(data.columns, data.rows, data.total || 0);
}

function renderRows(columns, rows, total){
  recordsEl.innerHTML = "";
  const table = document.createElement("table");
  table.className = "table";
  const thead = document.createElement("thead");
  const thr = document.createElement("tr");
  for(const c of columns) {
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
  for(const r of rows){
    const tr = document.createElement("tr");
    for(const c of columns){
      const td = document.createElement("td");
      const val = r[c];
      td.textContent = (val === null || val === undefined) ? "" : String(val);
      tr.appendChild(td);
    }
    const tdActions = document.createElement("td");
    tdActions.className = "row-actions";
    const editBtn = document.createElement("button");
    editBtn.className = "small-btn";
    editBtn.textContent = "Editar";
    editBtn.onclick = ()=> openEdit(r);
    const delBtn = document.createElement("button");
    delBtn.className = "small-btn";
    delBtn.textContent = "Eliminar";
    delBtn.onclick = ()=> destroyRow(r);
    tdActions.appendChild(editBtn);
    tdActions.appendChild(delBtn);
    tr.appendChild(tdActions);
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  recordsEl.appendChild(table);

  // update pagination info
  const start = currentPage * PAGE_SIZE + 1;
  const end = Math.min((currentPage+1)*PAGE_SIZE, total);
  pageInfo.textContent = `${start}-${end} / ${total}`;
  prevPageBtn.disabled = currentPage === 0;
  nextPageBtn.disabled = end >= total;
}

// open new modal
function openNew(){
  modalTitle.textContent = `Nuevo - ${currentTable}`;
  buildForm({});
  modal.classList.remove("hidden");
}

// fill form for edit
function openEdit(row){
  modalTitle.textContent = `Editar - ${currentTable}`;
  buildForm(row);
  modal.classList.remove("hidden");
}

function buildForm(data){
  recordForm.innerHTML = "";
  // create inputs for each column except PK when auto?
  const pk = currentSchema.primary_key;
  for(const col of currentSchema.columns){
    const name = col.name;
    const fieldRow = document.createElement("div");
    fieldRow.className = "form-row";
    const label = document.createElement("label");
    label.textContent = name;
    const input = document.createElement("input");
    input.name = name;
    input.value = data[name] ?? "";
    // if PK and exists in schema and has value => show but disable editing
    if(pk && name === pk && (data[name] !== undefined && data[name] !== null)){
      input.disabled = true;
    }
    fieldRow.appendChild(label);
    fieldRow.appendChild(input);
    recordForm.appendChild(fieldRow);
  }
  // store current pk value as dataset
  recordForm.dataset.pk = data[pk] ?? data.rowid ?? "";
}

// save action (create or update)
async function saveRecord(){
  const pk = currentSchema.primary_key;
  const formData = new FormData(recordForm);
  const obj = {};
  for(const [k,v] of formData.entries()){
    obj[k] = v === "" ? null : v;
  }
  const pkValue = recordForm.dataset.pk;
  try{
    if(pkValue){
      // update
      await apiPut(`tables/${encodeURIComponent(currentTable)}/rows/${encodeURIComponent(pkValue)}`, obj);
      alert("Actualizado");
    } else {
      await apiPost(`tables/${encodeURIComponent(currentTable)}/rows`, obj);
      alert("Creado");
    }
    modal.classList.add("hidden");
    await loadRows();
  }catch(err){
    alert("Error: " + err.message);
  }
}

async function destroyRow(row){
  const pk = currentSchema.primary_key;
  const pkValue = pk ? row[pk] : (row.rowid ?? null);
  if(!pkValue && pkValue !== 0) {
    alert("No se pudo identificar la PK para borrar.");
    return;
  }
  if(!confirm("Confirmar eliminación")) return;
  try{
    await apiDelete(`tables/${encodeURIComponent(currentTable)}/rows/${encodeURIComponent(pkValue)}`);
    alert("Eliminado");
    await loadRows();
  }catch(err){
    alert("Error: " + err.message);
  }
}

// events
refreshBtn.onclick = ()=> loadRows();
newBtn.onclick = ()=> openNew();
prevPageBtn.onclick = async ()=>{
  if(currentPage>0) currentPage--;
  await loadRows();
}
nextPageBtn.onclick = async ()=>{
  currentPage++;
  await loadRows();
}
cancelBtn.onclick = ()=> modal.classList.add("hidden");
saveBtn.onclick = saveRecord;

// init
(async function init(){
  try{
    await loadTables();
  }catch(err){
    console.error(err);
    alert("Error cargando tablas: " + err.message);
  }
})();
