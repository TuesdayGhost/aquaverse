import { useState } from "react";
import { DEFAULT_ENTRY } from "./constants.js";
import { colors } from "./styles/theme.js";
import { useEntries } from "./hooks/useEntries.js";
import { Icons } from "./components/ui.jsx";
import LogView from "./components/LogView.jsx";
import HistoryView from "./components/HistoryView.jsx";
import TrendsView from "./components/TrendsView.jsx";

export default function App() {
  const {
    entries,
    loading,
    error,
    addEntry,
    updateEntry,
    deleteEntry,
    clearAll,
    mergeEntries,
    replaceAll,
  } = useEntries();
  const [current, setCurrent] = useState(DEFAULT_ENTRY());
  const [view, setView] = useState("log");
  const [editIndex, setEditIndex] = useState(null);

  const handleSave = async () => {
    if (editIndex !== null) {
      await updateEntry(editIndex, current);
      setEditIndex(null);
    } else {
      await addEntry(current);
    }
    setCurrent(DEFAULT_ENTRY());
  };

  const handleEdit = (index) => {
    setCurrent({ ...entries[index] });
    setEditIndex(index);
    setView("log");
  };

  const handleDelete = (index) => {
    deleteEntry(index).catch(() => {});
  };

  const handleReset = () => {
    if (confirm("Clear all logged data? This cannot be undone.")) {
      clearAll().catch(() => {});
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(165deg, #0a1628 0%, #0d2137 40%, #0a2a1f 100%)",
        color: colors.text,
        fontFamily: "'Courier New', 'SF Mono', monospace",
        padding: "0",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "fixed",
          top: "-20%",
          right: "-10%",
          width: "50%",
          height: "50%",
          background: "radial-gradient(circle, rgba(33,150,100,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div
        style={{
          padding: "24px 20px 16px",
          borderBottom: "1px solid rgba(100,180,140,0.15)",
          background: "rgba(10,22,40,0.8)",
          backdropFilter: "blur(10px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1
              style={{
                fontSize: "18px",
                fontWeight: 400,
                color: colors.primary,
                margin: 0,
                letterSpacing: "3px",
                textTransform: "uppercase",
              }}
            >
              🫧 Claude Aqua Opus
            </h1>
            <p
              style={{
                fontSize: "10px",
                color: colors.muted,
                margin: "4px 0 0",
                letterSpacing: "2px",
              }}
            >
              AQUARIUM LOG SYSTEM — GHOST BOTANICAL ESTATE
            </p>
          </div>
          <div style={{ fontSize: "11px", color: colors.muted, textAlign: "right" }}>
            <div>{new Date().toLocaleDateString("ja-JP")}</div>
            <div>{entries.length} entries</div>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", gap: "2px", marginTop: "16px" }}>
          {[
            { id: "log", label: "LOG", icon: Icons.edit },
            { id: "history", label: "HISTORY", icon: Icons.droplet },
            { id: "chart", label: "TRENDS", icon: Icons.chart },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              style={{
                flex: 1,
                padding: "8px 0",
                background: view === tab.id ? colors.activeBg : "transparent",
                border: "1px solid",
                borderColor: view === tab.id ? colors.activeBorder : "rgba(100,180,140,0.08)",
                color: view === tab.id ? colors.primary : colors.muted,
                fontSize: "10px",
                letterSpacing: "2px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                borderRadius: "4px",
                transition: "all 0.2s",
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px 20px 100px", maxWidth: "480px", margin: "0 auto" }}>
        {error && (
          <div
            role="alert"
            style={{
              marginBottom: "12px",
              padding: "10px 12px",
              background: colors.dangerBg,
              border: `1px solid ${colors.dangerBorder}`,
              borderRadius: "6px",
              color: colors.danger,
              fontSize: "11px",
              lineHeight: 1.5,
            }}
          >
            ⚠ DATABASE — {error}
          </div>
        )}

        {loading && (
          <div
            style={{
              padding: "60px 20px",
              textAlign: "center",
              color: colors.muted,
              fontSize: "12px",
              letterSpacing: "2px",
            }}
          >
            CONNECTING TO DATABASE...
          </div>
        )}

        {!loading && view === "log" && (
          <LogView
            current={current}
            setCurrent={setCurrent}
            onSave={handleSave}
            editIndex={editIndex}
          />
        )}

        {!loading && view === "history" && (
          <HistoryView
            entries={entries}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onReset={handleReset}
            onMerge={mergeEntries}
            onReplace={replaceAll}
          />
        )}

        {!loading && view === "chart" && <TrendsView entries={entries} />}
      </div>
    </div>
  );
}
