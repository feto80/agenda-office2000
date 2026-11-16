import React, { useEffect } from "react";
import { X } from "lucide-react";
import { btn } from "./agendaUtils";

const TONES = {
  blue: {
    icon: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200",
    save: btn.primary,
  },
  cyan: {
    icon: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-200",
    save: btn.cyan,
  },
  green: {
    icon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
    save: btn.green,
  },
  red: {
    icon: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
    save: btn.red,
  },
};

// Ventana emergente: encabezado y botones SIEMPRE fijos; solo el contenido se desplaza si no entra
export default function Modal({
  title,
  icon,
  accent = "blue",
  onClose,
  onSave,
  saveLabel = "Guardar",
  maxWidth = "max-w-xl",
  children,
}) {
  const tone = TONES[accent] || TONES.blue;

  // Mientras la ventana está abierta, la página de atrás no se mueve
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4">
      <div
        className={`flex flex-col w-full ${maxWidth} max-h-[95vh] bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-300 dark:border-slate-700`}
        style={{ maxHeight: "calc(100dvh - 1rem)" }}
      >
        {/* Encabezado fijo */}
        <div className="shrink-0 flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-200 dark:border-slate-700">
          <h2 className="flex items-center gap-3 text-base sm:text-lg font-semibold">
            <span className={`flex items-center justify-center w-9 h-9 rounded-xl ${tone.icon}`}>
              {icon}
            </span>
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido (se desplaza solo si la pantalla es muy chica) */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">{children}</div>

        {/* Botones fijos */}
        <div className="shrink-0 flex justify-end gap-2 px-5 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-b-2xl">
          <button onClick={onClose} className={btn.ghost}>
            {onSave ? "Cancelar" : "Cerrar"}
          </button>
          {onSave && (
            <button onClick={onSave} className={tone.save}>
              {saveLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
