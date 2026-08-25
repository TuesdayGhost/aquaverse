import { useState } from "react";
import { TANKS, EVENT_TYPES, WATER_TEST_FIELDS } from "../constants.js";
import { colors } from "../styles/theme.js";
import { ChartCard, StatBox } from "./ui.jsx";

function toNumber(value) {
  if (value === "" || value == null) return null;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function waterTestsFor(entry) {
  if (Array.isArray(entry.waterTests)) return entry.waterTests;
  const raw = entry.waterQuality || {};
  if (Array.isArray(raw.tests)) return raw.tests;
  const hasValue = WATER_TEST_FIELDS.some((field) => raw[field.id] !== "" && raw[field.id] != null);
  return hasValue ? [{ id: `${entry.id}-legacy-water-test`, tankId: entry.tankId, ...raw }] : [];
}

export default function TrendsView({ entries }) {
  const [tankFilter, setTankFilter] = useState("republic");

  const filtered = entries
    .filter((e) => e.tankId === tankFilter)
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""))
    .slice(-14);
  const entryDates = filtered.map((e) => e.date);

  const extract = (path) => filtered.map((e) => toNumber(path(e)));

  const waterMornings = extract((e) => e.temperatures?.morning?.waterTemp);
  const waterNoons = extract((e) => e.temperatures?.noon?.waterTemp);
  const waterNights = extract((e) => e.temperatures?.night?.waterTemp);
  const roomMornings = extract((e) => e.temperatures?.morning?.roomTemp);
  const outdoorHighs = extract((e) => e.outdoor?.tempHigh);
  const acSettings = extract((e) => e.temperatures?.control?.airConditionerSetpoint);
  const heaterSettings = extract((e) => e.temperatures?.control?.heaterSetpoint);

  const allWaterTemps = [...waterMornings, ...waterNoons, ...waterNights].filter(
    (v) => v != null
  );

  const testRows = entries
    .flatMap((entry) =>
      waterTestsFor(entry).map((test) => ({
        ...test,
        date: entry.date,
      }))
    )
    .filter((test) => test.tankId === tankFilter)
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""))
    .slice(-14);
  const testDates = testRows.map((test) => test.date);
  const testExtract = (field) => testRows.map((test) => toNumber(test[field]));

  const ammoniaVals = testExtract("ammonia");
  const nitriteVals = testExtract("nitrite");
  const nitrateVals = testExtract("nitrate");
  const phVals = testExtract("ph");
  const ghVals = testExtract("gh");
  const khVals = testExtract("kh");
  const tdsVals = testExtract("tds");

  const eventEntries = entries.filter((e) => e.tankId === tankFilter);
  const hasTrendData = filtered.length >= 2 || testRows.length >= 2;
  const selectedTank = TANKS.find((t) => t.id === tankFilter);

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
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {TANKS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTankFilter(t.id)}
              style={{
                padding: "4px 8px",
                background: tankFilter === t.id ? colors.activeBg : "transparent",
                border: "1px solid",
                borderColor: tankFilter === t.id ? colors.activeBorder : colors.subtleBorder,
                borderRadius: "4px",
                color: tankFilter === t.id ? colors.primary : colors.muted,
                fontSize: "9px",
                cursor: "pointer",
                letterSpacing: "0.5px",
              }}
            >
              {t.emoji} {t.name.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {!hasTrendData ? (
        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            color: colors.muted,
            fontSize: "12px",
            fontStyle: "italic",
          }}
        >
          Log at least 2 readings for {selectedTank?.name} to see trends.
        </div>
      ) : (
        <>
          <ChartCard
            title="Water Temp — Morning"
            data={waterMornings}
            dates={entryDates}
            color="#2196F3"
            unit="°C"
          />

          {waterNoons.some((v) => v != null) && (
            <ChartCard
              title="Water Temp — Noon"
              data={waterNoons}
              dates={entryDates}
              color="#FF9800"
              unit="°C"
            />
          )}

          {waterNights.some((v) => v != null) && (
            <ChartCard
              title="Water Temp — Night"
              data={waterNights}
              dates={entryDates}
              color="#9C27B0"
              unit="°C"
            />
          )}

          {roomMornings.some((v) => v != null) && (
            <ChartCard
              title="Room Temp — Morning"
              data={roomMornings}
              dates={entryDates}
              color="#E91E63"
              unit="°C"
            />
          )}

          {outdoorHighs.some((v) => v != null) && (
            <ChartCard
              title="Outdoor High"
              data={outdoorHighs}
              dates={entryDates}
              color="#FF5722"
              unit="°C"
            />
          )}

          {acSettings.some((v) => v != null) && (
            <ChartCard
              title="A/C Setpoint"
              data={acSettings}
              dates={entryDates}
              color="#64B5F6"
              unit="°C"
            />
          )}

          {heaterSettings.some((v) => v != null) && (
            <ChartCard
              title="Heater Setpoint"
              data={heaterSettings}
              dates={entryDates}
              color="#FF7043"
              unit="°C"
            />
          )}

          {ammoniaVals.some((v) => v != null) && (
            <ChartCard
              title="NH₃/NH₄⁺"
              data={ammoniaVals}
              dates={testDates}
              color="#26C6DA"
              unit=" ppm"
            />
          )}

          {nitriteVals.some((v) => v != null) && (
            <ChartCard
              title="NO₂⁻"
              data={nitriteVals}
              dates={testDates}
              color="#AB47BC"
              unit=" mg/L"
            />
          )}

          {nitrateVals.some((v) => v != null) && (
            <ChartCard
              title="NO₃⁻"
              data={nitrateVals}
              dates={testDates}
              color="#8D6E63"
              unit=" mg/L"
            />
          )}

          {phVals.some((v) => v != null) && (
            <ChartCard title="pH" data={phVals} dates={testDates} color="#26A69A" unit="" />
          )}

          {ghVals.some((v) => v != null) && (
            <ChartCard title="GH" data={ghVals} dates={testDates} color="#00BCD4" unit="°dH" />
          )}

          {khVals.some((v) => v != null) && (
            <ChartCard title="KH" data={khVals} dates={testDates} color="#8BC34A" unit="°dH" />
          )}

          {tdsVals.some((v) => v != null) && (
            <ChartCard title="TDS" data={tdsVals} dates={testDates} color="#FFC107" unit=" ppm" />
          )}

          {eventEntries.length > 0 && (
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
                EVENT FREQUENCY (ALL TIME · {selectedTank?.name.toUpperCase()})
              </div>
              {EVENT_TYPES.map((ev) => {
                const count = eventEntries.filter((e) => e.events?.includes(ev.id)).length;
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
                          width: `${Math.min(100, (count / eventEntries.length) * 100)}%`,
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
          )}

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
              {selectedTank?.name.toUpperCase()} STATS
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <StatBox label="Total Entries" value={eventEntries.length} />
              <StatBox label="Water Tests" value={testRows.length} />
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
                value={eventEntries.filter((e) => e.events?.includes("water_change")).length}
              />
              <StatBox
                label="Feedings"
                value={eventEntries.filter((e) => e.events?.includes("feed")).length}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
