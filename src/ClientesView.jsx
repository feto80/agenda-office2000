import React, { useMemo, useState } from "react";
import {
  MapPin,
  Phone,
  Smartphone,
  Edit3,
  Trash2,
  UserPlus,
  CalendarPlus,
  History,
  Search,
} from "lucide-react";
import { cardCls, inputCls, btn, btnSm, norm, waLink } from "./agendaUtils";

const initials = (name) =>
  (name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

export default function ClientesView({
  clients,
  onNew,
  onEdit,
  onDelete,
  onSchedule,
  onHistory,
}) {
  const [term, setTerm] = useState("");

  const filtered = useMemo(() => {
    const q = norm(term);
    if (!q) return clients;
    return clients.filter(
      (c) =>
        norm(c.name).includes(q) ||
        norm(c.address).includes(q) ||
        norm(c.phone).includes(q)
    );
  }, [clients, term]);

  return (
    <section className="md:col-span-3">
      <div className={cardCls}>
        <div className="flex items-center justify-between gap-3 mb-5 max-sm:flex-col max-sm:items-start">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Clientes registrados
            </div>
            <div className="text-2xl font-bold">Lista de clientes ({clients.length})</div>
          </div>
          <button onClick={onNew} className={btn.primary}>
            <UserPlus size={16} />
            <span>Nuevo cliente</span>
          </button>
        </div>

        <div className="relative mb-4">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar cliente por nombre, dirección o teléfono..."
            className={`${inputCls} pl-10`}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-slate-600 dark:text-slate-400 p-4 text-center">
              No hay clientes para mostrar.
            </div>
          ) : (
            filtered.map((c) => {
              const link = waLink(c.phone);
              return (
                <div
                  key={c.id}
                  className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 rounded-2xl border border-slate-300/80 dark:border-slate-700 bg-white dark:bg-slate-800/60 p-3.5 hover:shadow-sm transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 shrink-0 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200 flex items-center justify-center text-sm font-semibold">
                      {initials(c.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{c.name}</div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-sm text-slate-600 dark:text-slate-400">
                        {c.address && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={14} />
                            {c.address}
                          </span>
                        )}
                        {c.phone &&
                          (link ? (
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 hover:underline"
                            >
                              <Smartphone size={14} />
                              {c.phone}
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <Phone size={14} />
                              {c.phone}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => onSchedule(c)} className={`${btn.primary} ${btnSm}`}>
                      <CalendarPlus size={14} />
                      <span>Agendar</span>
                    </button>
                    <button onClick={() => onHistory(c.id)} className={`${btn.softPurple} ${btnSm}`}>
                      <History size={14} />
                      <span>Historial</span>
                    </button>
                    <button onClick={() => onEdit(c)} className={`${btn.ghost} ${btnSm}`}>
                      <Edit3 size={14} />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => onDelete(c.id)}
                      title="Eliminar"
                      aria-label="Eliminar"
                      className={`${btn.softRed} ${btnSm}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
