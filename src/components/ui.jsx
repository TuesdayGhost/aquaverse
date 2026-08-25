import { colors, inputStyle } from "../styles/theme.js";

export const Icons = {
  thermometer: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
    </svg>
  ),
  droplet: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  ),
  sun: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  edit: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  chart: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  camera: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  download: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  upload: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
};

export function Section({ title, icon, children }) {
  return (
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
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        {icon}
        {title.toUpperCase()}
      </div>
      {children}
    </div>
  );
}

export function Label({ children }) {
  return (
    <div style={{ fontSize: "9px", color: colors.muted, letterSpacing: "1px", marginBottom: "4px" }}>
      {children}
    </div>
  );
}

export function Input(props) {
  return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />;
}

function shortDate(date) {
  if (!date) return "";
  const parts = date.split("-");
  return parts.length === 3 ? `${parts[1]}/${parts[2]}` : date;
}

export function ChartCard({ title, data, dates = [], color, unit }) {
  const validEntries = data
    .map((value, index) => ({ value, index, date: dates[index] }))
    .filter(({ value }) => value != null && Number.isFinite(value));

  if (validEntries.length < 2) return null;

  const valid = validEntries.map(({ value }) => value);
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const avg = (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1);
  const latest = validEntries[validEntries.length - 1].value;
  const h = 60;
  const w = 280;
  const range = max - min || 1;

  const dateValues = validEntries.map(({ date }) =>
    date ? Date.parse(`${date}T00:00:00Z`) : Number.NaN
  );
  const hasDateScale = dateValues.every(Number.isFinite) && Math.max(...dateValues) !== Math.min(...dateValues);
  const minDate = hasDateScale ? Math.min(...dateValues) : null;
  const maxDate = hasDateScale ? Math.max(...dateValues) : null;

  const points = validEntries.map(({ value, index, date }, validIndex) => {
    let x;
    if (hasDateScale && date) {
      const timestamp = Date.parse(`${date}T00:00:00Z`);
      x = ((timestamp - minDate) / (maxDate - minDate)) * w;
    } else {
      x = validEntries.length > 1 ? (validIndex / (validEntries.length - 1)) * w : w / 2;
    }
    const y = h - ((value - (min - 0.5)) / (range + 1)) * h;
    return { x, y, index, date };
  });

  const polyline = points.map(({ x, y }) => `${x},${y}`).join(" ");
  const firstDate = validEntries[0].date;
  const lastDate = validEntries[validEntries.length - 1].date;

  return (
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
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px",
        }}
      >
        <span style={{ fontSize: "10px", color: colors.muted, letterSpacing: "2px" }}>
          {title.toUpperCase()}
        </span>
        <span style={{ fontSize: "14px", color, fontWeight: 600 }}>
          {latest}
          {unit}
        </span>
      </div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={polyline}
          opacity="0.8"
        />
        {points.length > 0 && (
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="3"
            fill={color}
          />
        )}
      </svg>
      {firstDate && lastDate && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "9px",
            color: colors.muted,
            marginTop: "4px",
          }}
        >
          <span>{shortDate(firstDate)}</span>
          <span>{shortDate(lastDate)}</span>
        </div>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "9px",
          color: colors.muted,
          marginTop: "6px",
        }}
      >
        <span>
          Min: {min}
          {unit}
        </span>
        <span>
          Avg: {avg}
          {unit}
        </span>
        <span>
          Max: {max}
          {unit}
        </span>
      </div>
    </div>
  );
}

export function StatBox({ label, value }) {
  return (
    <div
      style={{
        padding: "8px",
        background: "rgba(100,180,140,0.05)",
        borderRadius: "4px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "16px", color: colors.primary, fontWeight: 600 }}>{value}</div>
      <div
        style={{
          fontSize: "9px",
          color: colors.muted,
          letterSpacing: "1px",
          marginTop: "2px",
        }}
      >
        {label.toUpperCase()}
      </div>
    </div>
  );
}
