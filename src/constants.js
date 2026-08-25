export const TANKS = [
  {
    id: "republic",
    name: "Republic",
    description: "23cm sphere tank",
    inhabitants: "Neocaridina denticulata × 6 + babies",
    emoji: "🫧",
  },
  {
    id: "nursery",
    name: "Nursery",
    description: "Tetra 30cm tank w/ filter",
    inhabitants: "Aquatic plants only",
    emoji: "🌿",
  },
];

export const SHIFTS = ["A", "B", "C", "Day Off"];

export const WEATHER_OPTIONS = [
  { label: "Sunny", icon: "☀️" },
  { label: "Cloudy", icon: "☁️" },
  { label: "Rain", icon: "🌧️" },
  { label: "Cloudy→Sunny", icon: "⛅" },
  { label: "Storm", icon: "⛈️" },
];

export const EVENT_TYPES = [
  { id: "feed", label: "Fed", emoji: "🦐", color: "#FF6B35" },
  { id: "water_change", label: "Water Change", emoji: "💧", color: "#2196F3" },
  { id: "fertilizer", label: "Fertilizer", emoji: "🌿", color: "#4CAF50" },
  { id: "trim", label: "Trimmed", emoji: "✂️", color: "#9C27B0" },
  { id: "heater", label: "Heater On", emoji: "🔥", color: "#FF5722" },
  { id: "test", label: "Water Test", emoji: "🧪", color: "#00BCD4" },
  { id: "molt", label: "Molt Found", emoji: "🦴", color: "#795548" },
];

export function getJstDateISO(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export const DEFAULT_ENTRY = () => ({
  id: crypto.randomUUID(),
  version: 1,
  date: getJstDateISO(),
  tankId: "republic",
  temperatures: {
    morning: { waterTemp: "", roomTemp: "" },
    noon: { waterTemp: "", roomTemp: "" },
    night: { waterTemp: "", roomTemp: "" },
  },
  outdoor: { tempMorning: "", tempHigh: "", source: "manual" },
  weather: "",
  shift: "",
  events: [],
  waterQuality: {
    ammonia: "",
    nitrite: "",
    gh: "",
    kh: "",
    tds: "",
  },
  photoIds: [],
  notes: "",
  source: "manual",
});
