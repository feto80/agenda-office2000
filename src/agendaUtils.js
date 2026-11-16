// Utilidades compartidas de la Agenda Técnica Office2000

export const TECHS = [
  { id: "luciano", name: "Luciano Comunale" },
  { id: "eduardo", name: "Eduardo Antúnez" },
];

// Cuántos meses hacia adelante se generan los servicios programados
export const LIMITE_MESES = 24;

export const STATUS_LABEL = {
  pendiente: "Pendiente",
  "en curso": "En curso",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

// ---------- Clases de estilo compartidas ----------
export const cardCls =
  "bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-md border border-slate-300/80 dark:border-slate-700 transition-colors duration-300";

export const inputCls =
  "w-full rounded-xl border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition focus:bg-white dark:focus:bg-slate-950 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20";

export const labelCls =
  "text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400 mb-1 block";

// Botones: base + variantes (sólidos y suaves, con borde para que se distingan bien)
const btnBase =
  "inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl whitespace-nowrap transition active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 disabled:opacity-60";

export const btn = {
  primary: `${btnBase} bg-blue-600 text-white shadow-sm hover:bg-blue-700`,
  green: `${btnBase} bg-emerald-600 text-white shadow-sm hover:bg-emerald-700`,
  red: `${btnBase} bg-rose-600 text-white shadow-sm hover:bg-rose-700`,
  cyan: `${btnBase} bg-cyan-600 text-white shadow-sm hover:bg-cyan-700`,
  ghost: `${btnBase} bg-white border border-slate-300 text-slate-800 shadow-sm hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-700`,
  // Las clases se escriben completas (no armadas con variables) para que Tailwind las detecte
  softBlue: `${btnBase} bg-blue-100 text-blue-800 ring-1 ring-inset ring-blue-300 hover:bg-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-400/30 dark:hover:bg-blue-500/25`,
  softGreen: `${btnBase} bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-300 hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/30 dark:hover:bg-emerald-500/25`,
  softRed: `${btnBase} bg-rose-100 text-rose-800 ring-1 ring-inset ring-rose-300 hover:bg-rose-200 dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-400/30 dark:hover:bg-rose-500/25`,
  softAmber: `${btnBase} bg-amber-100 text-amber-900 ring-1 ring-inset ring-amber-300 hover:bg-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/30 dark:hover:bg-amber-500/25`,
  softCyan: `${btnBase} bg-cyan-100 text-cyan-800 ring-1 ring-inset ring-cyan-300 hover:bg-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-200 dark:ring-cyan-400/30 dark:hover:bg-cyan-500/25`,
  softPurple: `${btnBase} bg-violet-100 text-violet-800 ring-1 ring-inset ring-violet-300 hover:bg-violet-200 dark:bg-violet-500/15 dark:text-violet-200 dark:ring-violet-400/30 dark:hover:bg-violet-500/25`,
};

// Tamaño chico para botones dentro de tarjetas
export const btnSm = "!px-3 !py-1.5 !text-xs";

// ---------- Texto y estados ----------
// Solo la primera letra en mayúscula ("lunes, 16 de noviembre" -> "Lunes, 16 de noviembre")
export const capFirst = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);

export const norm = (v) => String(v ?? "").trim().toLowerCase();

// Siempre en minúscula, aunque en la base haya quedado "Pendiente"
export const statusOf = (s) => norm(s?.status) || "pendiente";

export const isClosed = (s) => {
  const e = statusOf(s);
  return e === "finalizado" || e === "cancelado";
};

// ---------- Fechas ----------
export const pad = (n) => String(n).padStart(2, "0");

export const toLocalISODate = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const sameDay = (d1, d2) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

// "2026-11-14T09:30:00" -> { date: "2026-11-14", time: "09:30" } (sin convertir a UTC)
export const splitDateTime = (dt) => {
  if (!dt || typeof dt !== "string") return { date: "", time: "" };
  const [date, rest] = dt.split("T");
  return { date, time: rest ? rest.slice(0, 5) : "" };
};

export const fmtDate = (iso) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString("es-UY") : "";

// Normaliza una hora escrita a mano: "1430", "14.30", "9:5" -> "14:30", "09:05"
export const normalizeTime = (input) => {
  if (!input && input !== "") return null;
  let s = String(input).trim().replace(/[^\d:.,]/g, "");
  s = s.replace(/[.,]/g, ":");
  const digits = s.replace(/:/g, "");
  if (/^\d{1,4}$/.test(digits)) {
    if (digits.length === 3) s = `0${digits[0]}:${digits.slice(1)}`;
    else if (digits.length === 4) s = `${digits.slice(0, 2)}:${digits.slice(2)}`;
  }
  const m = s.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!m) return null;
  const hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  if (isNaN(hh) || isNaN(mm)) return null;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return `${pad(hh)}:${pad(mm)}`;
};

// Suma meses sin "saltarse" de mes (31 de enero + 1 mes = 28/29 de febrero)
export const addMonthsClamped = (year, month0, day, add) => {
  const total = month0 + add;
  const ty = year + Math.floor(total / 12);
  const tm = ((total % 12) + 12) % 12;
  const lastDay = new Date(ty, tm + 1, 0).getDate();
  return new Date(ty, tm, Math.min(day, lastDay));
};

// Lista de fechas (YYYY-MM-DD) de un servicio programado
export const fechasProgramado = (fecha, frecuencia, limiteMeses = LIMITE_MESES) => {
  const [y, m, d] = String(fecha).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return [];
  const paso = Number(frecuencia) || 1;
  const out = [];
  for (let i = 0; i < limiteMeses; i += paso) {
    out.push(toLocalISODate(addMonthsClamped(y, m - 1, d, i)));
  }
  return out;
};

// ---------- WhatsApp ----------
// Devuelve 598XXXXXXXX solo si es un celular uruguayo (09X XXX XXX)
export const waNumber = (phone) => {
  let d = String(phone ?? "").replace(/\D/g, "");
  if (d.startsWith("598") && d.length === 11) d = d.slice(3);
  d = d.replace(/^0/, "");
  return /^9\d{7}$/.test(d) ? `598${d}` : null;
};

export const waLink = (phone, text) => {
  const n = waNumber(phone);
  if (!n) return null;
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
};

// Mensaje listo para avisarle al cliente de la visita
export const buildVisitMessage = (s) => {
  const { date, time } = splitDateTime(s.datetime);
  const fecha = date
    ? new Date(`${date}T00:00:00`).toLocaleDateString("es-UY", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "";
  return (
    `Hola ${s.clientName || ""}, te escribimos de Office2000 para confirmar la visita del servicio técnico` +
    `${fecha ? ` el ${fecha}` : ""}${time ? ` a las ${time}` : ""}.` +
    `${s.description ? ` Motivo: ${s.description}.` : ""}` +
    ` Si necesitás cambiar el horario, avisanos por acá. ¡Gracias!`
  );
};

// ---------- Listas ----------
export const byDatetime = (a, b) => new Date(a.datetime) - new Date(b.datetime);
export const byName = (a, b) => (a.name || "").localeCompare(b.name || "");
export const byFecha = (a, b) => String(a.fecha).localeCompare(String(b.fecha));

// Agrega o reemplaza una fila (por id) sin duplicar
export const upsertById = (list, row, cmp) => {
  const exists = list.some((x) => x.id === row.id);
  const next = exists ? list.map((x) => (x.id === row.id ? row : x)) : [...list, row];
  return cmp ? next.sort(cmp) : next;
};

export const newId = (prefix = "") =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${prefix}${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
