export const STORAGE_KEY = "palbaldo_album_entries_v2";

export function loadEntries() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function createEntry({ author, message, imageData }) {
  return {
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    author: author.trim(),
    message: message.trim(),
    imageData,
    visible: false,
    createdAt: new Date().toISOString(),
  };
}

export function formatDate(isoDate) {
  return new Date(isoDate).toLocaleString("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
