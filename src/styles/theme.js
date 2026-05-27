export const colors = {
  bg: "#0a1628",
  bgAlt: "#0d2137",
  primary: "#7cc4a8",
  muted: "#4a7a6a",
  text: "#c8dbd5",
  textDim: "#8aaa9e",
  accent: "#ffb74d",
  danger: "#e57373",
  dangerBg: "rgba(244,67,54,0.1)",
  dangerBorder: "rgba(244,67,54,0.2)",
  cardBg: "rgba(255,255,255,0.02)",
  cardBorder: "rgba(100,180,140,0.1)",
  inputBg: "rgba(255,255,255,0.04)",
  inputBorder: "rgba(100,180,140,0.15)",
  activeBg: "rgba(100,180,140,0.15)",
  activeBorder: "rgba(100,180,140,0.3)",
  subtleBg: "rgba(255,255,255,0.03)",
  subtleBorder: "rgba(255,255,255,0.06)",
};

export const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  background: colors.inputBg,
  border: `1px solid ${colors.inputBorder}`,
  borderRadius: "4px",
  color: colors.text,
  fontSize: "13px",
  fontFamily: "'Courier New', monospace",
  outline: "none",
  boxSizing: "border-box",
};

export const selectStyle = {
  ...inputStyle,
  appearance: "none",
  cursor: "pointer",
};

export const miniBtn = {
  padding: "2px 8px",
  background: "transparent",
  border: `1px solid ${colors.inputBorder}`,
  borderRadius: "3px",
  color: colors.muted,
  fontSize: "9px",
  cursor: "pointer",
  letterSpacing: "1px",
};
