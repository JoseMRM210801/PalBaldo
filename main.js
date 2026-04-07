import { getPublicPhotos } from "./api.js";

const publicGallery = document.getElementById("publicGallery");
const cardTemplate = document.getElementById("cardTemplate");
const photoModal = document.getElementById("photoModal");
const closeModal = document.getElementById("closeModal");
const modalImage = document.getElementById("modalImage");
const modalMeta = document.getElementById("modalMeta");
const modalText = document.getElementById("modalText");

function formatDate(isoDate) {
  if (!isoDate) return "Fecha no disponible";
  return new Date(isoDate).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" });
}

function normalizePhoto(photo) {
  return {
    id: photo.id,
    imageUrl: photo.imageUrl || photo.secure_url || photo.thumbnailUrl,
    message: photo.message || "Sin mensaje",
    author: photo.participantName || photo.author || photo.name || "Invitado",
    createdAt: photo.createdAt || photo.created_at,
  };
}

function openModal(photo) {
  modalImage.src = photo.imageUrl;
  modalMeta.textContent = `${photo.author} · ${formatDate(photo.createdAt)}`;
  modalText.textContent = photo.message;
  photoModal.showModal();
}

function renderEmpty(message) {
  publicGallery.innerHTML = `<p class="empty">${message}</p>`;
}

function renderGallery(photos) {
  publicGallery.innerHTML = "";

  if (!photos.length) {
    renderEmpty("Aún no hay fotos aprobadas. ¡Sé el primero en compartir un momento!");
    return;
  }

  photos.forEach((photo) => {
    const card = cardTemplate.content.firstElementChild.cloneNode(true);
    card.querySelector("img").src = photo.imageUrl;
    card.querySelector(".meta").textContent = `${photo.author} · ${formatDate(photo.createdAt)}`;
    card.querySelector(".text").textContent = photo.message;

    card.addEventListener("click", () => openModal(photo));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openModal(photo);
      }
    });

    publicGallery.appendChild(card);
  });
}

closeModal.addEventListener("click", () => photoModal.close());
photoModal.addEventListener("click", (event) => {
  const rect = photoModal.getBoundingClientRect();
  const inDialog =
    rect.top <= event.clientY &&
    event.clientY <= rect.top + rect.height &&
    rect.left <= event.clientX &&
    event.clientX <= rect.left + rect.width;
  if (!inDialog) photoModal.close();
});

async function loadPublicGallery() {
  renderEmpty("Cargando galería...");

  try {
    const response = await getPublicPhotos();
    const photosRaw = Array.isArray(response) ? response : response.photos || [];
    const photos = photosRaw.map(normalizePhoto).filter((photo) => photo.imageUrl);
    renderGallery(photos);
  } catch (error) {
    renderEmpty(error.message || "No fue posible cargar las fotos públicas.");
  }
}

loadPublicGallery();
