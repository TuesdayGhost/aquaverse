import { supabase } from "./supabase.js";

const WATER_FIELDS = ["ammonia", "nitrite", "nitrate", "ph", "gh", "kh", "tds"];

function legacyWaterTest(entry) {
  const raw = entry?.waterQuality || {};
  if (Array.isArray(raw.tests)) return null;
  const hasValue = WATER_FIELDS.some((field) => raw[field] !== "" && raw[field] != null);
  if (!hasValue) return null;

  return {
    id: `${entry.id || "legacy"}-water-test`,
    tankId: entry.tankId || "republic",
    ammonia: raw.ammonia ?? "",
    nitrite: raw.nitrite ?? "",
    nitrate: raw.nitrate ?? "",
    ph: raw.ph ?? "",
    gh: raw.gh ?? "",
    kh: raw.kh ?? "",
    tds: raw.tds ?? "",
  };
}

function normalizeWaterTests(entry) {
  if (Array.isArray(entry?.waterTests)) {
    return entry.waterTests.map((test, index) => ({
      id: test.id || `${entry.id || "entry"}-water-test-${index}`,
      tankId: test.tankId || entry.tankId || "republic",
      ammonia: test.ammonia ?? "",
      nitrite: test.nitrite ?? "",
      nitrate: test.nitrate ?? "",
      ph: test.ph ?? "",
      gh: test.gh ?? "",
      kh: test.kh ?? "",
      tds: test.tds ?? "",
    }));
  }

  if (Array.isArray(entry?.waterQuality?.tests)) {
    return normalizeWaterTests({ ...entry, waterTests: entry.waterQuality.tests });
  }

  const legacy = legacyWaterTest(entry);
  return legacy ? [legacy] : [];
}

function normalizeTemperatures(temperatures = {}) {
  return {
    morning: temperatures.morning || { waterTemp: "", roomTemp: "" },
    noon: temperatures.noon || { waterTemp: "", roomTemp: "" },
    night: temperatures.night || { waterTemp: "", roomTemp: "" },
    control: {
      airConditionerSetpoint: temperatures.control?.airConditionerSetpoint ?? "",
      heaterSetpoint: temperatures.control?.heaterSetpoint ?? "",
      source: temperatures.control?.source || "manual",
    },
  };
}

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
    version: Math.max(entry.version || 1, 2),
    date: entry.date,
    tank_id: entry.tankId,
    temperatures: normalizeTemperatures(entry.temperatures),
    outdoor: entry.outdoor || {},
    weather: entry.weather || "",
    shift: entry.shift || "",
    events: entry.events || [],
    water_quality: { tests: normalizeWaterTests(entry) },
    photo_ids: entry.photoIds || [],
    notes: entry.notes || "",
    source: entry.source || "manual",
    timestamp: entry.timestamp || new Date().toISOString(),
  };
}

function fromRow(row) {
  const base = {
    id: row.id,
    version: row.version,
    date: row.date,
    tankId: row.tank_id,
    temperatures: normalizeTemperatures(row.temperatures),
    outdoor: row.outdoor || {},
    weather: row.weather,
    shift: row.shift,
    events: row.events || [],
    waterQuality: row.water_quality || {},
    photoIds: row.photo_ids || [],
    notes: row.notes,
    source: row.source,
    timestamp: row.timestamp,
  };

  return {
    ...base,
    version: Math.max(base.version || 1, 2),
    waterTests: normalizeWaterTests(base),
  };
}
