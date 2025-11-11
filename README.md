# 🌐 Proyecto Flask + Node.js + SQLite — Explorador y CRUD

Este proyecto combina **Flask (Python)** y **Node.js (npm)** para crear una aplicación web que permite:

- Mostrar las tablas disponibles en una base de datos **SQLite (chinook.db)**.
- Visualizar el contenido de una tabla seleccionada.
- Realizar operaciones **CRUD** (Crear, Leer, Actualizar y Eliminar) sobre los registros.
- Interfaz responsive y moderna con HTML, CSS y JavaScript nativo.

---

## 🧩 Estructura del Proyecto
```
mi-proyecto-flask-node/
├─ bbdd/
│ └─ chinook.db # Base de datos SQLite
│
├─ backend/ # Backend en Python (Flask)
│ ├─ app.py # Servidor Flask + API REST + rutas
│ ├─ db_utils.py # Funciones auxiliares de acceso a SQLite
│ ├─ requirements.txt # Dependencias Python
│ └─ venv/ # Entorno virtual (se crea al instalar)
│
├─ frontend/ # Frontend HTML, CSS, JS
│ ├─ package.json # Configuración npm + scripts
│ └─ src/
│ ├─ index.html # Página principal
│ ├─ styles.css # Estilos (responsive)
│ ├─ api.js # Funciones fetch() para conectar con la API
│ └─ app.js # Lógica de UI y CRUD
│
└─ README.md # Este archivo

---

## ⚙️ Instalación y Configuración

> Asegúrate de tener instalados:
>
> - **Python 3.8+**
> - **Node.js (npm)**
> - **SQLite3** (opcional, solo si deseas abrir la BD desde consola)

---

### 🔹 Paso 1: Clonar o crear el proyecto

```bash
# Crea el directorio y entra en él
mkdir mi-proyecto-flask-node
cd mi-proyecto-flask-node

# Coloca tu base de datos chinook.db dentro de la carpeta bbdd/:
mi-proyecto-flask-node/bbdd/chinook.db




### 🔹 Paso 2: Configurar el entorno virtual de Python (Flask)



cd backend

## Crear entorno virtual

## Linux / macOS:

python3 -m venv venv
source venv/bin/activate


## Windows PowerShell:

python -m venv venv
.\venv\Scripts\Activate.ps1

## Instalar dependencias
pip install --upgrade pip
pip install -r requirements.txt

### 🔹 Paso 3: Configurar el frontend (npm)
cd ../frontend
npm install
# Esto instalará el paquete http-server para servir los archivos HTML/CSS/JS.

###  🚀 Ejecución del Proyecto

## Tienes dos opciones para lanzar la aplicación.
# ✅ Opción A — Usar solo Flask (más sencilla)

> El backend Flask servirá el frontend automáticamente.

# 1- Entra al backend:

cd backend


# 2- Activa el entorno virtual:

# Linux / macOS
source venv/bin/activate

# Windows PowerShell
.\venv\Scripts\Activate.ps1


# 3- Ejecuta Flask:

python app.py


# Abre tu navegador en:
👉 http://127.0.0.1:5000

### 🧠 Opción B — Servir frontend y backend por separado
#1. Iniciar el backend Flask

> En una terminal:

cd backend
source venv/bin/activate
python app.py


> El backend estará en http://127.0.0.1:5000

# 2. Iniciar el frontend con npm en otra terminal

cd frontend
npm run serve


> El frontend estará en http://127.0.0.1:3000

> Si usas esta opción, edita frontend/src/api.js y cambia la línea:
> Javascript

const API_BASE = "http://localhost:5000";

### 🧹 Administración del Entorno Virtual
## 🔸 Activar el entorno virtual

> Linux / macOS:

source venv/bin/activate


> Windows PowerShell:

.\venv\Scripts\Activate.ps1

## 🔸 Desactivar el entorno virtual
deactivate

## 🔸 Reiniciar el entorno virtual

> Si deseas eliminarlo y crearlo desde cero:

# Desde la carpeta backend
deactivate        # si está activo
rm -rf venv       # Linux / macOS
# rmdir /s /q venv   (Windows PowerShell)

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

## 🧰 Función de Cada Archivo
# Archivo	Ubicación	Descripción
Archivo,Ubicación,Descripción
app.py,backend/,"Contiene la aplicación Flask: define rutas, API REST y sirve el frontend."
db_utils.py,backend/,"Funciones para interactuar con SQLite: listar tablas, columnas, CRUD, etc."
requirements.txt,backend/,Dependencias necesarias para Python.
package.json,frontend/,Configuración npm y scripts de desarrollo.
index.html,frontend/src/,Estructura principal de la interfaz web.
styles.css,frontend/src/,Estilos responsive y diseño moderno.
api.js,frontend/src/,Define funciones para consumir la API Flask con fetch().
app.js,frontend/src/,"Lógica principal del frontend: listar tablas, renderizar datos, CRUD."
chinook.db,bbdd/,Base de datos SQLite3 usada como ejemplo.
## 💅 Características del Frontend

> - Diseño moderno y responsive (CSS puro, sin frameworks).

> - Uso de medidas dinámicas con clamp(), vw, rem.

> - Grid layout adaptable a escritorio, tablet y móvil.

> - Modal flotante para crear/editar registros.

> - Paginación y acciones CRUD intuitivas.

## 🧭 URLs Principales
URL,Descripción
/,Página principal (frontend)
/api/tables,Listado de tablas SQLite
/api/tables/<tabla>/rows,Listado de registros de una tabla
/api/tables/<tabla>/rows/<id>,CRUD sobre un registro específico
/api/tables/<tabla>/schema,"Esquema (columnas, tipos, PK)"

##🧪 Ejemplo de flujo

> - Abre http://localhost:5000

> - Se muestran las tablas disponibles (Album, Artist, etc.)

> - Haz clic sobre una tabla para listar los registros.

> - Usa los botones:

✚ Nuevo registro

✏️ Editar

❌ Eliminar

> - Navega entre páginas con los botones de paginación.

## 🧼 Cierre del Proyecto

> Para cerrar todo correctamente:

> - Cierra el servidor Flask con Ctrl + C

> - Cierra el servidor npm (si lo usaste) con Ctrl + C

> - Desactiva el entorno virtual:

deactivate

## 🏁 Créditos

> Proyecto educativo — combinación práctica de Python (Flask), SQLite3, HTML/CSS/JS, y Node.js (npm) para demostrar un flujo completo frontend + backend + base de datos.
```
