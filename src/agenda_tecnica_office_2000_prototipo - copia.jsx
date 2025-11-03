import toast, { Toaster } from "react-hot-toast";
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { MapPin, Phone, Smartphone, UserCog, Edit3, Trash2, CheckCircle2, User2, ChevronDown, ClipboardPlus, ChevronUp } from "lucide-react";
import { X, Save, UserPlus, FileDown, CalendarPlus, History, Clock, ChevronLeft, ListTodo } from "lucide-react";

// 📦 Exportación PDF (versión compatible)
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- Config Supabase (usa variables de entorno) ---
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Agenda Técnica Office2000 - Prototipo v1.2 (adaptado a Supabase, con autocompletado)
export default function AgendaTecnicaOffice2000() {
    // 🌙 Estado para modo oscuro
const [darkMode, setDarkMode] = useState(false);

  const TECHS = [
    { id: 'luciano', name: 'Luciano Comunale' },
    { id: 'eduardo', name: 'Eduardo Antúnez' },
  ];
// 📄 Exportar servicios del día a PDF
const exportToPDF = () => {
  if (!servicesOfDay?.length) {
    alert("No hay servicios para exportar");
    return;
  }

  try {
    
    // 🧾 Crear documento PDF
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "A4" });

    // 🖼️ Cargar logo desde /public
    const logo = new Image();
    logo.src = "/Office2000.png"; // ⚠️ Asegúrate del nombre exacto

    logo.onload = () => {
      // 🖼️ Agregar logo
      doc.addImage(logo, "PNG", 40, 20, 100, 50);

      // 🧾 Título
      doc.setFontSize(16);
      doc.text("Servicios del día", 40, 90);

      // 📅 Fecha actual
      const fechaActual = new Date(selectedDate).toLocaleDateString("es-UY", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(fechaActual, 40, 105);

      // 🕓 Datos (sin columna “Estado”)
      const tableData = servicesOfDay.map((s) => [
        s.clientName || "",
        s.address || "",
        s.phone || "",
        s.description || "",
        new Date(s.datetime).toLocaleString() || "",
      ]);

      // 📋 Tabla
      autoTable(doc, {
        startY: 120,
        head: [["Cliente", "Dirección", "Teléfono", "Descripción", "Fecha"]],
        body: tableData,
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [30, 64, 175] },
        alternateRowStyles: { fillColor: [245, 247, 255] },
      });

      // 💾 Guardar PDF con nombre dinámico
      const fechaArchivo = new Date(selectedDate).toISOString().slice(0, 10);
      const fileName = `servicios_${fechaArchivo}.pdf`;
      doc.save(fileName);
    };

    // ⚠️ Si el logo no carga, genera PDF sin él
    logo.onerror = () => {
      console.warn("No se pudo cargar el logo, generando PDF sin él.");
      doc.setFontSize(16);
      doc.text("Servicios del día", 40, 40);

      const tableData = servicesOfDay.map((s) => [
        s.clientName || "",
        s.address || "",
        s.phone || "",
        s.description || "",
        new Date(s.datetime).toLocaleString() || "",
      ]);

      autoTable(doc, {
        startY: 60,
        head: [["Cliente", "Dirección", "Teléfono", "Descripción", "Fecha"]],
        body: tableData,
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [30, 64, 175] },
        alternateRowStyles: { fillColor: [245, 247, 255] },
      });

      const fechaArchivo = new Date(selectedDate).toISOString().slice(0, 10);
      const fileName = `servicios_${fechaArchivo}.pdf`;
      doc.save(fileName);
    };
  } catch (error) {
    console.error("Error al exportar PDF:", error);
    alert("Ocurrió un error al generar el PDF. Ver consola.");
  }
};
  // Estados
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [highlightServiceId, setHighlightServiceId] = useState(null);

  // Estado para expandir/contraer servicios finalizados
const [expandedServices, setExpandedServices] = useState([]);

const toggleServiceExpand = (id) => {
  setExpandedServices((prev) => {
    const isAlreadyExpanded = prev.includes(id);

    // Si ya está expandido, lo contrae
    if (isAlreadyExpanded) {
      return prev.filter((x) => x !== id);
    }

    // Si se expande, lo agrega y programa que se cierre solo en 10 s
    const newExpanded = [...prev, id];
    setTimeout(() => {
      setExpandedServices((current) => current.filter((x) => x !== id));
    }, 10000); // 10 segundos

    return newExpanded;
  });
};

  // selected date
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

const [selectedClientServices, setSelectedClientServices] = useState([]);
const [showClientServicesModal, setShowClientServicesModal] = useState(false);

const showPreviousServices = (clientId) => {
  const client = clients.find((c) => c.id === clientId);
  if (!client) return;

  const list = services
    .filter((s) =>
      s.clientId === clientId ||
      (s.clientName &&
        client.name &&
        s.clientName.trim().toLowerCase() === client.name.trim().toLowerCase())
    )
    .sort((a, b) => new Date(b.datetime) - new Date(a.datetime));

  setSelectedClientServices(list);
  setShowClientServicesModal(true);
};



  const emptyForm = {
    id: null,
    clientId: '',
    clientName: '',
    address: '',
    phone: '',
    type: '',
    brand: '',
    model: '',
    description: '',
    datetime: '',
    status: 'pendiente',
    tech: TECHS[0].id,
  };
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
 // Normaliza distintos formatos de hora a "HH:MM"
  const normalizeTime = (input) => {
    if (!input && input !== "") return null;
    let s = String(input).trim().replace(/[^\d:.,]/g, "");
    s = s.replace(/[.,]/g, ":");
    const digits = s.replace(/:/g, "");
    if (/^\d{1,4}$/.test(digits)) {
      if (digits.length === 3) s = `0${digits[0]}:${digits.slice(1)}`;
      else if (digits.length === 4)
        s = `${digits.slice(0, 2)}:${digits.slice(2)}`;
    }
    const m = s.match(/^(\d{1,2}):(\d{1,2})$/);
    if (!m) return null;
    let hh = parseInt(m[1], 10);
    let mm = parseInt(m[2], 10);
    if (isNaN(hh) || isNaN(mm)) return null;
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  };

  // 🧩 Enfocar automáticamente el input de cliente al abrir el formulario
