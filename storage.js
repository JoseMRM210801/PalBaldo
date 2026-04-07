const KEYS = {
  participant: "xv_participant_session",
  admin: "xv_admin_session",
};

function readJson(key) {
  const value = localStorage.getItem(key);
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getParticipantSession() {
  return readJson(KEYS.participant);
}

export function setParticipantSession(session) {
  writeJson(KEYS.participant, session);
}

export function clearParticipantSession() {
  localStorage.removeItem(KEYS.participant);
}

export function getAdminSession() {
  return readJson(KEYS.admin);
}

export function setAdminSession(session) {
  writeJson(KEYS.admin, session);
}

export function clearAdminSession() {
  localStorage.removeItem(KEYS.admin);
}
