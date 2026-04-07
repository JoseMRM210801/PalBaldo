import { API_BASE_URL, EVENT_ID } from "./config.js";

async function apiRequest(path, { method = "GET", body, token } = {}) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.message || "Ocurrió un error al comunicar con el servidor.";
    throw new Error(message);
  }

  return payload;
}

export async function loginParticipant(name) {
  return apiRequest("/participants/login", {
    method: "POST",
    body: { eventId: EVENT_ID, name },
  });
}

export async function createPhotoRecord(photoData, token) {
  return apiRequest("/photos", {
    method: "POST",
    body: photoData,
    token,
  });
}

export async function getPublicPhotos() {
  return apiRequest(`/photos/public/${EVENT_ID}`);
}

export async function loginAdmin(username, password) {
  return apiRequest("/admin/login", {
    method: "POST",
    body: { eventId: EVENT_ID, username, password },
  });
}

export async function getAdminPhotos(token) {
  return apiRequest(`/admin/photos/${EVENT_ID}`, { token });
}

export async function approvePhoto(photoId, adminId, isVisibleHome, token) {
  return apiRequest(`/admin/photos/${photoId}/approve`, {
    method: "PATCH",
    body: { adminId, isVisibleHome },
    token,
  });
}

export async function rejectPhoto(photoId, adminId, token) {
  return apiRequest(`/admin/photos/${photoId}/reject`, {
    method: "PATCH",
    body: { adminId },
    token,
  });
}

export async function setPhotoVisibility(photoId, isVisibleHome, token) {
  return apiRequest(`/admin/photos/${photoId}/visibility`, {
    method: "PATCH",
    body: { isVisibleHome },
    token,
  });
}