useEffect(() => {
  if (showForm) {
    setTimeout(() => document.getElementById("inputCliente")?.focus(), 100);
  }
}, [showForm]);
const [showWhatsappModal, setShowWhatsappModal] = useState(false);
const [whatsappNumber, setWhatsappNumber] = useState('');
  const [showClientModal, setShowClientModal] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', address: '', phone: '' });
  const [view, setView] = useState('agenda');

  // buscador de clientes
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const filteredClients = useMemo(() => {
    const q = clientSearchTerm.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.address || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    );
  }, [clients, clientSearchTerm]);

  // Autocomplete en cliente (para formulario de servicio)
  const [clientSuggestions, setClientSuggestions] = useState([]);
  const suggestionsRef = useRef(null);
  useEffect(() => {
    const onDoc = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setClientSuggestions([]);
      }
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  // utils fecha
  const sameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

  const servicesOfDay = useMemo(() => {
    return services.filter((s) => {
      const sd = new Date(s.datetime);
      return sameDay(sd, selectedDate);
    }).sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
  }, [services, selectedDate]);

  const monthMatrix = useMemo(() => {
    const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    const weeks = [];
    let week = [];
    const startDay = start.getDay(); // 0..6
    for (let i = 0; i < startDay; i++) week.push(null);
    for (let day = 1; day <= end.getDate(); day++) {
      week.push(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day));
      if (week.length === 7) { weeks.push(week); week = []; }
    }
    while (week.length > 0 && week.length < 7) week.push(null);
    if (week.length) weeks.push(week);
    return weeks;
  }, [selectedDate]);

  const countByDay = (date) => {
    if (!date) return 0;
    return services.filter((s) => sameDay(new Date(s.datetime), date)).length;
  };

  // ---------------- Supabase: funciones CRUD y carga inicial ----------------
  const fetchClientsFromSupabase = async () => {
    try {
      const { data, error } = await supabase.from('clients').select('*').order('name', { ascending: true });
      if (error) { console.error('Error fetching clients', error); return []; }
      return data || [];
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const fetchServicesFromSupabase = async () => {
    try {
      const { data, error } = await supabase.from('services').select('*').order('datetime', { ascending: true });
      if (error) { console.error('Error fetching services', error); return []; }
      return data || [];
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const createClientSupabase = async (c) => {
    try {
      const { data, error } = await supabase.from('clients').insert([c]).select();
      if (error) { console.error('create client error', error); return null; }
      return data[0];
    } catch (e) { console.error(e); return null; }
  };
  const updateClientSupabase = async (id, changes) => {
    try {
      const { data, error } = await supabase.from('clients').update(changes).eq('id', id).select();
      if (error) { console.error('update client error', error); return null; }
      return data[0];
    } catch (e) { console.error(e); return null; }
  };
  const deleteClientSupabase = async (id) => {
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) { console.error('delete client error', error); return false; }
      return true;
    } catch (e) { console.error(e); return false; }
  };

  const createServiceSupabase = async (s) => {
    try {
      const { data, error } = await supabase.from('services').insert([s]).select();
      if (error) { console.error('create service error', error); return null; }
      return data[0];
    } catch (e) { console.error(e); return null; }
  };
  const updateServiceSupabase = async (id, changes) => {
    try {
      const { data, error } = await supabase.from('services').update(changes).eq('id', id).select();
      if (error) { console.error('update service error', error); return null; }
      return data[0];
    } catch (e) { console.error(e); return null; }
  };
  const deleteServiceSupabase = async (id) => {
    try {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) { console.error('delete service error', error); return false; }
      return true;
    } catch (e) { console.error(e); return false; }
  };

// Cargar inicial y suscribirse a cambios realtime
useEffect(() => {
  let mounted = true;

  const loadInitial = async () => {
    try {
      const [c, s] = await Promise.all([
        fetchClientsFromSupabase(),
        fetchServicesFromSupabase(),
      ]);
      if (!mounted) return;
      setClients(c);
      setServices(s);
    } catch (err) {
      console.error("Error cargando datos iniciales:", err);
    }
  };
  loadInitial();

  // 🟢 Servicios
  const servicesChannel = supabase
    .channel("realtime-services")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "services" },
      (payload) => {
        const { eventType, new: nuevo, old } = payload;

        setServices((prev) => {
          switch (eventType) {
            case "INSERT":
 toast.success(`📦 Nuevo servicio agendado: ${nuevo.clientName}`, {
  duration: 8000 // ⏱️ dura 8 segundos (podés poner 10000 = 10s, etc.)
});
              return [...prev, nuevo].sort(
                (a, b) => new Date(a.datetime) - new Date(b.datetime)
              );
            case "UPDATE":
              toast(`🧰 Servicio actualizado: ${nuevo.clientName}`, {
                icon: "🔄", 
                duration: 8000, // tiempo en milisegundos (8000 = 8 segundos)
              });
              return prev
                .map((s) => (s.id === nuevo.id ? nuevo : s))
                .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
            case "DELETE":
              toast.error(`❌ Servicio eliminado`,{ duration: 8000, // ⏱️ dura 8 segundos
});
              return prev.filter((s) => s.id !== old.id);
            default:
              return prev;
          }
        });
      }
    )
    .subscribe();

  // 🟢 Clientes
  const clientsChannel = supabase
    .channel("realtime-clients")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "clients" },
      (payload) => {
        const { eventType, new: nuevo, old } = payload;

        setClients((prev) => {
          switch (eventType) {
            case "INSERT":
              toast.success(`👤 Nuevo cliente agregado: ${nuevo.name}`,{ duration: 8000, // ⏱️ dura 8 segundos
});
              return [...prev, nuevo].sort((a, b) =>
                (a.name || "").localeCompare(b.name || "")
              );
            case "UPDATE":
              toast(`✏️ Cliente actualizado: ${nuevo.name}`, { icon: "🧾" },
                { duration: 8000, // ⏱️ dura 8 segundos
});
              return prev
                .map((c) => (c.id === nuevo.id ? nuevo : c))
                .sort((a, b) =>
                  (a.name || "").localeCompare(b.name || "")
                );
            case "DELETE":
              toast.error(`❌ Cliente eliminado`,{ duration: 8000, // ⏱️ dura 8 segundos
});
              return prev.filter((c) => c.id !== old.id);
            default:
              return prev;
          }
        });
      }
    )
    .subscribe();

  return () => {
    mounted = false;
    supabase.removeChannel(servicesChannel);
    supabase.removeChannel(clientsChannel);
  };
}, []);

