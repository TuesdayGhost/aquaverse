import { supabase } from "./supabase.js";

// --- Entries ---

export async function loadEntries() {
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .order("date", { ascending: true });
  if (error) throw error;
  return (data || []).map(fromRow);
}

export async function saveEntry(entry) {
  const { error } = await supabase.from("entries").upsert(toRow(entry));
  if (error) throw error;
}

export async function deleteEntryById(id) {
  const { error } = await supabase.from("entries").delete().eq("id", id);
  if (error) throw error;
}

export async function clearAllEntries() {
  const { error } = await supabase.from("entries").delete().not("id", "is", null);
  if (error) throw error;
}

// --- Photos (Supabase Storage) ---

export async function savePhoto(id, blob) {
  const { error } = await supabase.storage
    .from("photos")
    .upload(`${id}.jpg`, blob, { contentType: "image/jpeg", upsert: true });
  if (error) throw error;
}

export function getPhotoUrl(id) {
  const { data } = supabase.storage.from("photos").getPublicUrl(`${id}.jpg`);
  return data.publicUrl;
}

export async function deletePhoto(id) {
  const { error } = await supabase.storage.from("photos").remove([`${id}.jpg`]);
  if (error) throw error;
}

export async function deletePhotos(ids) {
  if (!ids.length) return;
  const { error } = await supabase.storage
    .from("photos")
    .remove(ids.map((id) => `${id}.jpg`));
  if (error) throw error;
}

// --- Migration from localStorage (one-time) ---

const LEGACY_KEY = "aqua-log-entries";

export async function migrateLocalData() {
  const raw = localStorage.getItem(LEGACY_KEY);
  if (!raw) return 0;
  try {
    const entries = JSON.parse(raw);
    if (!entries.length) {
      localStorage.removeItem(LEGACY_KEY);
      return 0;
    }
    for (const entry of entries) {
      await saveEntry(entry);
    }
    localStorage.removeItem(LEGACY_KEY);
    return entries.length;
  } catch {
    return 0;
  }
}

// --- Row conversion (camelCase <-> snake_case) ---

function toRow(entry) {
  return {
    id: entry.id,
    version: entry.version || 1,
    date: entry.date,
    tank_id: entry.tankId,
    temperatures: entry.temperatures || {},
    outdoor: entry.outdoor || {},
    weather: entry.weather || "",
    shift: entry.shift || "",
    events: entry.events || [],
    water_quality: entry.waterQuality || {},
    photo_ids: entry.photoIds || [],
    notes: entry.notes || "",
    source: entry.source || "manual",
    timestamp: entry.timestamp || new Date().toISOString(),
  };
}

function fromRow(row) {
  return {
    id: row.id,
    version: row.version,
    date: row.date,
    tankId: row.tank_id,
    temperatures: row.temperatures,
    outdoor: row.outdoor,
    weather: row.weather,
    shift: row.shift,
    events: row.events,
    waterQuality: row.water_quality,
    photoIds: row.photo_ids,
    notes: row.notes,
    source: row.source,
    timestamp: row.timestamp,
  };
}
