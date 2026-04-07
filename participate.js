import { createPhotoRecord, loginParticipant } from "./api.js";
import { EVENT_ID } from "./config.js";
import { uploadImageToCloudinary } from "./cloudinary.js";
import { getParticipantSession, setParticipantSession } from "./storage.js";

const loginPanel = document.getElementById("loginPanel");
const uploadPanel = document.getElementById("uploadPanel");
const loginForm = document.getElementById("loginForm");
const uploadForm = document.getElementById("uploadForm");
const loginNameInput = document.getElementById("loginName");
const photoInput = document.getElementById("photo");
const messageInput = document.getElementById("message");
const previewImage = document.getElementById("previewImage");
const previewCard = document.getElementById("previewCard");
const participantStatus = document.getElementById("participantStatus");
const loginButton = loginForm.querySelector("button[type='submit']");
const uploadButton = uploadForm.querySelector("button[type='submit']");

function setStatus(message, type = "info") {
  participantStatus.textContent = message;
  participantStatus.dataset.type = type;
}

function setButtonLoading(button, isLoading, loadingText, defaultText) {
  button.disabled = isLoading;
  button.textContent = isLoading ? loadingText : defaultText;
}

function showUploadPanel() {
  loginPanel.classList.add("hidden");
  uploadPanel.classList.remove("hidden");
}

const existingSession = getParticipantSession();
if (existingSession?.participantId && existingSession?.sessionToken) {
  showUploadPanel();
  setStatus(`Sesión activa como ${existingSession.name}. Ya puedes subir tu foto.`, "success");
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = loginNameInput.value.trim();

  if (!name) {
    setStatus("Ingresa tu nombre para continuar.", "error");
    return;
  }

  setButtonLoading(loginButton, true, "Ingresando...", "Continuar");
  setStatus("Validando participante...", "info");

  try {
    const response = await loginParticipant(name);
    const participant = response.participant;

    setParticipantSession({
      participantId: participant.id,
      sessionToken: participant.sessionToken,
      name: participant.name,
    });

    showUploadPanel();
    setStatus("Acceso correcto. Ahora sube tu foto y mensaje.", "success");
  } catch (error) {
    setStatus(error.message || "No fue posible iniciar sesión.", "error");
  } finally {
    setButtonLoading(loginButton, false, "Ingresando...", "Continuar");
  }
});

photoInput.addEventListener("change", () => {
  const file = photoInput.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    previewImage.src = String(reader.result);
    previewCard.classList.add("show-preview");
  };
  reader.readAsDataURL(file);
});

uploadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = photoInput.files?.[0];
  const message = messageInput.value.trim();
  const session = getParticipantSession();

  if (!session?.participantId || !session?.sessionToken) {
    setStatus("Tu sesión expiró. Vuelve a iniciar sesión.", "error");
    return;
  }

  if (!file) {
    setStatus("Selecciona una fotografía antes de enviar.", "error");
    return;
  }

  if (!message) {
    setStatus("Escribe un mensaje para acompañar la foto.", "error");
    return;
  }

  setButtonLoading(uploadButton, true, "Subiendo...", "Enviar para aprobación");

  try {
    setStatus("Subiendo imagen a Cloudinary...", "info");
    const uploaded = await uploadImageToCloudinary(file);

    setStatus("Registrando foto en el backend...", "info");
    await createPhotoRecord(
      {
        eventId: EVENT_ID,
        participantId: session.participantId,
        imageUrl: uploaded.secureUrl,
        thumbnailUrl: uploaded.thumbnailUrl,
        originalFilename: uploaded.originalFilename,
        mimeType: uploaded.mimeType,
        fileSize: uploaded.fileSize,
        message,
      },
      session.sessionToken
    );

    uploadForm.reset();
    previewCard.classList.remove("show-preview");
    previewImage.src = "";
    setStatus("¡Foto enviada correctamente! Quedará pendiente de aprobación.", "success");
  } catch (error) {
    setStatus(error.message || "No se pudo completar el envío.", "error");
  } finally {
    setButtonLoading(uploadButton, false, "Subiendo...", "Enviar para aprobación");
  }
});