// --------------- Handlers y lógica de UI ----------------
const openNewService = (prefillDate) => {
  let iso = "";
  if (prefillDate) {
    const d = new Date(prefillDate);
    const localDate = `${d.getFullYear()}-${String(
      d.getMonth() + 1
    ).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const localTime = `${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`;
    iso = `${localDate}T${localTime}`;
  }
  setForm({ ...emptyForm, datetime: iso });
  setClientSuggestions([]);
  setShowForm(true);
};

// ✅ Corregido: evita corrimiento de -3h al editar
const openEditService = (svc) => {
  if (!svc.datetime) return;

  // Si viene en formato ISO (de Supabase), usamos la parte local
  const [datePart, timePartRaw] = svc.datetime.split("T");
  const timePart = timePartRaw ? timePartRaw.substring(0, 5) : "00:00";
  const localDatetime = `${datePart}T${timePart}`;

  setForm({ ...svc, datetime: localDatetime });
  setClientSuggestions([]);
  setShowForm(true);
};

// ✅ Guarda sin convertir a UTC (mantiene hora exacta)
const saveService = async () => {
  if (!form.clientName || !form.datetime) {
    alert("Complete cliente y fecha/hora");
    return;
  }

  // 🕓 Validar y normalizar hora ingresada
  const datePart = form.datetime.split("T")[0] || "";
  let timePart =
    form.datetime && form.datetime.includes("T")
      ? form.datetime.split("T")[1].slice(0, 5)
      : "";
  const normalized = normalizeTime(timePart);
  if (!normalized) {
    alert("Hora inválida. Ingresá una hora válida (ej: 14:30).");
    return;
  }

  const localDatetime = `${datePart}T${normalized}:00`;

  // Asociar cliente si existe
  const match = clients.find(
    (c) =>
      c.name.toLowerCase() === (form.clientName || "").trim().toLowerCase()
  );
  const clientId = match ? match.id : form.clientId || "";

  const svcData = {
    ...form,
    clientId,
    clientName: form.clientName,
    datetime: localDatetime, // sin UTC
  };

  if (form.id) {
    // 🔁 actualizar servicio existente
    await updateServiceSupabase(form.id, svcData);
  } else {
    // ➕ crear nuevo servicio
    const id = "s" + Math.random().toString(36).slice(2, 8);
    const newSvc = { ...svcData, id };
    await createServiceSupabase(newSvc);
  }

  // ✅ Reiniciar formulario
  setShowForm(false);
  setForm(emptyForm);
  setClientSuggestions([]);
};

// ---------------- Otros handlers ----------------
const deleteService = async (id) => {
  if (!window.confirm("Eliminar servicio?")) return;
  await deleteServiceSupabase(id);
};

const markFinalized = async (id) => {
  await updateServiceSupabase(id, { status: "finalizado" });
};

const handleClientSelect = (clientId) => {
  const c = clients.find((x) => x.id === clientId);
  if (c)
    setForm((f) => ({
      ...f,
      clientId: c.id,
      clientName: c.name,
      address: c.address,
      phone: c.phone,
    }));
};

const addClientQuick = async () => {
  if (!form.clientName)
    return alert("Escriba nombre para crear cliente rápido");
  const existing = clients.find(
    (c) =>
      c.name.toLowerCase() === form.clientName.trim().toLowerCase()
  );
  if (existing) {
    setForm((f) => ({
      ...f,
      clientId: existing.id,
      clientName: existing.name,
    }));
    return;
  }
  const id = "c" + Math.random().toString(36).slice(2, 8);
  const newC = {
    id,
    name: form.clientName,
    address: form.address,
    phone: form.phone,
  };
  await createClientSupabase(newC);
  setForm((f) => ({ ...f, clientId: id }));
};

const openNewClientModal = () => {
  setNewClient({ name: "", address: "", phone: "" });
  setShowClientModal(true);
};

const saveNewClient = async () => {
  if (!newClient.name) return alert("Complete el nombre del cliente");

  let savedClient = null;

  if (newClient.id) {
    const updated = await updateClientSupabase(newClient.id, {
      name: newClient.name,
      address: newClient.address,
      phone: newClient.phone,
    });
    savedClient = updated;

    // 🧩 Si cambió el nombre, actualizar también en servicios
    if (updated) {
      const affectedServices = services.filter(
        (s) => s.clientId === updated.id
      );

      for (const s of affectedServices) {
        await updateServiceSupabase(s.id, { clientName: updated.name });
      }

      if (affectedServices.length > 0) {
        toast.success(
          `🧾 Se actualizó el nombre en ${affectedServices.length} servicio${
            affectedServices.length > 1 ? "s" : ""
          }.`,
          { duration: 6000 }
        );
      }
    }
  } else {
    // 🆕 Crear cliente nuevo
    const id = "c" + Math.random().toString(36).slice(2, 8);
    const c = {
      id,
      name: newClient.name,
      address: newClient.address,
      phone: newClient.phone,
    };
    const created = await createClientSupabase(c);
    savedClient = created;
  }

  // 🧩 Vincular servicios huérfanos
  if (savedClient && savedClient.name) {
    const orphanServices = services.filter(
      (s) =>
        (!s.clientId || s.clientId.trim() === "") &&
        s.clientName &&
        s.clientName.trim().toLowerCase() ===
          savedClient.name.trim().toLowerCase()
    );

    let count = 0;
    for (const s of orphanServices) {
      await updateServiceSupabase(s.id, { clientId: savedClient.id });
      count++;
    }

    if (count > 0) {
      toast.success(
        `🔗 Se vincularon ${count} servicio${count > 1 ? "s" : ""} anterior${
          count > 1 ? "es" : ""
        } con este cliente.`,
        { duration: 6000 }
      );
    }
  }

  setShowClientModal(false);
  setNewClient({ name: "", address: "", phone: "" });
};

const onClientNameChange = (val) => {
  setForm((f) => ({ ...f, clientName: val, clientId: "" }));
  if (!val || val.trim().length < 1) {
    setClientSuggestions([]);
    return;
  }
  const q = val.trim().toLowerCase();
  const matches = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      (c.phone || "").toLowerCase().includes(q) ||
      (c.address || "").toLowerCase().includes(q)
  );
  setClientSuggestions(matches.slice(0, 8));
};

const editClient = (c) => {
  setNewClient({
    id: c.id,
    name: c.name,
    address: c.address,
    phone: c.phone,
  });
  setShowClientModal(true);
};

const deleteClientHandler = async (id) => {
  if (!window.confirm("Eliminar cliente?")) return;
  await deleteClientSupabase(id);
};

  // UI helpers
const statusColor = (status) => {
  switch (status) {
    case 'pendiente':
      return 'border-red-300 bg-red-50 dark:bg-red-950 text-red-800';
    case 'en curso':
      return 'border-yellow-300 bg-yellow-50 text-yellow-800';
    case 'finalizado':
      return 'border-green-300 bg-green-50 text-green-800';
    case 'cancelado':
      return 'border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-900/90 text-gray-700 dark:text-gray-300';
    default:
      return 'border-gray-100 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300';
  }
};
  const today = new Date(); today.setHours(0,0,0,0);
return (
  <div className={`${darkMode ? "dark" : ""}`}>
<div className="min-h-screen bg-slate-100 dark:bg-[#0b1220] transition-colors duration-300 ease-in-out p-4 sm:p-6 md:p-8 font-sans text-slate-800 dark:text-slate-100 antialiased overflow-x-hidden pb-20 transition-colors duration-300">
    <Toaster position="bottom-right" reverseOrder={false} />
<header className="max-w-7xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 text-sm bg-white dark:bg-slate-800/70 dark:bg-slate-800/70 rounded-xl p-3 shadow-md border border-slate-200 dark:border-slate-700 dark:border-slate-700 backdrop-blur-sm text-slate-800 dark:text-slate-100 transition-colors duration-300">

     <div className="flex items-center gap-3">
  <img
    src="/logo Office2000.webp"
    alt="Office2000"
className="h-[4.7rem] w-auto"
  />
<div className="flex items-center gap-2">
<p className="ml-8 text-base md:text-lg font-bold text-[#0072ce] drop-shadow-md">
    AGENDA SERVICIO TÉCNICO
  </p>
</div>

  </div>
{/* 🔘 Botones superiores - versión final */}
<div className="flex flex-wrap gap-3 justify-end items-center mb-4">
{/* 🌙 Modo oscuro */}
<button
  onClick={() => setDarkMode(!darkMode)}
  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white dark:bg-slate-800 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-full shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:bg-slate-700 hover:shadow-md transition-all duration-200"
>
  {darkMode ? (
    <>
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h1M3 12H2m15.364 6.364l.707.707M6.343 6.343l-.707-.707m12.728 0l.707-.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
      Claro
    </>
  ) : (
    <>
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
      </svg>
      Oscuro
    </>
  )}
</button>

  {/* 📅 Hoy */}
  <button
    onClick={() => {
      setSelectedDate(new Date());
      setView("agenda");
      setClientSearchTerm(""); // 🧹 limpia el buscador
    }}
    className="flex items-center gap-2 px-5 py-2.5 text-base font-medium bg-white dark:bg-slate-800 border border-slate-300 rounded-full shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700 hover:shadow-md active:scale-[0.98] transition-all duration-200"

  >
    <Clock size={18} className="text-gray-600 dark:text-gray-400" />
    <span>Hoy</span>
  </button>

  {view === "agenda" && (
    <>
      {/* 🧾 Nuevo servicio */}
      <button
        onClick={() => openNewService(selectedDate)}
        className="flex items-center gap-2 px-5 py-2.5 text-base font-medium bg-blue-600 text-white rounded-full shadow-sm hover:bg-blue-700 hover:shadow-md hover:scale-105 transition transform"
      >
        <ClipboardPlus size={18} className="text-white" />
        <span>Nuevo servicio</span>
      </button>

      {/* 📝 Pendientes */}
      <button
        onClick={() => setView("pendientes")}
        className="flex items-center gap-2 px-5 py-2.5 text-base font-medium bg-red-600 text-white rounded-full shadow-sm hover:bg-red-700 hover:shadow-md hover:scale-105 transition transform"
      >
        <ListTodo size={18} className="text-white" />
        <span>Pendientes</span>
      </button>
    </>
  )}

  {/* 👥 Clientes / Volver */}
  {view === "agenda" ? (
    <button
      onClick={() => setView("clients")}
      className="flex items-center gap-2 px-5 py-2.5 text-base font-medium bg-green-600 text-white rounded-full shadow-sm hover:bg-green-700 hover:shadow-md hover:scale-105 transition transform"
    >
      <User2 size={18} className="text-white" />
      <span>Clientes</span>
    </button>
  ) : (
    <button
      onClick={() => {
        setView("agenda");
        setClientSearchTerm(""); // 🟢 limpia el buscador
      }}
      className="flex items-center gap-2 px-5 py-2.5 text-base font-medium bg-white dark:bg-slate-800 border border-slate-300 rounded-full shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700 hover:shadow-md active:scale-[0.98] transition-all duration-200"
    >
      <ChevronLeft size={18} className="text-gray-600 dark:text-gray-400" />
      <span>Volver</span>
    </button>
  )}
</div>

</header>
<main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 items-start content-start">

  {view === 'agenda' ? (
    <>   
<aside className="md:col-span-1 flex flex-col justify-start h-fit mt-[8px]">
{/* --- Calendario (moderno y limpio) --- */}
<div className="p-3 bg-white dark:bg-slate-800/95 dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 dark:border-slate-700 backdrop-blur-sm transition-colors duration-300">

  {/* Encabezado del calendario */}
  <div className="flex items-center justify-between mb-4">
    <div>
      <div className="text-lg font-semibold text-gray-800 dark:text-gray-100">
        {selectedDate.toLocaleString('es-UY', { month: 'long' })} de {selectedDate.getFullYear()}
      </div>
    </div>
<div className="flex gap-2">
  <button
    onClick={() => setSelectedDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
    className="flex items-center justify-center w-8 h-8 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 hover:text-gray-800 dark:text-gray-100 transition"
  >
    <span className="text-lg font-semibold">&lt;</span>
  </button>

  <button
    onClick={() => setSelectedDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
    className="flex items-center justify-center w-8 h-8 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 hover:text-gray-800 dark:text-gray-100 transition"
  >
    <span className="text-lg font-semibold">&gt;</span>
  </button>
</div>

  </div>

  {/* Días de la semana */}
  <div className="grid grid-cols-7 text-xs font-medium text-center text-gray-500 dark:text-gray-400 border-b pb-1">
    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
      <div key={d}>{d}</div>
    ))}
  </div>

  {/* Días del mes */}
  <div className="mt-2 space-y-1">
    {monthMatrix.map((week, i) => (
      <div key={i} className="grid grid-cols-7 gap-1 text-sm">
        {week.map((day, j) => {
          const isToday = day && sameDay(day, today);
          const isSelected = day && sameDay(day, selectedDate);
          const cnt = day ? countByDay(day) : 0;

          return (
            <button
  key={j}
  onClick={() => day && setSelectedDate(new Date(day))}
  disabled={!day}
  className={`relative p-2 rounded-lg text-left h-12 flex flex-col justify-between transition-all duration-200
    ${!day
      ? 'bg-gray-50 dark:bg-slate-900 cursor-default'
      : isToday
      ? 'bg-blue-600 text-white font-semibold shadow-md'
      : isSelected
      ? 'bg-blue-400 text-white shadow-md hover:bg-blue-300'
      : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:bg-slate-800/70 hover:shadow-sm'}
  `}
>
  <div className="text-sm">{day ? day.getDate() : ''}</div>
{/* Contador de servicios */}
{cnt > 0 && (
  <div
    className={`absolute bottom-1 right-1 flex items-center text-xs font-medium ${
      isToday ? 'text-white' : 'text-blue-800 dark:text-white'
    }`}
  >
    <span
      className={`inline-block w-2 h-2 rounded-full mr-1 ${
        isToday ? 'bg-white dark:bg-slate-800' : 'bg-blue-600 dark:bg-white'
      }`}
    ></span>
    <span>{cnt}</span>
  </div>
)}
            </button>
          );
        })}
      </div>
    ))}
  </div>
</div>

      </aside>
<section className="md:col-span-2 flex flex-col justify-start h-fit mt-[8px]">
<div className="bg-white dark:bg-slate-800/95 dark:bg-slate-800 p-5 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 dark:border-slate-700 backdrop-blur-sm transition-colors duration-300">
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
  {/* 🧾 Lado izquierdo: título y fecha */}
  <div>
    <div className="text-sm text-gray-500 dark:text-gray-400">Agenda diaria</div>
    <div className="text-xl font-semibold">
      {selectedDate.toLocaleDateString('es-UY', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}
    </div>
  </div>
{/* 📦 Botones de acción (WhatsApp + PDF) */}
<div className="flex flex-wrap justify-end sm:justify-between items-center gap-3 mt-3 sm:mt-0">

  {/* 🟢 Enviar WhatsApp */}
  <button
    onClick={() => setShowWhatsappModal(true)}
    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-full shadow-sm hover:bg-green-700 hover:shadow-md hover:scale-105 transition transform"
  >
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
      alt="WhatsApp"
      className="w-4 h-4 drop-shadow-sm"
    />
    <span>Enviar WhatsApp</span>
  </button>

  {/* 📂 Exportar PDF */}
  <button
    onClick={exportToPDF}
    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-full shadow-sm hover:bg-red-700 hover:shadow-md hover:scale-105 transition transform"
  >
    <FileDown size={16} className="text-white" />
    <span>Exportar PDF</span>
  </button>

</div>

</div>
          <div className="space-y-3">
            {servicesOfDay.length === 0 && (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                No hay servicios para este día. Hacé clic en "Nuevo servicio" para agregar uno.
              </div>
            )}

{servicesOfDay.map((s) => {
  const isExpanded = expandedServices.includes(s.id);
  const isFinalizado = s.status === "finalizado";

  return (
    <div
      key={s.id}
      onClick={() => isFinalizado && toggleServiceExpand(s.id)}
className={`p-4 mb-4 rounded-xl shadow-md border-l-4 transition-all duration-200 text-slate-800 dark:text-slate-100 ${
  highlightServiceId === s.id
    ? "bg-violet-100 dark:bg-violet-900 border-l-violet-500"
    : s.status === "pendiente"
    ? "border-l-red-400 bg-red-100 dark:bg-red-950"
    : s.status === "finalizado"
    ? "border-l-green-400 bg-green-100 dark:bg-green-950"
    : "border-l-gray-300 bg-white dark:bg-slate-800/95 dark:bg-slate-800"
}`}


    >
      {/* Contenedor principal */}
      <div className="flex justify-between items-start max-sm:flex-col max-sm:gap-2">
        {/* 🧾 Lado izquierdo: datos del cliente */}
        <div className="w-full">
          {/* Cliente, hora y flecha */}
          <div className="flex items-center justify-between max-sm:flex-wrap">
            <div className="flex items-center space-x-6 max-sm:space-x-3 max-sm:flex-wrap">
              <span className="font-semibold text-mg text-gray-800 dark:text-gray-100 max-sm:text-sm flex items-center gap-1">
                <User2 size={16} className="text-gray-600 dark:text-gray-400 relative top-[1px]" />
                {s.clientName}
              </span>
              <span className="font-semibold text-mg text-gray-800 dark:text-gray-100 max-sm:text-sm">
{(s.datetime && s.datetime.includes("T"))
  ? s.datetime.split("T")[1].slice(0,5)
  : ""}

              </span>
            </div>

            {/* Flecha al extremo derecho */}
            {isFinalizado && (
              <span className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 cursor-pointer ml-2">
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </span>
            )}
          </div>

          {/* Si está finalizado y NO expandido → mostrar solo descripción resumida */}
          {isFinalizado && !isExpanded && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-sm:text-xs italic truncate">
              {s.description}
            </div>
          )}

          {/* Mostrar el contenido completo si NO es finalizado o si está expandido */}
          {(!isFinalizado || isExpanded) && (
            <>
              {/* Tipo de equipo, marca y modelo */}
              <div className="text-sm text-gray-700 dark:text-gray-300 mt-1 max-sm:text-xs">
                {s.type} • {s.brand} {s.model}
              </div>

              {/* Descripción */}
              <div className="text-sm text-gray-800 dark:text-gray-100 mt-1 max-sm:text-xs">
                {s.description}
              </div>

              {/* Dirección y teléfono */}
              <div className="text-sm text-gray-700 dark:text-gray-300 mt-1 max-sm:text-xs break-words">
                <span className="inline-flex items-center">
                  <MapPin
                    size={16}
                    className="mr-1 text-gray-500 dark:text-gray-400 relative top-[1px]"
                  />
                  {s.address}
                </span>
                {" • "}
                {/^0?9\d{7}$/.test(s.phone.replace(/\D/g, "")) ? (
                  <a
                    href={`https://wa.me/598${s.phone
                      .replace(/\D/g, "")
                      .replace(/^0/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-green-600 hover:underline ml-1"
                  >
                    <Smartphone
                      size={16}
                      className="mr-1 text-green-600 relative top-[1px]"
                    />
                    {s.phone}
                  </a>
                ) : (
                  <span className="inline-flex items-center text-gray-700 dark:text-gray-300 ml-1">
                    <Phone
                      size={16}
                      className="mr-1 text-gray-600 dark:text-gray-400 relative top-[1px]"
                    />
                    {s.phone}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* 🧰 Lado derecho: técnico + botones */}
        {(!isFinalizado || isExpanded) && (
          <div className="flex flex-col items-end gap-2 mt-2 max-sm:items-start max-sm:w-full">
            <div className="text-xs text-gray-600 dark:text-gray-400 max-sm:text-xs hidden sm:block">
              <span className="inline-flex items-center">
                <UserCog
                  size={14}
                  className="mr-1 text-gray-500 dark:text-gray-400 relative top-[1px]"
                />
                Técnico: {TECHS.find((t) => t.id === s.tech)?.name}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 justify-end max-sm:justify-start">
              {/* ✏️ Editar */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openEditService(s);
                }}
                className="flex items-center gap-1 px-3 py-1 text-sm font-medium bg-blue-100 border border-blue-400 text-blue-700 rounded-full shadow-sm hover:bg-blue-200 hover:shadow-md hover:scale-105 transition transform max-sm:text-xs"
              >
                <Edit3 size={16} className="text-blue-600" />
                <span>Editar</span>
              </button>

              {/* 🗑️ Eliminar */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteService(s.id);
                }}
                className="flex items-center gap-1 px-3 py-1 text-sm font-medium bg-red-100 border border-red-400 text-red-700 rounded-full shadow-sm hover:bg-red-200 hover:shadow-md hover:scale-105 transition transform max-sm:text-xs"
              >
                <Trash2 size={16} className="text-red-600" />
                <span>Eliminar</span>
              </button>

              {/* ✅ Finalizado */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  markFinalized(s.id);
                }}
                className="flex items-center gap-1 px-3 py-1 text-sm font-medium bg-green-100 border border-green-400 text-green-700 rounded-full shadow-sm hover:bg-green-200 hover:shadow-md hover:scale-105 transition transform max-sm:text-xs"
              >
                <CheckCircle2 size={16} className="text-green-600" />
                <span>Finalizado</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
})}

          </div>
        </div>
      </section>
    </>
  ) : view === 'pendientes' ? (
    <section className="md:col-span-3">
<div className="bg-white dark:bg-slate-800/95 dark:bg-slate-800 p-5 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 dark:border-slate-700 backdrop-blur-sm transition-colors duration-300">

        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Servicios pendientes</div>
            <div className="text-xl font-semibold">Listado de pendientes</div>
          </div>
          <div className="flex gap-2">
          </div>
        </div>

        {/* Listado */}
<div className="space-y-3">
  {services.filter(s => {
    if (s.status !== 'pendiente') return false;
    const fechaServicio = new Date(s.datetime);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return fechaServicio <= hoy;
  }).length === 0 ? (
    <div className="p-6 text-center text-gray-500 dark:text-gray-400">
      No hay servicios pendientes anteriores a hoy.
    </div>
  ) : (
    services
      .filter(s => {
        if (s.status !== 'pendiente') return false;
        const fechaServicio = new Date(s.datetime);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        return fechaServicio <= hoy;
      })
      .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
      .map(s => (
        <div key={s.id} className="p-3 border rounded shadow-sm bg-red-50 dark:bg-red-950 flex items-start justify-between">
          <div>
            <div className="font-medium text-red-800">{s.clientName}</div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {new Date(s.datetime).toLocaleDateString('es-UY')} •{' '}
              {new Date(s.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {s.description || '(Sin descripción)'}
            </div>
          </div>
          <div className="ml-4">
            <button
              onClick={() => markFinalized(s.id)}
              className="px-3 py-1 bg-green-600 text-white rounded shadow"
            >
              Finalizado
            </button>
          </div>
        </div>
      ))
  )}
</div>

      </div>
    </section>
  ) : (
    <section className="md:col-span-3">
{/* --- Vista de clientes (dejala como estaba) --- */}
<div className="bg-white dark:bg-slate-800/95 dark:bg-slate-800 p-5 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 dark:border-slate-700 backdrop-blur-sm transition-colors duration-300">
  <div className="flex items-center justify-between mb-4 max-sm:flex-col max-sm:items-start max-sm:gap-2">
    <div>
      <div className="text-sm text-gray-500 dark:text-gray-400">Clientes registrados</div>
      <div className="text-xl font-semibold max-sm:text-lg">Lista de clientes</div>
    </div>
    <div className="flex gap-2">
<button
  onClick={openNewClientModal}
  className="flex items-center gap-2 px-5 py-2.5 text-base font-medium bg-green-600 text-white rounded-full shadow-sm hover:bg-green-700 hover:shadow-md hover:scale-105 transition transform max-sm:px-4 max-sm:py-2 max-sm:text-sm"
>
  <UserPlus size={18} className="text-white" />
  <span>Nuevo cliente</span>
</button>


    </div>
  </div>

  <div className="mb-3">
    <input
      type="text"
      placeholder="Buscar cliente por nombre, dirección o teléfono..."
      className="w-full border rounded px-3 py-2 text-sm max-sm:text-xs"
      value={clientSearchTerm}
      onChange={(e) => setClientSearchTerm(e.target.value)}
    />
  </div>

  <div className="space-y-2">
    {filteredClients.length === 0 ? (
      <div className="text-gray-500 dark:text-gray-400 p-3">No hay clientes registrados.</div>
    ) : (
      filteredClients.map((c) => (
        <div
          key={c.id}
          className="border rounded p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between max-sm:p-2"
        >
          <div className="mb-2 sm:mb-0">
            <div className="font-medium text-sm sm:text-base">{c.name}</div>
<div className="text-sm text-gray-500 dark:text-gray-400 max-sm:text-xs">
  <span className="inline-flex items-center">
    <MapPin size={16} className="mr-1 text-gray-500 dark:text-gray-400 relative top-[1px]" />
    {c.address}
  </span>
  {' • '}
  {/^0?9\d{7}$/.test(c.phone.replace(/\D/g, '')) ? (
    <a
      href={`https://wa.me/598${c.phone.replace(/\D/g, '').replace(/^0/, '')}`}
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

{/* Botones del cliente */}
<div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end">

  {/* 🔵 Agendar */}
  <button
    onClick={() => {
      setView("agenda");
      setForm({
        ...emptyForm,
        clientId: c.id,
        clientName: c.name,
        address: c.address,
        phone: c.phone,
      });
      setShowForm(true);
    }}
    className="flex items-center gap-1 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-full shadow-sm hover:bg-blue-700 hover:shadow-md hover:scale-105 transition transform"
  >
    <CalendarPlus size={16} className="text-white" />
    <span>Agendar</span>
  </button>

  {/* 🟣 Servicios anteriores */}
  <button
    onClick={() => showPreviousServices(c.id)}
    className="flex items-center gap-1 px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-full shadow-sm hover:bg-purple-700 hover:shadow-md hover:scale-105 transition transform"
  >
    <History size={16} className="text-white" />
    <span>Servicios anteriores</span>
  </button>

  {/* 🔸 Separador visual */}
  <div className="w-px h-6 bg-gray-300 mx-2"></div>

  {/* 🟢 Editar */}
  <button
    onClick={() => editClient(c)}
    className="flex items-center gap-1 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-full shadow-sm hover:bg-green-700 hover:shadow-md hover:scale-105 transition transform"
  >
    <Edit3 size={16} className="text-white" />
    <span>Editar</span>
  </button>

  {/* 🔴 Eliminar */}
  <button
    onClick={() => deleteClientHandler(c.id)}
    className="flex items-center gap-1 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-full shadow-sm hover:bg-red-700 hover:shadow-md hover:scale-105 transition transform"
  >
    <Trash2 size={16} className="text-white" />
    <span>Eliminar</span>
  </button>
</div>
        </div>
      ))
    )}
  </div>
</div>
    </section>
  )}
</main>

{/* 🧾 Modal Formulario de Servicio - versión final con Lucide y altura corregida */}
{showForm && (
  <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-4 z-50 overflow-y-auto backdrop-blur-sm">
    <div className="bg-white dark:bg-slate-800 dark:bg-slate-800 w-full max-w-xl mt-10 rounded-2xl shadow-2xl overflow-hidden border-slate-200 dark:border-slate-700 dark:border-slate-700 animate-fadeIn transition-colors duration-300
">

      {/* 🔹 Encabezado con gradiente y botones Lucide */}
      <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white">
<h2 className="text-lg font-semibold flex items-center gap-2">
  {form.id ? (
    <>
      <Edit3 size={18} className="text-white" />
      Editar servicio
    </>
  ) : (
    <>
      <ClipboardPlus size={18} className="text-white" />
      Nuevo servicio
    </>
  )}
</h2>

        <div className="flex gap-2">
          {/* Botón Cerrar */}
          <button
            onClick={() => {
              setShowForm(false);
              setForm(emptyForm);
              setClientSuggestions([]);
            }}
            className="flex items-center gap-1 px-3 py-1 text-sm font-medium bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600 rounded-full shadow-sm hover:bg-gray-100 dark:bg-slate-900/90 hover:shadow-md hover:scale-105 transition"
          >
            <X size={16} className="text-gray-600 dark:text-gray-400" />
            <span>Cerrar</span>
          </button>

          {/* Botón Guardar */}
          <button
            onClick={saveService}
            className="flex items-center gap-1 px-3 py-1 text-sm font-medium bg-blue-600 text-white rounded-full shadow-sm hover:bg-blue-700 hover:shadow-md hover:scale-105 transition"
          >
            <Save size={16} className="text-white" />
            <span>Guardar</span>
          </button>
        </div>
      </div>

      {/* 🔸 Cuerpo del formulario */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Cliente con autocompletado */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Cliente</label>
          <div style={{ position: 'relative' }} ref={suggestionsRef}>
<input
  id="inputCliente"
  value={form.clientName}
  onChange={(e) => onClientNameChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 outline-none transition dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
              placeholder="Nombre del cliente"
              autoComplete="off"
            />
            {clientSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 bg-white dark:bg-slate-800 border mt-1 rounded-lg shadow z-50 max-h-48 overflow-auto">
                {clientSuggestions.map((c) => (
                  <div
                    key={c.id}
                    className="px-3 py-2 hover:bg-blue-50 dark:bg-slate-800/70 cursor-pointer transition"
                    onClick={() => {
                      setForm(f => ({
                        ...f,
                        clientId: c.id,
                        clientName: c.name,
                        address: c.address,
                        phone: c.phone
                      }));
                      setClientSuggestions([]);
                    }}
                  >
                    <div className="font-medium text-gray-800 dark:text-gray-100">{c.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{c.address} • {c.phone}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={addClientQuick}
            className="mt-2 w-full md:w-auto flex items-center justify-center gap-1 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-full shadow-sm hover:bg-green-700 hover:shadow-md hover:scale-105 transition"
          >
            <UserPlus size={16} className="text-white" />
            <span>Crear cliente</span>
          </button>
        </div>

        {/* Dirección */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Dirección</label>
          <input
            value={form.address}
            onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
            placeholder="Dirección"
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 outline-none transition dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
          />
        </div>

        {/* Teléfono */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Teléfono</label>
          <input
            value={form.phone}
            onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="Teléfono"
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 outline-none transition dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
          />
        </div>

        {/* Tipo de equipo */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Tipo de equipo</label>
          <input
            value={form.type}
            onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
            placeholder="Ej: Impresora chorro de tinta"
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 outline-none transition dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
          />
        </div>

        {/* Marca */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Marca</label>
          <input
            value={form.brand}
            onChange={(e) => setForm(f => ({ ...f, brand: e.target.value }))}
            placeholder="Marca"
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 outline-none transition dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
          />
        </div>

        {/* Modelo */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Modelo</label>
          <input
            value={form.model}
            onChange={(e) => setForm(f => ({ ...f, model: e.target.value }))}
            placeholder="Modelo"
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 outline-none transition dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
          />
        </div>

        {/* Descripción */}
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Descripción del problema</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
            rows={3}
            placeholder="Describa el problema o la tarea a realizar..."
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 outline-none transition resize-none"
          />
        </div>

        {/* Fecha y hora */}
        <div className="md:col-span-2 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Fecha</label>
            <input
              type="date"
              value={form.datetime ? form.datetime.split("T")[0] : ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  datetime: e.target.value
                    ? `${e.target.value}T${(f.datetime || "00:00").split("T")[1] || "00:00"}`
                    : "",
                }))
              }
              className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 outline-none transition dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
            />
          </div>
<div className="w-full sm:w-40">
  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
    Hora
  </label>
  <input
    type="text"
    placeholder="Ej: 14:30"
    value={
      form.datetime && form.datetime.includes("T")
        ? form.datetime.split("T")[1].slice(0, 5)
        : ""
    }
    onChange={(e) => {
      // permitir escribir libremente (solo limpiamos caracteres raros)
      const raw = e.target.value.replace(/[^\d:.,]/g, "").slice(0, 5);
      const datePart = form.datetime ? form.datetime.split("T")[0] : "";
      setForm((f) => ({
        ...f,
        datetime: datePart
          ? `${datePart}T${raw}`
          : raw
          ? `0000-01-01T${raw}`
          : "",
      }));
    }}
    onBlur={() => {
      const cur =
        form.datetime && form.datetime.includes("T")
          ? form.datetime.split("T")[1].slice(0, 5)
          : "";
      const normalized = normalizeTime(cur);
      const datePart = form.datetime ? form.datetime.split("T")[0] : "";
      if (normalized) {
        setForm((f) => ({
          ...f,
          datetime: datePart
            ? `${datePart}T${normalized}`
            : `0000-01-01T${normalized}`,
        }));
      } else {
        // si la hora es inválida, se limpia
        setForm((f) => ({
          ...f,
          datetime: datePart ? `${datePart}T` : "",
        }));
      }
    }}
    className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 outline-none transition dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
  />
</div>

        </div>

        {/* Estado y Técnico */}
        <div className="md:col-span-2 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Estado</label>
            <select
              value={form.status || "pendiente"}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 outline-none transition dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
            >
              <option value="pendiente">Pendiente</option>
              <option value="finalizado">Finalizado</option>
              <option value="en curso">En curso</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Técnico</label>
            <select
              value={form.tech}
              onChange={(e) => setForm((f) => ({ ...f, tech: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 outline-none transition dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
            >
              {TECHS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

{/* 🟢 Modal Enviar WhatsApp */}
{showWhatsappModal && (
  <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50">
    <div className="bg-white dark:bg-slate-800 dark:bg-slate-800 w-full max-w-sm rounded shadow-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">
          Enviar WhatsApp</h2>
        <button
          onClick={() => setShowWhatsappModal(false)}
          className="w-8 h-8 flex items-center justify-center rounded-full shadow-sm hover:bg-gray-100 dark:bg-slate-900/90 hover:scale-105 hover:shadow-md transition transform">
          ✖
        </button>
      </div>
      <div className="space-y-3">
        <label className="block text-sm text-gray-600 dark:text-gray-400">
          Ingresá el número (sin 0 ni +598)
        </label>
       <input
  type="text"
  value={whatsappNumber}
  onChange={(e) => setWhatsappNumber(e.target.value.replace(/[^0-9]/g, ''))}
  placeholder="Ej: 91234567"
  className="border rounded w-full px-3 py-2"
  onKeyDown={(e) => {
    if (e.key === 'Enter') {
      if (!whatsappNumber) return alert('Ingresá un número');
      const url = `https://wa.me/598${whatsappNumber}`;
      window.open(url, '_blank');
      setShowWhatsappModal(false);
      setWhatsappNumber('');
    }
  }}
/>
        <button
          onClick={() => {
            if (!whatsappNumber) return alert('Ingresá un número');
            const url = `https://wa.me/598${whatsappNumber}`;
            window.open(url, '_blank');
            setShowWhatsappModal(false);
            setWhatsappNumber('');
          }}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded shadow">
          Abrir chat en WhatsApp
        </button>
      </div>
    </div>
  </div>
)}
      {/* Modal Nuevo Cliente */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 dark:bg-slate-800 w-full max-w-md rounded shadow-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Nuevo cliente</h2>
              <div className="flex gap-2">
                <button onClick={() => setShowClientModal(false)} className="px-3 py-1 border rounded">Cerrar</button>
                <button onClick={saveNewClient} className="px-3 py-1 bg-green-600 text-white rounded">Guardar</button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Nombre</label>
                <input value={newClient.name} onChange={(e) => setNewClient(n => ({...n, name: e.target.value }))} className="w-full border rounded px-2 py-1" placeholder="Nombre del cliente" />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Dirección</label>
                <input value={newClient.address} onChange={(e) => setNewClient(n => ({...n, address: e.target.value }))} className="w-full border rounded px-2 py-1" placeholder="Dirección" />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Teléfono</label>
                <input value={newClient.phone} onChange={(e) => setNewClient(n => ({...n, phone: e.target.value }))} className="w-full border rounded px-2 py-1" placeholder="Teléfono" />
              </div>
            </div>
          </div>
        </div>
      )}
      
{/* 🧾 Modal Servicios Anteriores */}
{showClientServicesModal && (
  <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50">
    <div className="bg-white dark:bg-slate-800 dark:bg-slate-800 w-full max-w-2xl rounded shadow-lg p-4">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Servicios anteriores</h2>
        <button
          onClick={() => setShowClientServicesModal(false)}
          className="px-3 py-1 rounded-full hover:bg-gray-100 dark:bg-slate-900/90 transition"
        >
          ✖
        </button>
      </div>
      {/* Contenido */}
      {selectedClientServices.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-4">
          Este cliente no tiene servicios registrados.
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-auto">
          {selectedClientServices.map((s) => (
            <div
              key={s.id}
onClick={() => {
  setShowClientServicesModal(false);
  setView("agenda");
  setSelectedDate(new Date(s.datetime));

  // 🟢 Marcar servicio seleccionado para resaltarlo
  setHighlightServiceId(s.id);

  // 🕓 Quitar resaltado automáticamente después de 4 segundos
  setTimeout(() => setHighlightServiceId(null), 4000);
}}
              className="border rounded p-3 shadow-sm bg-gray-50 dark:bg-slate-900 hover:bg-blue-100 cursor-pointer transition">
              <div className="font-medium text-gray-800 dark:text-gray-100">
                {new Date(s.datetime).toLocaleDateString("es-UY")} •{" "}
                {new Date(s.datetime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                {s.description || "(Sin descripción)"}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Estado: <strong>{s.status}</strong> • Técnico:{" "}
                {TECHS.find((t) => t.id === s.tech)?.name || "-"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
)}
 {/* 🦶 Pie de página */}
  <footer className="w-full text-center text-gray-600 dark:text-gray-400 text-xs sm:text-sm bg-transparent">

  </footer>
</div> 
    </div>

); // 👈 este cierra el return
} // 👈 este cierra el componente
