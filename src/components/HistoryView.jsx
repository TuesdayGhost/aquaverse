import { useState } from "react";
import { TANKS, WEATHER_OPTIONS, EVENT_TYPES } from "../constants.js";
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

export default function HistoryView({
  entries,
  onEdit,
  onDelete,
  onReset,
  onMerge,
  onReplace,
}) {
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

      {[...entries].reverse().map((entry, ri) => {
        const i = entries.length - 1 - ri;
        const tank = TANKS.find((t) => t.id === entry.tankId);
        const temps = entry.temperatures || {};
        const wq = entry.waterQuality || {};
        const hasWQ = wq.ammonia || wq.nitrite || wq.gh || wq.kh || wq.tds;

        return (
          <div
            key={entry.id || i}
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
                  {tank?.emoji} {tank?.name}
                </span>
              </div>
              <div style={{ display: "flex", gap: "4px" }}>
                <button onClick={() => onEdit(i)} style={miniBtn}>
                  Edit
                </button>
                <button
                  onClick={() => onDelete(i)}
                  style={{ ...miniBtn, color: colors.danger, borderColor: colors.dangerBorder }}
                >
                  Del
                </button>
              </div>
            </div>

            {/* Temperature readings */}
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
                <span
                  style={{
                    color: entry.shift === "Day Off" ? colors.accent : colors.muted,
                  }}
                >
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

            {hasWQ && (
              <div style={{ marginTop: "6px", fontSize: "10px", color: colors.muted }}>
                🧪 NH₃: {wq.ammonia || "—"} ppm · NO₂: {wq.nitrite || "—"} mg/l
                {(wq.gh || wq.kh || wq.tds) && (
                  <>
                    {" "}
                    · GH: {wq.gh || "—"} · KH: {wq.kh || "—"} · TDS: {wq.tds || "—"} ppm
                  </>
                )}
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
