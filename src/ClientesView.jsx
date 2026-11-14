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
} from "lucide-react";
import { cardCls, inputCls, norm, waLink } from "./agendaUtils";

const btn =
  "flex items-center gap-1 px-4 py-2 text-sm font-medium text-white rounded-full shadow-sm hover:shadow-md hover:scale-105 transition transform";

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
        <div className="flex items-center justify-between mb-4 max-sm:flex-col max-sm:items-start max-sm:gap-2">
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Clientes registrados</div>
            <div className="text-xl font-semibold max-sm:text-lg">
              Lista de clientes ({clients.length})
            </div>
          </div>
          <button
            onClick={onNew}
            className={`${btn} bg-green-600 hover:bg-green-700 px-5 py-2.5 text-base max-sm:px-4 max-sm:py-2 max-sm:text-sm`}
          >
            <UserPlus size={18} className="text-white" />
            <span>Nuevo cliente</span>
          </button>
        </div>

        <div className="mb-3">
          <input
            type="text"
            placeholder="Buscar cliente por nombre, dirección o teléfono..."
            className={inputCls}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400 p-3">No hay clientes para mostrar.</div>
          ) : (
            filtered.map((c) => {
              const link = waLink(c.phone);
              return (
                <div
                  key={c.id}
                  className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between max-sm:p-2"
                >
                  <div className="mb-2 sm:mb-0">
                    <div className="font-medium text-sm sm:text-base">{c.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 max-sm:text-xs">
                      <span className="inline-flex items-center">
                        <MapPin size={16} className="mr-1 text-gray-500 dark:text-gray-400 relative top-[1px]" />
                        {c.address}
                      </span>
                      {" • "}
                      {link ? (
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-green-600 hover:underline ml-1"
                        >
                          <Smartphone size={16} className="mr-1 text-green-600 relative top-[1px]" />
                          {c.phone}
                        </a>
                      ) : (
                        <span className="inline-flex items-center text-gray-700 dark:text-gray-300 ml-1">
                          <Phone size={16} className="mr-1 text-gray-600 dark:text-gray-400 relative top-[1px]" />
                          {c.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end">
                    <button onClick={() => onSchedule(c)} className={`${btn} bg-blue-600 hover:bg-blue-700`}>
                      <CalendarPlus size={16} />
                      <span>Agendar</span>
                    </button>
                    <button onClick={() => onHistory(c.id)} className={`${btn} bg-purple-600 hover:bg-purple-700`}>
                      <History size={16} />
                      <span>Servicios anteriores</span>
                    </button>
                    <div className="w-px h-6 bg-gray-300 dark:bg-slate-600 mx-2 max-sm:hidden"></div>
                    <button onClick={() => onEdit(c)} className={`${btn} bg-green-600 hover:bg-green-700`}>
                      <Edit3 size={16} />
                      <span>Editar</span>
                    </button>
                    <button onClick={() => onDelete(c.id)} className={`${btn} bg-red-600 hover:bg-red-700`}>
                      <Trash2 size={15} />
                      <span>Eliminar</span>
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
