import React, { useEffect, useState } from "react";
import {
  // auth ciudadano
  citizenSignup, citizenLogin, citizenMe, citizenDelete,
  // operador/orquestador
  getOperators,
  // operador→transferencia (tu endpoint)
  getToken, transferToOperator
} from "./api";
import "./index.css";

export default function App() {
  const [tab, setTab] = useState("auth");

  // ====== Estado citizen (sesión) ======
  const [citizenToken, setCitizenToken] = useState("");
  const [me, setMe] = useState(null);

  // signup/login forms
  const [signup, setSignup] = useState({ id: "", name: "", email: "" });
  const [login, setLogin] = useState({ id: "", email: "" });

  // ====== Transferencia ======
  const [ops, setOps] = useState([]);
  const [selectedOp, setSelectedOp] = useState("");
  const [tData, setTData] = useState({ id: "", name: "", email: "", url: "" });
  const [tResult, setTResult] = useState(null);
  const [opToken, setOpToken] = useState("");

  // ====== Estado simple ======
  const [statusMsg, setStatusMsg] = useState("");

  // cargar operadores cuando entro a Transferir
  useEffect(() => {
    if (tab === "transfer") loadOperators();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const loadOperators = async () => {
    const list = await getOperators();
    setOps(list);
    if (list.length && !selectedOp) setSelectedOp(list[0].name);
  };

  // ----- acciones ciudadano -----
  const doSignup = async (e) => {
    e.preventDefault();
    const { token, citizen } = await citizenSignup({
      id: parseInt(signup.id), name: signup.name, email: signup.email
    });
    setCitizenToken(token);
    setMe(citizen);
    setStatusMsg("Registro exitoso. Sesión iniciada.");
  };

  const doLogin = async (e) => {
    e.preventDefault();
    const r = await citizenLogin({ id: parseInt(login.id), email: login.email });
    setCitizenToken(r.token);
    setMe(r.citizen);
    setStatusMsg("Inicio de sesión exitoso.");
  };

  const refreshMe = async () => {
    const r = await citizenMe(citizenToken);
    setMe(r);
  };

  const doDelete = async () => {
    await citizenDelete(citizenToken);
    setMe(null);
    setCitizenToken("");
    setStatusMsg("Tu cuenta fue desactivada.");
  };

  // ----- operador tokens (para transferencia) -----
  const obtainOperatorToken = async () => {
    const t = await getToken();
    setOpToken(t);
  };

  // ----- transferencia -----
  const doTransfer = async (e) => {
    e.preventDefault();
    if (!opToken) { alert("Primero obtiene el token de operador"); return; }
    if (!selectedOp) { alert("Selecciona operador destino"); return; }

    const r = await transferToOperator(opToken, {
      targetOperatorName: selectedOp,
      citizen: { id: parseInt(tData.id), name: tData.name, email: tData.email },
      url: tData.url
    });
    setTResult(r);
  };

  const Tab = ({ id, label }) => (
    <button className={tab === id ? "tab active" : "tab"} onClick={() => setTab(id)}>{label}</button>
  );

  return (
    <div className="app">
      <h2>Operador – Carpeta Ciudadana</h2>

      <div className="tabs">
        <Tab id="auth" label="Registro / Iniciar sesión" />
        <Tab id="me" label="Mi cuenta" />
        <Tab id="transfer" label="Transferir" />
        <Tab id="status" label="Estado" />
      </div>

      {statusMsg && <p className="muted">{statusMsg}</p>}

      {/* ========== REGISTRO / LOGIN ========== */}
      {tab === "auth" && (
        <section>
          <h3>Registrarme</h3>
          <form onSubmit={doSignup}>
            <input placeholder="ID" value={signup.id} onChange={e=>setSignup({...signup,id:e.target.value})}/>
            <input placeholder="Nombre" value={signup.name} onChange={e=>setSignup({...signup,name:e.target.value})}/>
            <input placeholder="Email" value={signup.email} onChange={e=>setSignup({...signup,email:e.target.value})}/>
            <button>Registrarme</button>
          </form>

          <h3>Iniciar sesión</h3>
          <form onSubmit={doLogin}>
            <input placeholder="ID" value={login.id} onChange={e=>setLogin({...login,id:e.target.value})}/>
            <input placeholder="Email" value={login.email} onChange={e=>setLogin({...login,email:e.target.value})}/>
            <button>Entrar</button>
          </form>
        </section>
      )}

      {/* ========== MI CUENTA ========== */}
      {tab === "me" && (
        <section>
          <div className="row">
            <button type="button" onClick={refreshMe} disabled={!citizenToken}>Refrescar mis datos</button>
            <button type="button" className="danger" onClick={doDelete} disabled={!citizenToken}>Darme de baja</button>
          </div>
          {me ? <pre>{JSON.stringify(me, null, 2)}</pre> : <p className="muted">(No hay sesión activa)</p>}
        </section>
      )}

      {/* ========== TRANSFERIR ========== */}
      {tab === "transfer" && (
        <section>
          <div className="row">
            <button type="button" onClick={obtainOperatorToken}>Obtener token OPERADOR</button>
            <span className="muted">{opToken ? opToken.slice(0,24)+"..." : "(sin token operador)"}</span>
          </div>

          <label>Operador destino</label>
          <select value={selectedOp} onChange={e=>setSelectedOp(e.target.value)}>
            {ops.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}
            {!ops.length && <option value="">(no hay operadores)</option>}
          </select>

          <form onSubmit={doTransfer}>
            <input placeholder="ID" value={tData.id} onChange={e=>setTData({...tData,id:e.target.value})}/>
            <input placeholder="Nombre" value={tData.name} onChange={e=>setTData({...tData,name:e.target.value})}/>
            <input placeholder="Email" value={tData.email} onChange={e=>setTData({...tData,email:e.target.value})}/>
            <input placeholder="URL documento" value={tData.url} onChange={e=>setTData({...tData,url:e.target.value})}/>
            <button disabled={!opToken || !selectedOp}>Enviar transferencia</button>
          </form>

          {tResult && <pre>{JSON.stringify(tResult, null, 2)}</pre>}
        </section>
      )}

      {/* ========== ESTADO ========== */}
      {tab === "status" && (
        <section>

        </section>
      )}
    </div>
  );
}
