// Conexión con Supabase y funciones para leer / guardar datos
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Supabase devuelve como máximo 1000 filas por consulta: se pide por páginas
const PAGE = 1000;

export const fetchAll = async (table, orderCol) => {
  const all = [];
  try {
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order(orderCol, { ascending: true })
        .order("id", { ascending: true })
        .range(from, from + PAGE - 1);
      if (error) {
        console.error(`Error cargando ${table}:`, error);
        break;
      }
      all.push(...(data || []));
      if (!data || data.length < PAGE) break;
    }
  } catch (e) {
    console.error(e);
  }
  return all;
};

export const insertRow = async (table, row) => {
  try {
    const { data, error } = await supabase.from(table).insert([row]).select();
    if (error) {
      console.error(`Error creando en ${table}:`, error);
      return null;
    }
    return data?.[0] ?? null;
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const insertMany = async (table, rows) => {
  try {
    const { data, error } = await supabase.from(table).insert(rows).select();
    if (error) {
      console.error(`Error creando varios en ${table}:`, error);
      return null;
    }
    return data || [];
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const updateRow = async (table, id, changes) => {
  try {
    const { data, error } = await supabase
      .from(table)
      .update(changes)
      .eq("id", id)
      .select();
    if (error) {
      console.error(`Error actualizando en ${table}:`, error);
      return null;
    }
    return data?.[0] ?? null;
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const deleteRow = async (table, id) => {
  try {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      console.error(`Error borrando en ${table}:`, error);
      return false;
    }
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

// Borra los servicios de un programado que son posteriores al día indicado (YYYY-MM-DD, hora local)
export const deleteServiciosFuturosDB = async (programadoId, hoyISO) => {
  try {
    const { error } = await supabase
      .from("services")
      .delete()
      .eq("programado_id", programadoId)
      .gt("datetime", `${hoyISO}T23:59:59`);
    if (error) {
      console.error("Error borrando servicios futuros:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};
