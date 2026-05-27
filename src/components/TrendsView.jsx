import { useState } from "react";
import { TANKS, EVENT_TYPES } from "../constants.js";
import { colors } from "../styles/theme.js";
import { ChartCard, StatBox } from "./ui.jsx";

export default function TrendsView({ entries }) {
  const [tankFilter, setTankFilter] = useState("republic");

  const filtered = entries
    .filter((e) => e.tankId === tankFilter)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14);

  const extract = (path) =>
    filtered.map((e) => {
      const val = path(e);
      return val ? parseFloat(val) : null;
    });

  const waterMornings = extract((e) => e.temperatures?.morning?.waterTemp);
  const waterNoons = extract((e) => e.temperatures?.noon?.waterTemp);
  const waterNights = extract((e) => e.temperatures?.night?.waterTemp);
  const roomMornings = extract((e) => e.temperatures?.morning?.roomTemp);
  const outdoorHighs = extract((e) => e.outdoor?.tempHigh);
  const ghVals = extract((e) => e.waterQuality?.gh);
  const khVals = extract((e) => e.waterQuality?.kh);
  const tdsVals = extract((e) => e.waterQuality?.tds);

  const allWaterTemps = [...waterMornings, ...waterNoons, ...waterNights].filter(
    (v) => v != null
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ fontSize: "13px", color: colors.primary, letterSpacing: "2px", margin: 0 }}>
          TRENDS
        </h2>
        <div style={{ display: "flex", gap: "4px" }}>
          {TANKS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTankFilter(t.id)}
              style={{
                padding: "4px 10px",
                background: tankFilter === t.id ? colors.activeBg : "transparent",
                border: "1px solid",
                borderColor: tankFilter === t.id ? colors.activeBorder : colors.subtleBorder,
                borderRadius: "4px",
                color: tankFilter === t.id ? colors.primary : colors.muted,
                fontSize: "10px",
                cursor: "pointer",
                letterSpacing: "1px",
              }}
            >
              {t.emoji} {t.name.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {filtered.length < 2 ? (
        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            color: colors.muted,
            fontSize: "12px",
            fontStyle: "italic",
          }}
        >
          Log at least 2 entries for {TANKS.find((t) => t.id === tankFilter)?.name} to see trends.
        </div>
      ) : (
        <>
          <ChartCard title="Water Temp — Morning" data={waterMornings} color="#2196F3" unit="°C" />

          {waterNoons.some((v) => v != null) && (
            <ChartCard title="Water Temp — Noon" data={waterNoons} color="#FF9800" unit="°C" />
          )}

          {waterNights.some((v) => v != null) && (
            <ChartCard title="Water Temp — Night" data={waterNights} color="#9C27B0" unit="°C" />
          )}

          {roomMornings.some((v) => v != null) && (
            <ChartCard title="Room Temp — Morning" data={roomMornings} color="#E91E63" unit="°C" />
          )}

          {outdoorHighs.some((v) => v != null) && (
            <ChartCard title="Outdoor High" data={outdoorHighs} color="#FF5722" unit="°C" />
          )}

          {ghVals.some((v) => v != null) && (
            <ChartCard title="GH" data={ghVals} color="#00BCD4" unit="°dH" />
          )}

          {khVals.some((v) => v != null) && (
            <ChartCard title="KH" data={khVals} color="#8BC34A" unit="°dH" />
          )}

          {tdsVals.some((v) => v != null) && (
            <ChartCard title="TDS" data={tdsVals} color="#FFC107" unit=" ppm" />
          )}

          {/* Event frequency */}
          <div
            style={{
              padding: "12px",
              background: colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: "6px",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                color: colors.muted,
                letterSpacing: "2px",
                marginBottom: "10px",
              }}
            >
              EVENT FREQUENCY (ALL TIME)
            </div>
            {EVENT_TYPES.map((ev) => {
              const count = entries.filter((e) => e.events?.includes(ev.id)).length;
              if (count === 0) return null;
              return (
                <div
                  key={ev.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "6px",
                  }}
                >
                  <span style={{ fontSize: "12px", width: "20px" }}>{ev.emoji}</span>
                  <span style={{ fontSize: "11px", color: colors.textDim, width: "80px" }}>
                    {ev.label}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: "6px",
                      background: colors.subtleBg,
                      borderRadius: "3px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(100, (count / entries.length) * 100)}%`,
                        height: "100%",
                        background: ev.color,
                        borderRadius: "3px",
                        opacity: 0.6,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: "10px",
                      color: colors.muted,
                      width: "20px",
                      textAlign: "right",
                    }}
                  >
                    {count}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Stats */}
          <div
            style={{
              padding: "12px",
              background: colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: "6px",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                color: colors.muted,
                letterSpacing: "2px",
                marginBottom: "10px",
              }}
            >
              {TANKS.find((t) => t.id === tankFilter)?.name.toUpperCase()} STATS
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <StatBox
                label="Total Entries"
                value={entries.filter((e) => e.tankId === tankFilter).length}
              />
              <StatBox
                label="Water Temp Range"
                value={
                  allWaterTemps.length > 0
                    ? `${Math.min(...allWaterTemps)}–${Math.max(...allWaterTemps)}°C`
                    : "—"
                }
              />
              <StatBox
                label="Water Changes"
                value={
                  entries.filter(
                    (e) => e.tankId === tankFilter && e.events?.includes("water_change")
                  ).length
                }
              />
              <StatBox
                label="Feedings"
                value={
                  entries.filter((e) => e.tankId === tankFilter && e.events?.includes("feed"))
                    .length
                }
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
