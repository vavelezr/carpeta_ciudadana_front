import axios from "axios";

// ============ URLs base ============
const AUTH_URL = "http://localhost:8001/auth/token";
const TR_BASE  = "http://localhost:8002";

// ---- Ciudadanos (proxy al orquestador desde tu backend) ----
const REGISTER_CITIZEN_URL = `${TR_BASE}/apis/registerCitizen`;
const VALIDATE_CITIZEN_URL = (id) => `${TR_BASE}/apis/validateCitizen/${id}`;
const UNREGISTER_CITIZEN_URL = `${TR_BASE}/apis/unregisterCitizen`;

// ---- Operadores (proxy al orquestador) ----
const GET_OPERATORS_URL = `${TR_BASE}/apis/getOperators`;

// ---- Transferencias ----
// OJO: Este nuevo endpoint es tuyo y hará la lógica de:
//  1) consultar operadores en el orquestador,
//  2) encontrar el seleccionado,
//  3) enviar POST /api/transferCitizen al operador destino.
const TRANSFER_TO_OPERATOR_URL = `${TR_BASE}/api/transferToOperator`;

export async function getToken() {
  const res = await axios.post(AUTH_URL, {
    client_id: "OP_EMISOR",
    client_secret: "X",
    grant_type: "client_credentials",
    scope: "transfer:receive transfer:confirm",
  });
  return res.data.access_token;
}

// ----- Ciudadanos -----
export async function registerCitizen(data) {
  const res = await axios.post(REGISTER_CITIZEN_URL, data);
  return res.data;
}
export async function validateCitizen(id) {
  const res = await axios.get(VALIDATE_CITIZEN_URL(id));
  return res.data;
}
export async function unregisterCitizen(id) {
  await axios.delete(UNREGISTER_CITIZEN_URL, { params: { id } });
  return { ok: true };
}

// ----- Operadores -----
export async function getOperators() {
  const res = await axios.get(GET_OPERATORS_URL);
  // El orquestador devuelve un array/obj con { _id, operatorName, participants... }
  // Normalizamos a [{id,name},...]
  const raw = Array.isArray(res.data) ? res.data : (res.data.operators || []);
  return raw.map(o => ({
    id: o._id || o.operator_id || o.id,
    name: o.operatorName || o.name || "Operador",
    raw: o
  }));
}

// ----- Transferir a operador destino -----
export async function transferToOperator(token, payload) {
  // payload: { targetOperatorName, citizen: {id,name,email}, url }
  const res = await axios.post(TRANSFER_TO_OPERATOR_URL, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Idempotency-Key": crypto.randomUUID(),
      "X-Source-Operator": "OP_EMISOR",
    },
  });
  return res.data; // { transferId, status }
}

// ---- Ciudadano (auth simple) ----
export async function citizenSignup(data) {
  // {id, name, email}
  const res = await fetch("http://localhost:8002/citizen/signup", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(data)
  });
  const json = await res.json();
  // El backend devuelve token en header X-Citizen-Token
  const token = res.headers.get("X-Citizen-Token");
  return { token, citizen: json };
}

export async function citizenLogin(data) {
  // {id, email}
  const res = await fetch("http://localhost:8002/citizen/login", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Credenciales inválidas");
  return res.json(); // {token, citizen}
}

export async function citizenMe(token) {
  const res = await fetch("http://localhost:8002/citizen/me", {
    headers: {"Authorization": `Bearer ${token}`}
  });
  if (!res.ok) throw new Error("No autenticado");
  return res.json();
}

export async function citizenDelete(token) {
  const res = await fetch("http://localhost:8002/citizen/me", {
    method: "DELETE",
    headers: {"Authorization": `Bearer ${token}`}
  });
  if (!res.ok) throw new Error("No se pudo eliminar");
  return res.json();
}