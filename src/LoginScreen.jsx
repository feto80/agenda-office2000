import React, { useState } from "react";
import { inputCls, labelCls } from "./agendaUtils";

// Pantalla de acceso (solo se usa si REACT_APP_REQUIRE_LOGIN=true)
export default function LoginScreen({ onLogin, darkMode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const msg = await onLogin(email.trim(), password);
    if (msg) setError(msg);
    setLoading(false);
  };

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-[#0b1220] p-4 text-slate-800 dark:text-slate-100">
        <form
          onSubmit={submit}
          className="w-full max-w-sm bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 space-y-4"
        >
          <div className="text-center">
            <img src="/logo Office2000.webp" alt="Office2000" className="h-14 w-auto mx-auto mb-2" />
            <h1 className="text-lg font-bold text-[#0072ce]">Agenda Servicio Técnico</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Ingresá para continuar</p>
          </div>

          <div>
            <label className={labelCls}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className={labelCls}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              autoComplete="current-password"
              required
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 transition"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
