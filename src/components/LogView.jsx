import { useState } from "react";
import { TANKS, SHIFTS, WEATHER_OPTIONS, EVENT_TYPES } from "../constants.js";
import { colors, inputStyle, selectStyle } from "../styles/theme.js";
import { Section, Label, Input, Icons } from "./ui.jsx";
import PhotoAttachment from "./PhotoAttachment.jsx";

const SENDAI = { latitude: 38.2682, longitude: 140.8694 };

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

async function fetchWeather() {
  try {
    const location = await getWeatherLocation();
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(location.latitude));
    url.searchParams.set("longitude", String(location.longitude));
    url.searchParams.set("current", "temperature_2m,weather_code");
    url.searchParams.set("daily", "temperature_2m_max");
    url.searchParams.set("timezone", "auto");
    url.searchParams.set("forecast_days", "1");

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Weather API returned ${res.status}`);

    const data = await res.json();
    const currentTemp = data.current?.temperature_2m;
    const highTemp = data.daily?.temperature_2m_max?.[0];
    if (!Number.isFinite(currentTemp) || !Number.isFinite(highTemp)) {
      throw new Error("Weather API returned incomplete data");
    }

    const code = data.current?.weather_code ?? 0;
    let weather = "Sunny";
    if (code >= 95) weather = "Storm";
    else if (code >= 51 && code <= 82) weather = "Rain";
    else if (code >= 45) weather = "Cloudy";
    else if (code >= 1) weather = "Cloudy";

    return {
      current: Math.round(currentTemp),
      high: Math.round(highTemp),
      weather,
      locationSource: location.source,
    };
  } catch (err) {
    console.error("Weather fetch failed:", err);
    return null;
  }
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
    const data = await fetchWeather();
    if (data) {
      setCurrent((c) => ({
        ...c,
        outdoor: {
          tempMorning: String(data.current),
          tempHigh: String(data.high),
          source: data.locationSource,
        },
        weather: data.weather,
      }));
      setWeatherStatus(
        data.locationSource === "current-location"
          ? "📍 Current location"
          : "📍 Sendai fallback"
      );
    } else {
      setWeatherStatus("Weather fetch failed");
    }
    setWeatherLoading(false);
  };

  const toggleEvent = (eventId) => {
    setCurrent((c) => ({
      ...c,
      events: c.events.includes(eventId)
        ? c.events.filter((e) => e !== eventId)
        : [...c.events, eventId],
    }));
  };

  const setTemp = (period, field, value) => {
    setCurrent((c) => ({
      ...c,
      temperatures: {
        ...c.temperatures,
        [period]: { ...c.temperatures[period], [field]: value },
      },
    }));
  };

  const setWQ = (field, value) => {
    setCurrent((c) => ({
      ...c,
      waterQuality: { ...c.waterQuality, [field]: value },
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Date & Tank */}
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

      {/* Water Temperature + Room Temp */}
      <Section title="Temperature Readings" icon={Icons.thermometer}>
        {["morning", "noon", "night"].map((period) => (
          <div key={period} style={{ marginBottom: period !== "night" ? "10px" : 0 }}>
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
                  value={current.temperatures[period].waterTemp}
                  onChange={(e) => setTemp(period, "waterTemp", e.target.value)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Label>Room °C</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="°C"
                  value={current.temperatures[period].roomTemp}
                  onChange={(e) => setTemp(period, "roomTemp", e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </Section>

      {/* Outdoor / Weather */}
      <Section title="Outdoor Conditions" icon={Icons.sun}>
        <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
          <div style={{ flex: 1 }}>
            <Label>Morning °C</Label>
            <Input
              type="number"
              placeholder="°C"
              value={current.outdoor.tempMorning}
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
              placeholder="°C"
              value={current.outdoor.tempHigh}
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

      {/* Shift */}
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

      {/* Events */}
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

      {/* Water Tests */}
      {current.events.includes("test") && (
        <Section title="Water Test Results" icon="🧪">
          <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <div style={{ flex: 1 }}>
              <Label>Ammonia (ppm)</Label>
              <Input
                type="number"
                step="0.25"
                placeholder="0"
                value={current.waterQuality.ammonia}
                onChange={(e) => setWQ("ammonia", e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Label>Nitrite (mg/l)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="0"
                value={current.waterQuality.nitrite}
                onChange={(e) => setWQ("nitrite", e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <div style={{ flex: 1 }}>
              <Label>GH (°dH)</Label>
              <Input
                type="number"
                step="1"
                placeholder="0"
                value={current.waterQuality.gh}
                onChange={(e) => setWQ("gh", e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Label>KH (°dH)</Label>
              <Input
                type="number"
                step="1"
                placeholder="0"
                value={current.waterQuality.kh}
                onChange={(e) => setWQ("kh", e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Label>TDS (ppm)</Label>
              <Input
                type="number"
                step="1"
                placeholder="0"
                value={current.waterQuality.tds}
                onChange={(e) => setWQ("tds", e.target.value)}
              />
            </div>
          </div>
        </Section>
      )}

      {/* Notes */}
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

      {/* Photos */}
      <Section title="Photos" icon={Icons.camera}>
        <PhotoAttachment
          photoIds={current.photoIds || []}
          onChange={(ids) => setCurrent((c) => ({ ...c, photoIds: ids }))}
        />
      </Section>

      {/* Save Button */}
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
