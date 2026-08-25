import { useState } from "react";
import {
  TANKS,
  SHIFTS,
  WEATHER_OPTIONS,
  EVENT_TYPES,
  WATER_TEST_FIELDS,
  createWaterTest,
  getJstDateISO,
} from "../constants.js";
import { colors, inputStyle, selectStyle } from "../styles/theme.js";
import { Section, Label, Input, Icons } from "./ui.jsx";
import PhotoAttachment from "./PhotoAttachment.jsx";

const SENDAI = { latitude: 38.2682, longitude: 140.8694 };
const DAY_MS = 24 * 60 * 60 * 1000;

function getWeatherLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ ...SENDAI, source: "sendai-fallback" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          source: "current-location",
        }),
      () => resolve({ ...SENDAI, source: "sendai-fallback" }),
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 30 * 60 * 1000,
      }
    );
  });
}

function weatherLabel(code = 0) {
  if (code >= 95) return "Storm";
  if ((code >= 51 && code <= 82) || (code >= 85 && code <= 86)) return "Rain";
  if (code >= 1) return "Cloudy";
  return "Sunny";
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function dayDifferenceFromToday(date) {
  const target = Date.parse(`${date}T00:00:00+09:00`);
  const today = Date.parse(`${getJstDateISO()}T00:00:00+09:00`);
  return Math.round((target - today) / DAY_MS);
}

async function fetchWeather(date) {
  try {
    const location = await getWeatherLocation();
    const diff = dayDifferenceFromToday(date);
    const recentOrForecast = diff >= -7 && diff <= 15;
    const endpoint = recentOrForecast
      ? "https://api.open-meteo.com/v1/forecast"
      : "https://archive-api.open-meteo.com/v1/archive";
    const url = new URL(endpoint);

    url.searchParams.set("latitude", String(location.latitude));
    url.searchParams.set("longitude", String(location.longitude));
    url.searchParams.set("hourly", "temperature_2m");
    url.searchParams.set("daily", "temperature_2m_max,weather_code");
    url.searchParams.set("timezone", "Asia/Tokyo");

    if (recentOrForecast) {
      url.searchParams.set("past_days", "7");
      url.searchParams.set("forecast_days", "16");
    } else if (diff < -7) {
      url.searchParams.set("start_date", date);
      url.searchParams.set("end_date", date);
    } else {
      throw new Error("Selected date is outside the available forecast range");
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Weather API returned ${res.status}`);

    const data = await res.json();
    const hourIndex = data.hourly?.time?.findIndex((time) => time === `${date}T06:00`) ?? -1;
    const dayIndex = data.daily?.time?.findIndex((day) => day === date) ?? -1;
    const morningTemp = hourIndex >= 0 ? data.hourly?.temperature_2m?.[hourIndex] : null;
    const highTemp = dayIndex >= 0 ? data.daily?.temperature_2m_max?.[dayIndex] : null;
    const code = dayIndex >= 0 ? data.daily?.weather_code?.[dayIndex] : 0;

    if (!Number.isFinite(morningTemp) || !Number.isFinite(highTemp)) {
      throw new Error("Weather API returned incomplete data for the selected date");
    }

    return {
      morning: round1(morningTemp),
      high: round1(highTemp),
      weather: weatherLabel(code),
      locationSource: location.source,
    };
  } catch (err) {
    console.error("Weather fetch failed:", err);
    return null;
  }
}

function legacyWaterTests(entry) {
  if (Array.isArray(entry.waterTests)) return entry.waterTests;
  const raw = entry.waterQuality || {};
  const hasValue = WATER_TEST_FIELDS.some((field) => raw[field.id] !== "" && raw[field.id] != null);
  if (!hasValue) return [];
  return [
    {
      id: `${entry.id}-legacy-water-test`,
      tankId: entry.tankId,
      ...Object.fromEntries(WATER_TEST_FIELDS.map((field) => [field.id, raw[field.id] ?? ""])),
    },
  ];
}

export default function LogView({ current, setCurrent, onSave, editIndex }) {
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherStatus, setWeatherStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const handleFetchWeather = async () => {
    setWeatherLoading(true);
    setWeatherStatus(null);
    const data = await fetchWeather(current.date);
    if (data) {
      setCurrent((c) => ({
        ...c,
        outdoor: {
          tempMorning: String(data.morning),
          tempHigh: String(data.high),
          source: data.locationSource,
        },
        weather: data.weather,
      }));
      const locationText =
        data.locationSource === "current-location" ? "Current location" : "Sendai fallback";
      setWeatherStatus(`📍 ${locationText} · ${current.date} 06:00`);
    } else {
      setWeatherStatus("Weather fetch failed");
    }
    setWeatherLoading(false);
  };

  const toggleEvent = (eventId) => {
    setCurrent((c) => {
      const active = c.events.includes(eventId);
      const next = {
        ...c,
        events: active ? c.events.filter((e) => e !== eventId) : [...c.events, eventId],
      };
      if (eventId === "test" && !active && legacyWaterTests(c).length === 0) {
        next.waterTests = [createWaterTest(c.tankId)];
      }
      return next;
    });
  };

  const setTemp = (period, field, value) => {
    setCurrent((c) => ({
      ...c,
      temperatures: {
        ...c.temperatures,
        [period]: { ...(c.temperatures?.[period] || {}), [field]: value },
      },
    }));
  };

  const setControl = (field, value) => {
    setCurrent((c) => ({
      ...c,
      temperatures: {
        ...c.temperatures,
        control: {
          ...(c.temperatures?.control || {}),
          [field]: value,
          source: "manual",
        },
      },
    }));
  };

  const addWaterTest = () => {
    setCurrent((c) => ({
      ...c,
      waterTests: [...legacyWaterTests(c), createWaterTest(c.tankId)],
    }));
  };

  const updateWaterTest = (id, field, value) => {
    setCurrent((c) => ({
      ...c,
      waterTests: legacyWaterTests(c).map((test) =>
        test.id === id ? { ...test, [field]: value } : test
      ),
    }));
  };

  const removeWaterTest = (id) => {
    setCurrent((c) => ({
      ...c,
      waterTests: legacyWaterTests(c).filter((test) => test.id !== id),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveFailed(false);
    try {
      await onSave();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setSaveFailed(true);
    } finally {
      setSaving(false);
    }
  };

  const tank = TANKS.find((t) => t.id === current.tankId);
  const waterTests = legacyWaterTests(current);
  const control = current.temperatures?.control || {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", gap: "8px" }}>
        <div style={{ flex: 1 }}>
          <Label>Date</Label>
          <Input
            type="date"
            value={current.date}
            onChange={(e) => setCurrent((c) => ({ ...c, date: e.target.value }))}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Label>Tank</Label>
          <select
            value={current.tankId}
            onChange={(e) => setCurrent((c) => ({ ...c, tankId: e.target.value }))}
            style={selectStyle}
          >
            {TANKS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.emoji} {t.name}
              </option>
            ))}
          </select>
          {tank && (
            <div style={{ fontSize: "9px", color: colors.muted, marginTop: "3px" }}>
              {tank.description} — {tank.inhabitants}
            </div>
          )}
        </div>
      </div>

      <Section title="Temperature Readings" icon={Icons.thermometer}>
        {["morning", "noon", "night"].map((period) => {
          const reading = current.temperatures?.[period] || {};
          return (
            <div key={period} style={{ marginBottom: "10px" }}>
              <div
                style={{
                  fontSize: "10px",
                  color: colors.primary,
                  marginBottom: "4px",
                  opacity: 0.8,
                }}
              >
                {period === "morning" ? "🌅 Morning" : period === "noon" ? "☀️ Noon" : "🌙 Night"}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ flex: 1 }}>
                  <Label>Water °C</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="°C"
                    value={reading.waterTemp || ""}
                    onChange={(e) => setTemp(period, "waterTemp", e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Label>Room °C</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="°C"
                    value={reading.roomTemp || ""}
                    onChange={(e) => setTemp(period, "roomTemp", e.target.value)}
                  />
                </div>
              </div>
            </div>
          );
        })}

        <div
          style={{
            borderTop: `1px solid ${colors.subtleBorder}`,
            paddingTop: "10px",
            marginTop: "2px",
          }}
        >
          <div style={{ fontSize: "10px", color: colors.primary, marginBottom: "6px", opacity: 0.8 }}>
            ⚙ Temperature Control Settings
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <div style={{ flex: 1 }}>
              <Label>A/C Set °C</Label>
              <Input
                type="number"
                step="0.5"
                placeholder="unused"
                value={control.airConditionerSetpoint || ""}
                onChange={(e) => setControl("airConditionerSetpoint", e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Label>Heater Set °C</Label>
              <Input
                type="number"
                step="0.5"
                placeholder="unused"
                value={control.heaterSetpoint || ""}
                onChange={(e) => setControl("heaterSetpoint", e.target.value)}
              />
            </div>
          </div>
        </div>
      </Section>

      <Section title="Outdoor Conditions" icon={Icons.sun}>
        <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
          <div style={{ flex: 1 }}>
            <Label>Morning 06:00 °C</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="°C"
              value={current.outdoor?.tempMorning || ""}
              onChange={(e) =>
                setCurrent((c) => ({
                  ...c,
                  outdoor: { ...c.outdoor, tempMorning: e.target.value, source: "manual" },
                }))
              }
            />
          </div>
          <div style={{ flex: 1 }}>
            <Label>High °C</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="°C"
              value={current.outdoor?.tempHigh || ""}
              onChange={(e) =>
                setCurrent((c) => ({
                  ...c,
                  outdoor: { ...c.outdoor, tempHigh: e.target.value, source: "manual" },
                }))
              }
            />
          </div>
          <div style={{ flex: 0, display: "flex", alignItems: "flex-end" }}>
            <button
              onClick={handleFetchWeather}
              disabled={weatherLoading}
              style={{
                padding: "8px 12px",
                background: "rgba(33,150,243,0.15)",
                border: "1px solid rgba(33,150,243,0.3)",
                color: "#64b5f6",
                fontSize: "10px",
                borderRadius: "4px",
                cursor: weatherLoading ? "wait" : "pointer",
                whiteSpace: "nowrap",
                letterSpacing: "1px",
                opacity: weatherLoading ? 0.6 : 1,
              }}
            >
              {weatherLoading ? "..." : "AUTO"}
            </button>
          </div>
        </div>

        {weatherStatus && (
          <div
            style={{
              fontSize: "9px",
              color: weatherStatus.includes("failed") ? colors.danger : colors.muted,
              marginBottom: "8px",
            }}
          >
            {weatherStatus}
          </div>
        )}

        <Label>Weather</Label>
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          {WEATHER_OPTIONS.map((w) => (
            <button
              key={w.label}
              onClick={() => setCurrent((c) => ({ ...c, weather: w.label }))}
              style={{
                padding: "6px 10px",
                background: current.weather === w.label ? colors.activeBg : colors.subtleBg,
                border: "1px solid",
                borderColor:
                  current.weather === w.label ? colors.activeBorder : colors.subtleBorder,
                borderRadius: "4px",
                color: current.weather === w.label ? colors.primary : colors.muted,
                fontSize: "12px",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {w.icon} {w.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Shift Schedule">
        <div style={{ display: "flex", gap: "4px" }}>
          {SHIFTS.map((s) => (
            <button
              key={s}
              onClick={() => setCurrent((c) => ({ ...c, shift: s }))}
              style={{
                flex: 1,
                padding: "8px 0",
                background:
                  current.shift === s
                    ? s === "Day Off"
                      ? "rgba(255,183,77,0.15)"
                      : colors.activeBg
                    : colors.subtleBg,
                border: "1px solid",
                borderColor:
                  current.shift === s
                    ? s === "Day Off"
                      ? "rgba(255,183,77,0.3)"
                      : colors.activeBorder
                    : colors.subtleBorder,
                borderRadius: "4px",
                color:
                  current.shift === s
                    ? s === "Day Off"
                      ? colors.accent
                      : colors.primary
                    : colors.muted,
                fontSize: "12px",
                fontWeight: current.shift === s ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Today's Events">
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          {EVENT_TYPES.map((ev) => {
            const active = current.events.includes(ev.id);
            return (
              <button
                key={ev.id}
                onClick={() => toggleEvent(ev.id)}
                style={{
                  padding: "8px 12px",
                  background: active ? `${ev.color}22` : colors.subtleBg,
                  border: "1px solid",
                  borderColor: active ? `${ev.color}66` : colors.subtleBorder,
                  borderRadius: "4px",
                  color: active ? ev.color : colors.muted,
                  fontSize: "11px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {ev.emoji} {ev.label}
              </button>
            );
          })}
        </div>
      </Section>

      {current.events.includes("test") && (
        <Section title="Water Test Results" icon="🧪">
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {waterTests.map((test, index) => (
              <div
                key={test.id}
                style={{
                  padding: "10px",
                  border: `1px solid ${colors.subtleBorder}`,
                  borderRadius: "5px",
                  background: colors.subtleBg,
                }}
              >
                <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", marginBottom: "8px" }}>
                  <div style={{ flex: 1 }}>
                    <Label>Tank #{index + 1}</Label>
                    <select
                      value={test.tankId || current.tankId}
                      onChange={(e) => updateWaterTest(test.id, "tankId", e.target.value)}
                      style={selectStyle}
                    >
                      {TANKS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.emoji} {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => removeWaterTest(test.id)}
                    style={{
                      padding: "8px 10px",
                      background: colors.dangerBg,
                      border: `1px solid ${colors.dangerBorder}`,
                      color: colors.danger,
                      borderRadius: "4px",
                      fontSize: "10px",
                      cursor: "pointer",
                    }}
                  >
                    REMOVE
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {WATER_TEST_FIELDS.map((field) => (
                    <div key={field.id}>
                      <Label>
                        {field.label}{field.unit ? ` (${field.unit})` : ""}
                      </Label>
                      <Input
                        type="number"
                        step={field.step}
                        placeholder="—"
                        value={test[field.id] ?? ""}
                        onChange={(e) => updateWaterTest(test.id, field.id, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={addWaterTest}
              style={{
                padding: "9px",
                background: colors.activeBg,
                border: `1px solid ${colors.activeBorder}`,
                color: colors.primary,
                borderRadius: "4px",
                fontSize: "10px",
                letterSpacing: "1px",
                cursor: "pointer",
              }}
            >
              + ADD TANK TEST
            </button>
          </div>
        </Section>
      )}

      <Section title="Field Notes" icon={Icons.edit}>
        <textarea
          placeholder="Mama shrimp grazing on Vallisneria... spotted a molt shell near the driftwood..."
          value={current.notes}
          onChange={(e) => setCurrent((c) => ({ ...c, notes: e.target.value }))}
          style={{
            ...inputStyle,
            height: "80px",
            resize: "vertical",
            fontFamily: "inherit",
            lineHeight: 1.5,
          }}
        />
      </Section>

      <Section title="Photos" icon={Icons.camera}>
        <PhotoAttachment
          photoIds={current.photoIds || []}
          onChange={(ids) => setCurrent((c) => ({ ...c, photoIds: ids }))}
        />
      </Section>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          padding: "14px",
          background: saveFailed
            ? colors.dangerBg
            : saved
              ? "rgba(76,175,80,0.3)"
              : "linear-gradient(135deg, rgba(100,180,140,0.25), rgba(33,150,100,0.2))",
          border: "1px solid",
          borderColor: saveFailed
            ? colors.dangerBorder
            : saved
              ? "rgba(76,175,80,0.5)"
              : colors.activeBorder,
          borderRadius: "6px",
          color: saveFailed ? colors.danger : saved ? "#81c784" : colors.primary,
          fontSize: "13px",
          fontWeight: 600,
          letterSpacing: "3px",
          cursor: saving ? "wait" : "pointer",
          textTransform: "uppercase",
          transition: "all 0.3s",
          fontFamily: "inherit",
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving
          ? "SAVING..."
          : saveFailed
            ? "SAVE FAILED — RETRY"
            : saved
              ? "✓ LOGGED"
              : editIndex !== null
                ? "UPDATE ENTRY"
                : "LOG ENTRY"}
      </button>
    </div>
  );
}
