import React, { useEffect, useState } from "react";
import {
  Clock,
  ClipboardPlus,
  ListTodo,
  User2,
  History,
  Calculator,
  ChevronLeft,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { btn, capFirst } from "./agendaUtils";

// Reloj con hora y fecha (se actualiza solo)
function Reloj() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(t);
  }, []);

  const hora = now.toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit", hour12: false });
  const fecha = now.toLocaleDateString("es-UY", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="text-right leading-tight pr-1">
      <div className="text-xl sm:text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{hora}</div>
      <div className="hidden sm:block text-xs text-slate-600 dark:text-slate-400">{capFirst(fecha)}</div>
    </div>
  );
}

// Barra superior: logo, hora, navegación y modo oscuro
export default function AppHeader({
  darkMode,
  onToggleDark,
  view,
  overdueCount,
  onToday,
  onNew,
  onView,
  onCotizador,
  onBack,
  requireLogin,
  onLogout,
}) {
  return (
    <header className="max-w-7xl mx-auto mb-6 md:sticky md:top-3 z-30">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-300/80 dark:border-slate-700 shadow-md px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Logo y título */}
          <div className="flex items-center gap-3 min-w-0 order-1">
            <img src="/logo Office2000.webp" alt="Office2000" className="h-10 w-auto" />
            <div className="leading-tight min-w-0">
              <p className="text-sm sm:text-base font-bold text-[#0072ce] dark:text-sky-400 truncate">
                Agenda de Servicio Técnico
              </p>
            </div>
          </div>

          {/* Hora, modo oscuro y salir */}
          <div className="flex items-center gap-2 order-2 lg:order-3">
            <Reloj />
            <button
              onClick={onToggleDark}
              className={`${btn.ghost} !px-2.5`}
              title={darkMode ? "Modo claro" : "Modo oscuro"}
            >
              {darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
            </button>
            {requireLogin && (
              <button onClick={onLogout} className={btn.ghost} title="Cerrar sesión">
                <LogOut size={16} />
                <span className="hidden sm:inline">Salir</span>
              </button>
            )}
          </div>

          {/* Navegación (se desliza de costado en pantallas chicas) */}
          <nav className="order-3 lg:order-2 w-full lg:w-auto flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
            <button onClick={onToday} className={`${btn.ghost} shrink-0`}>
              <Clock size={16} className="text-slate-500 dark:text-slate-400" />
              <span>Hoy</span>
            </button>

            {view === "agenda" ? (
              <>
                <button onClick={onNew} className={`${btn.primary} shrink-0`}>
                  <ClipboardPlus size={16} />
                  <span>Nuevo</span>
                </button>

                <button onClick={() => onView("pendientes")} className={`${btn.softRed} shrink-0`}>
                  <ListTodo size={16} />
                  <span>Pendientes</span>
                  {overdueCount > 0 && (
                    <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-rose-600 text-white text-[11px] font-bold flex items-center justify-center">
                      {overdueCount}
                    </span>
                  )}
                </button>

                <button onClick={() => onView("clientes")} className={`${btn.softGreen} shrink-0`}>
                  <User2 size={16} />
                  <span>Clientes</span>
                </button>

                <button onClick={() => onView("programados")} className={`${btn.softCyan} shrink-0`}>
                  <History size={16} />
                  <span>Programados</span>
                </button>

                <button type="button" onClick={onCotizador} className={`${btn.softPurple} shrink-0`}>
                  <Calculator size={16} />
                  <span>Cotizador</span>
                </button>
              </>
            ) : (
              <button onClick={onBack} className={`${btn.ghost} shrink-0`}>
                <ChevronLeft size={16} className="text-slate-500 dark:text-slate-400" />
                <span>Volver</span>
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
