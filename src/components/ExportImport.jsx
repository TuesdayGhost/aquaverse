import { useRef, useState } from "react";
import { colors } from "../styles/theme.js";
import { Icons } from "./ui.jsx";
import { exportToJSON, importFromJSON } from "../export.js";

export default function ExportImport({ entries, onMerge, onReplace }) {
  const fileRef = useRef();
  const [status, setStatus] = useState(null);

  const handleExport = async () => {
    setStatus("Exporting...");
    try {
      await exportToJSON(entries, entries.some((e) => e.photoIds?.length > 0));
      setStatus("Exported!");
    } catch (e) {
      setStatus("Export failed");
      console.error(e);
    }
    setTimeout(() => setStatus(null), 2000);
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("Reading...");
    try {
      const text = await file.text();
      const imported = await importFromJSON(text);
      const action = prompt(
        `Found ${imported.length} entries.\n\nType MERGE to add only new entries.\nType REPLACE to replace all existing data.\nLeave blank or press Cancel to abort.`
      )
        ?.trim()
        .toLowerCase();

      if (!action) {
        setStatus("Import cancelled");
      } else if (action === "merge") {
        const added = await onMerge(imported);
        setStatus(`Merged: ${added} new entries`);
      } else if (action === "replace") {
        const confirmed = confirm(
          `REPLACE ALL existing data with ${imported.length} imported entries?\n\nThis is destructive. Keep your JSON backup.`
        );
        if (!confirmed) {
          setStatus("Import cancelled");
        } else {
          await onReplace(imported);
          setStatus(`Replaced: ${imported.length} entries loaded`);
        }
      } else {
        setStatus("Import cancelled — type MERGE or REPLACE");
      }
    } catch (err) {
      setStatus("Import failed: " + err.message);
      console.error(err);
    }
    e.target.value = "";
    setTimeout(() => setStatus(null), 3000);
  };

  const btnStyle = {
    flex: 1,
    padding: "10px",
    background: colors.subtleBg,
    border: `1px solid ${colors.cardBorder}`,
    borderRadius: "4px",
    color: colors.muted,
    fontSize: "10px",
    letterSpacing: "1px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  };

  return (
    <div style={{ marginTop: "16px" }}>
      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={handleExport} style={btnStyle}>
          {Icons.download} EXPORT JSON
        </button>
        <button onClick={() => fileRef.current?.click()} style={btnStyle}>
          {Icons.upload} IMPORT JSON
        </button>
      </div>
      {status && (
        <div
          style={{
            marginTop: "8px",
            padding: "6px 10px",
            background: "rgba(100,180,140,0.1)",
            borderRadius: "4px",
            fontSize: "10px",
            color: colors.primary,
            textAlign: "center",
            letterSpacing: "1px",
          }}
        >
          {status}
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        onChange={handleImportFile}
        style={{ display: "none" }}
      />
    </div>
  );
}
