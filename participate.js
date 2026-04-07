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
const previewCard = document.getElementById("previewCard");
const previewGrid = document.getElementById("previewGrid");
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

function renderPreview(files) {
  previewGrid.innerHTML = "";
  if (!files.length) {
    previewCard.classList.remove("show-preview");
    return;
  }

  files.forEach((file) => {
    const img = document.createElement("img");
    img.alt = file.name;
    const reader = new FileReader();
    reader.onload = () => {
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
    previewGrid.appendChild(img);
  });

  previewCard.classList.add("show-preview");
}

const existingSession = getParticipantSession();
if (existingSession?.participantId && existingSession?.sessionToken) {
  showUploadPanel();
  setStatus(`Sesión activa como ${existingSession.name}. Ya puedes subir tus fotos.`, "success");
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
    setStatus("Acceso correcto. Ahora sube tus fotos y mensaje.", "success");
  } catch (error) {
    setStatus(error.message || "No fue posible iniciar sesión.", "error");
  } finally {
    setButtonLoading(loginButton, false, "Ingresando...", "Continuar");
  }
});

photoInput.addEventListener("change", () => {
  const files = Array.from(photoInput.files || []);
  renderPreview(files);
});

uploadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const files = Array.from(photoInput.files || []);
  const message = messageInput.value.trim();
  const session = getParticipantSession();

  if (!session?.participantId || !session?.sessionToken) {
    setStatus("Tu sesión expiró. Vuelve a iniciar sesión.", "error");
    return;
  }

  if (!files.length) {
    setStatus("Selecciona al menos una fotografía antes de enviar.", "error");
    return;
  }

  if (!message) {
    setStatus("Escribe un mensaje para acompañar tus fotos.", "error");
    return;
  }

  setButtonLoading(uploadButton, true, "Subiendo...", "Enviar para aprobación");

  try {
    let sentCount = 0;

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      setStatus(`Subiendo imagen ${index + 1} de ${files.length} a Cloudinary...`, "info");
      const uploaded = await uploadImageToCloudinary(file);

      setStatus(`Registrando imagen ${index + 1} en el backend...`, "info");
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

      sentCount += 1;
    }

    uploadForm.reset();
    previewCard.classList.remove("show-preview");
    previewGrid.innerHTML = "";
    setStatus(`¡Listo! Se enviaron ${sentCount} foto(s) para aprobación.`, "success");
  } catch (error) {
    setStatus(error.message || "No se pudo completar el envío de fotos.", "error");
  } finally {
    setButtonLoading(uploadButton, false, "Subiendo...", "Enviar para aprobación");
  }
});
