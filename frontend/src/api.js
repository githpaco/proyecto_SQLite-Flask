// frontend/src/api.js
const API_BASE = ""; // cuando el frontend es servido por Flask, uso mismo host/puerto
// si sirves frontend en otro puerto, usa: const API_BASE = "http://localhost:5000";

async function apiGet(path){
  const res = await fetch(`${API_BASE}/api/${path}`);
  if(!res.ok) throw new Error(await res.text());
  return res.json();
}

async function apiPost(path, body){
  const res = await fetch(`${API_BASE}/api/${path}`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(body)
  });
  if(!res.ok) throw new Error(await res.text());
  return res.json();
}

async function apiPut(path, body){
  const res = await fetch(`${API_BASE}/api/${path}`, {
    method: "PUT",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(body)
  });
  if(!res.ok) throw new Error(await res.text());
  return res.json();
}

async function apiDelete(path){
  const res = await fetch(`${API_BASE}/api/${path}`, { method: "DELETE" });
  if(!res.ok) throw new Error(await res.text());
  return res.json();
}
