// Simple localStorage-backed persistence for the day counter.
// Each item: { id, name, startDate (YYYY-MM-DD), createdAt }

const STORAGE_KEY = "day-counter-items";

export function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const items = JSON.parse(raw);
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export function saveItems(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage full or unavailable — fail silently.
  }
}
