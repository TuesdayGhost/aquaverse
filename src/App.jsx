import { useState } from "react";
import { useItems } from "./useItems.js";

// Today's date as YYYY-MM-DD in local time.
function todayStr() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d - tz).toISOString().split("T")[0];
}

// Number of days since startDate, counting the start day as day 1.
// e.g. started today => 1, started yesterday => 2.
function dayCount(startDate) {
  const start = new Date(startDate + "T00:00:00");
  const today = new Date(todayStr() + "T00:00:00");
  const diff = Math.round((today - start) / 86400000);
  return diff + 1;
}

const c = {
  bg1: "#0a1628",
  card: "rgba(13,33,55,0.7)",
  border: "rgba(100,180,140,0.18)",
  primary: "#5fd6a0",
  text: "#e8f5ee",
  muted: "#7a9a8a",
  danger: "#ff6b6b",
};

export default function App() {
  const { items, addItem, removeItem } = useItems();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(todayStr());

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name.trim() || !startDate) return;
    addItem(name, startDate);
    setName("");
    setStartDate(todayStr());
  };

  const sorted = [...items].sort((a, b) => a.startDate.localeCompare(b.startDate));

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(165deg, #0a1628 0%, #0d2137 45%, #0a2a1f 100%)",
        color: c.text,
        fontFamily: "'Hiragino Sans', 'Noto Sans JP', system-ui, sans-serif",
        padding: "0 0 60px",
      }}
    >
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "0 18px" }}>
        {/* Header */}
        <header style={{ padding: "32px 4px 20px", textAlign: "center" }}>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 600,
              color: c.primary,
              letterSpacing: "2px",
              margin: 0,
            }}
          >
            🌱 つづいてるよ
          </h1>
          <p style={{ fontSize: "12px", color: c.muted, marginTop: "6px" }}>
            始めたことを登録して、続いている日数を数えるアプリ
          </p>
        </header>

        {/* Add form */}
        <form
          onSubmit={handleAdd}
          style={{
            background: c.card,
            border: `1px solid ${c.border}`,
            borderRadius: "14px",
            padding: "16px",
            marginBottom: "24px",
            backdropFilter: "blur(8px)",
          }}
        >
          <label style={labelStyle}>始めたこと</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例：毎朝のランニング"
            style={inputStyle}
          />

          <label style={{ ...labelStyle, marginTop: "12px" }}>始めた日</label>
          <input
            type="date"
            value={startDate}
            max={todayStr()}
            onChange={(e) => setStartDate(e.target.value)}
            style={inputStyle}
          />

          <button
            type="submit"
            disabled={!name.trim()}
            style={{
              ...buttonStyle,
              opacity: name.trim() ? 1 : 0.4,
              cursor: name.trim() ? "pointer" : "not-allowed",
            }}
          >
            登録する
          </button>
        </form>

        {/* List */}
        {sorted.length === 0 ? (
          <p style={{ textAlign: "center", color: c.muted, fontSize: "13px", marginTop: "40px" }}>
            まだ何も登録されていません。
            <br />
            上のフォームから始めたことを追加しましょう。
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {sorted.map((it) => {
              const days = dayCount(it.startDate);
              return (
                <div
                  key={it.id}
                  style={{
                    background: c.card,
                    border: `1px solid ${c.border}`,
                    borderRadius: "14px",
                    padding: "16px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "15px",
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {it.name}
                    </div>
                    <div style={{ fontSize: "11px", color: c.muted, marginTop: "4px" }}>
                      {it.startDate} から
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "14px", flexShrink: 0 }}>
                    <div style={{ textAlign: "right", lineHeight: 1 }}>
                      <span style={{ fontSize: "30px", fontWeight: 700, color: c.primary }}>
                        {days}
                      </span>
                      <span style={{ fontSize: "13px", color: c.muted, marginLeft: "3px" }}>
                        日目
                      </span>
                    </div>
                    <button
                      onClick={() => removeItem(it.id)}
                      aria-label="削除"
                      style={{
                        background: "transparent",
                        border: "none",
                        color: c.danger,
                        fontSize: "18px",
                        cursor: "pointer",
                        padding: "4px",
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: "11px",
  color: c.muted,
  marginBottom: "6px",
  letterSpacing: "1px",
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  background: "rgba(10,22,40,0.6)",
  border: `1px solid ${c.border}`,
  borderRadius: "8px",
  color: c.text,
  fontSize: "15px",
  fontFamily: "inherit",
  outline: "none",
};

const buttonStyle = {
  width: "100%",
  marginTop: "16px",
  padding: "12px",
  background: c.primary,
  border: "none",
  borderRadius: "8px",
  color: "#06231a",
  fontSize: "15px",
  fontWeight: 700,
  fontFamily: "inherit",
};
