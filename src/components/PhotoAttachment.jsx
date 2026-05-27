import { useState, useEffect, useRef } from "react";
import { savePhoto, getPhoto, deletePhoto } from "../storage.js";
import { colors } from "../styles/theme.js";
import { Icons } from "./ui.jsx";

function resizeImage(file, maxWidth = 1200) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.85);
    };
    img.src = url;
  });
}

export default function PhotoAttachment({ photoIds, onChange }) {
  const [thumbs, setThumbs] = useState({});
  const [viewPhoto, setViewPhoto] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = {};
      for (const id of photoIds) {
        try {
          const blob = await getPhoto(id);
          if (blob && !cancelled) loaded[id] = URL.createObjectURL(blob);
        } catch {}
      }
      if (!cancelled) setThumbs(loaded);
    })();
    return () => {
      cancelled = true;
      Object.values(thumbs).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photoIds.join(",")]);

  const handleAdd = async (e) => {
    const files = Array.from(e.target.files || []);
    const newIds = [];
    for (const file of files) {
      try {
        const blob = await resizeImage(file);
        const id = crypto.randomUUID();
        await savePhoto(id, blob);
        newIds.push(id);
        setThumbs((prev) => ({ ...prev, [id]: URL.createObjectURL(blob) }));
      } catch (err) {
        console.error("Photo save failed:", err);
      }
    }
    if (newIds.length > 0) onChange([...photoIds, ...newIds]);
    e.target.value = "";
  };

  const handleRemove = async (id) => {
    try {
      await deletePhoto(id);
    } catch {}
    if (thumbs[id]) URL.revokeObjectURL(thumbs[id]);
    setThumbs((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    onChange(photoIds.filter((pid) => pid !== id));
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        {photoIds.map((id) => (
          <div key={id} style={{ position: "relative" }}>
            <img
              src={thumbs[id] || ""}
              alt=""
              onClick={() => setViewPhoto(thumbs[id])}
              style={{
                width: "64px",
                height: "64px",
                objectFit: "cover",
                borderRadius: "4px",
                border: `1px solid ${colors.cardBorder}`,
                cursor: "pointer",
                display: thumbs[id] ? "block" : "none",
              }}
            />
            <button
              onClick={() => handleRemove(id)}
              style={{
                position: "absolute",
                top: "-6px",
                right: "-6px",
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                background: "rgba(244,67,54,0.8)",
                border: "none",
                color: "#fff",
                fontSize: "10px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        ))}

        <button
          onClick={() => fileRef.current?.click()}
          style={{
            width: "64px",
            height: "64px",
            background: colors.subtleBg,
            border: `1px dashed ${colors.cardBorder}`,
            borderRadius: "4px",
            color: colors.muted,
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "2px",
          }}
        >
          {Icons.camera}
          <span style={{ fontSize: "8px", letterSpacing: "1px" }}>ADD</span>
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleAdd}
        style={{ display: "none" }}
      />

      {viewPhoto && (
        <div
          onClick={() => setViewPhoto(null)}
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
            src={viewPhoto}
            alt=""
            style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: "8px" }}
          />
        </div>
      )}
    </div>
  );
}
