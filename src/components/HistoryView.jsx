import { useState } from "react";
import { TANKS, WEATHER_OPTIONS, EVENT_TYPES, WATER_TEST_FIELDS } from "../constants.js";
import { colors, miniBtn } from "../styles/theme.js";
import { getPhotoUrl } from "../storage.js";
import ExportImport from "./ExportImport.jsx";

function PhotoThumbs({ photoIds }) {
  const [viewUrl, setViewUrl] = useState(null);

  if (photoIds.length === 0) return null;

  return (
    <>
      <div style={{ marginTop: "8px", display: "flex", gap: "4px", flexWrap: "wrap" }}>
        {photoIds.map((id) => (
          <img
            key={id}
            src={getPhotoUrl(id)}
            alt=""
            onClick={() => setViewUrl(getPhotoUrl(id))}
            style={{
              width: "48px",
              height: "48px",
              objectFit: "cover",
              borderRadius: "3px",
              border: `1px solid ${colors.cardBorder}`,
              cursor: "pointer",
            }}
          />
        ))}
      </div>
      {viewUrl && (
        <div
          onClick={() => setViewUrl(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.9)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            padding: "20px",
          }}
        >
          <img
            src={viewUrl}
            alt=""
            style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: "8px" }}
          />
        </div>
      )}
    </>
  );
}

function waterTestsFor(entry) {
  if (Array.isArray(entry.waterTests)) return entry.waterTests;
  const raw = entry.waterQuality || {};
  if (Array.isArray(raw.tests)) return raw.tests;
  const hasValue = WATER_TEST_FIELDS.some((field) => raw[field.id] !== "" && raw[field.id] != null);
  if (!hasValue) return [];
  return [{ id: `${entry.id}-legacy-water-test`, tankId: entry.tankId, ...raw }];
}

function displayValue(value) {
  return value === "" || value == null ? null : value;
}

