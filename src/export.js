import { getPhoto, savePhoto, getAllPhotos } from "./storage.js";

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(dataUrl) {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)[1];
  const bytes = atob(data);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export async function exportToJSON(entries, includePhotos = true) {
  const photos = {};
  if (includePhotos) {
    const allPhotoIds = entries.flatMap((e) => e.photoIds || []);
    for (const id of allPhotoIds) {
      try {
        const blob = await getPhoto(id);
        if (blob) photos[id] = await blobToBase64(blob);
      } catch {}
    }
  }

  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    entries,
    photos,
  };

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `aqua-log-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importFromJSON(jsonString) {
  const data = JSON.parse(jsonString);
  if (!data.version || !Array.isArray(data.entries)) {
    throw new Error("Invalid export file format");
  }

  if (data.photos) {
    for (const [id, dataUrl] of Object.entries(data.photos)) {
      try {
        const blob = base64ToBlob(dataUrl);
        await savePhoto(id, blob);
      } catch {}
    }
  }

  return data.entries;
}
