import { getPublicPhotos } from "./api.js";

const publicGallery = document.getElementById("publicGallery");
const cardTemplate = document.getElementById("cardTemplate");
const photoModal = document.getElementById("photoModal");
const closeModal = document.getElementById("closeModal");
const modalImage = document.getElementById("modalImage");
const modalMeta = document.getElementById("modalMeta");
const modalText = document.getElementById("modalText");
const modalCounter = document.getElementById("modalCounter");
const modalPrev = document.getElementById("modalPrev");
const modalNext = document.getElementById("modalNext");

let galleryPhotos = [];
let currentPhotoIndex = 0;

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

function renderModalPhoto() {
  const photo = galleryPhotos[currentPhotoIndex];
  if (!photo) return;

  modalImage.src = photo.imageUrl;
  modalMeta.textContent = `${photo.author} · ${formatDate(photo.createdAt)}`;
  modalText.textContent = photo.message;
  modalCounter.textContent = `${currentPhotoIndex + 1} / ${galleryPhotos.length}`;

  const singlePhoto = galleryPhotos.length <= 1;
  modalPrev.disabled = singlePhoto;
  modalNext.disabled = singlePhoto;
}

function openModal(index) {
  currentPhotoIndex = index;
  renderModalPhoto();
  photoModal.showModal();
}

function showPrev() {
  if (!galleryPhotos.length) return;
  currentPhotoIndex = (currentPhotoIndex - 1 + galleryPhotos.length) % galleryPhotos.length;
  renderModalPhoto();
}

function showNext() {
  if (!galleryPhotos.length) return;
  currentPhotoIndex = (currentPhotoIndex + 1) % galleryPhotos.length;
  renderModalPhoto();
}

function renderEmpty(message) {
  publicGallery.innerHTML = `<p class="empty">${message}</p>`;
}

function renderGallery(photos) {
  publicGallery.innerHTML = "";
  galleryPhotos = photos;

  if (!photos.length) {
    renderEmpty("Aún no hay fotos aprobadas. ¡Sé el primero en compartir un momento!");
    return;
  }

  photos.forEach((photo, index) => {
    const card = cardTemplate.content.firstElementChild.cloneNode(true);
    card.querySelector("img").src = photo.imageUrl;
    card.querySelector(".meta").textContent = `${photo.author} · ${formatDate(photo.createdAt)}`;
    card.querySelector(".text").textContent = photo.message;

    card.addEventListener("click", () => openModal(index));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openModal(index);
      }
    });

    publicGallery.appendChild(card);
  });
}

modalPrev?.addEventListener("click", showPrev);
modalNext?.addEventListener("click", showNext);

modalImage.addEventListener("click", (event) => {
  const half = modalImage.clientWidth / 2;
  if (event.offsetX < half) {
    showPrev();
  } else {
    showNext();
  }
});

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

document.addEventListener("keydown", (event) => {
  if (!photoModal.open) return;
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    showPrev();
  }
  if (event.key === "ArrowRight") {
    event.preventDefault();
    showNext();
  }
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