export default function HistoryView({
  entries,
  onEdit,
  onDelete,
  onReset,
  onMerge,
  onReplace,
}) {
  const sortedEntries = entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => {
      const byDate = (b.entry.date || "").localeCompare(a.entry.date || "");
      if (byDate !== 0) return byDate;
      return (b.entry.timestamp || "").localeCompare(a.entry.timestamp || "");
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px",
        }}
      >
        <h2
          style={{
            fontSize: "13px",
            color: colors.primary,
            letterSpacing: "2px",
            margin: 0,
          }}
        >
          LOG HISTORY
        </h2>
        {entries.length > 0 && (
          <button
            onClick={onReset}
            style={{
              padding: "4px 10px",
              background: colors.dangerBg,
              border: `1px solid ${colors.dangerBorder}`,
              borderRadius: "4px",
              color: colors.danger,
              fontSize: "9px",
              letterSpacing: "1px",
              cursor: "pointer",
            }}
          >
            RESET ALL
          </button>
        )}
      </div>

      {entries.length === 0 && (
        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            color: colors.muted,
            fontSize: "12px",
            fontStyle: "italic",
          }}
        >
          No entries yet. Start logging from the LOG tab.
        </div>
      )}

      {sortedEntries.map(({ entry, index }) => {
        const tank = TANKS.find((t) => t.id === entry.tankId);
        const temps = entry.temperatures || {};
        const control = temps.control || {};
        const waterTests = waterTestsFor(entry);

        return (
          <div
            key={entry.id || index}
            style={{
              padding: "12px",
              background: colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: "6px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "12px", color: colors.primary, fontWeight: 600 }}>
                  {entry.date}
                </span>
                <span style={{ fontSize: "10px", color: colors.muted }}>
                  {tank?.emoji} {tank?.name || entry.tankId}
                </span>
              </div>
              <div style={{ display: "flex", gap: "4px" }}>
                <button onClick={() => onEdit(index)} style={miniBtn}>
                  Edit
                </button>
                <button
                  onClick={() => onDelete(index)}
                  style={{ ...miniBtn, color: colors.danger, borderColor: colors.dangerBorder }}
                >
                  Del
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: "16px", fontSize: "11px", flexWrap: "wrap" }}>
              {["morning", "noon", "night"].map((period) => {
                const t = temps[period];
                if (!t?.waterTemp) return null;
                const icon = period === "morning" ? "🌅" : period === "noon" ? "☀️" : "🌙";
                return (
                  <span key={period}>
                    {icon} {t.waterTemp}°C
                    {t.roomTemp && (
                      <span style={{ color: colors.muted }}> (room {t.roomTemp}°C)</span>
                    )}
                  </span>
                );
              })}
            </div>

            {(control.airConditionerSetpoint || control.heaterSetpoint) && (
              <div style={{ marginTop: "5px", fontSize: "10px", color: colors.muted }}>
                {control.airConditionerSetpoint && `❄ A/C ${control.airConditionerSetpoint}°C`}
                {control.airConditionerSetpoint && control.heaterSetpoint && " · "}
                {control.heaterSetpoint && `🔥 Heater ${control.heaterSetpoint}°C`}
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: "16px",
                fontSize: "11px",
                flexWrap: "wrap",
                marginTop: "4px",
              }}
            >
              {entry.outdoor?.tempHigh && (
                <span style={{ color: colors.muted }}>
                  🌡️ {entry.outdoor.tempMorning || "?"}→{entry.outdoor.tempHigh}°C
                </span>
              )}
              {entry.weather && (
                <span style={{ color: colors.muted }}>
                  {WEATHER_OPTIONS.find((w) => w.label === entry.weather)?.icon} {entry.weather}
                </span>
              )}
              {entry.shift && (
                <span style={{ color: entry.shift === "Day Off" ? colors.accent : colors.muted }}>
                  {entry.shift === "Day Off" ? "🏠" : "🏢"} {entry.shift}
                </span>
              )}
            </div>

            {entry.events?.length > 0 && (
              <div style={{ marginTop: "6px", display: "flex", gap: "4px", flexWrap: "wrap" }}>
                {entry.events.map((evId) => {
                  const ev = EVENT_TYPES.find((e) => e.id === evId);
                  return ev ? (
                    <span
                      key={evId}
                      style={{
                        padding: "2px 8px",
                        background: `${ev.color}15`,
                        border: `1px solid ${ev.color}33`,
                        borderRadius: "3px",
                        fontSize: "10px",
                        color: ev.color,
                      }}
                    >
                      {ev.emoji} {ev.label}
                    </span>
                  ) : null;
                })}
              </div>
            )}

            {waterTests.length > 0 && (
              <div style={{ marginTop: "7px", display: "flex", flexDirection: "column", gap: "4px" }}>
                {waterTests.map((test, testIndex) => {
                  const testTank = TANKS.find((t) => t.id === test.tankId);
                  const values = WATER_TEST_FIELDS
                    .map((field) => {
                      const value = displayValue(test[field.id]);
                      return value == null
                        ? null
                        : `${field.label} ${value}${field.unit ? ` ${field.unit}` : ""}`;
                    })
                    .filter(Boolean);

                  return (
                    <div
                      key={test.id || `${entry.id}-test-${testIndex}`}
                      style={{ fontSize: "10px", color: colors.muted, lineHeight: 1.5 }}
                    >
                      🧪 {testTank?.name || test.tankId || "Unknown tank"}: {values.join(" · ") || "no values"}
                    </div>
                  );
                })}
              </div>
            )}

            {entry.notes && (
              <div
                style={{
                  marginTop: "8px",
                  padding: "8px",
                  background: "rgba(100,180,140,0.05)",
                  borderLeft: `2px solid ${colors.activeBg}`,
                  fontSize: "11px",
                  color: colors.textDim,
                  lineHeight: 1.5,
                  fontStyle: "italic",
                }}
              >
                {entry.notes}
              </div>
            )}

            <PhotoThumbs photoIds={entry.photoIds || []} />
          </div>
        );
      })}

      <ExportImport entries={entries} onMerge={onMerge} onReplace={onReplace} />
    </div>
  );
}
