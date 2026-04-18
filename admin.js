import {
  approvePhoto,
  getAdminPhotos,
  loginAdmin,
  rejectPhoto,
  setPhotoVisibility,
} from "./api.js";
import { getAdminSession, setAdminSession } from "./storage.js";

const adminLoginPanel = document.getElementById("adminLoginPanel");
const adminPanel = document.getElementById("adminPanel");
const adminLoginForm = document.getElementById("adminLoginForm");
const adminUsernameInput = document.getElementById("adminUsername");
const adminPasswordInput = document.getElementById("adminPassword");
const adminList = document.getElementById("adminList");
const adminTemplate = document.getElementById("adminItemTemplate");
const adminStatus = document.getElementById("adminStatus");
const loginButton = adminLoginForm.querySelector("button[type='submit']");
const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));

let selectedFilter = "all";


function photoMatchesFilter(photo, filter) {
  const { isApproved, isRejected } = getPhotoState(photo);

  if (filter === "approved") return isApproved && !isRejected;
  if (filter === "rejected") return isRejected;

  return true;
}

function updateFilterButtons() {
  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === selectedFilter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function setAdminStatus(message, type = "info") {
  adminStatus.textContent = message;
  adminStatus.dataset.type = type;
}

function formatDate(isoDate) {
  if (!isoDate) return "Fecha no disponible";
  return new Date(isoDate).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" });
}

function getPhotoId(photo) {
  return photo.id;
}

function getPhotoState(photo) {
  const isApproved = Boolean(photo.isApproved ?? photo.approved ?? photo.status === "approved");
  const isRejected = Boolean(photo.isRejected ?? photo.status === "rejected");
  const isVisibleHome = Boolean(photo.isVisibleHome ?? photo.visible ?? false);

  return { isApproved, isRejected, isVisibleHome };
}

function setButtonLoading(button, loading, loadingText, defaultText) {
  button.disabled = loading;
  button.textContent = loading ? loadingText : defaultText;
}

function showAdminPanel() {
  adminLoginPanel.classList.add("hidden");
  adminPanel.classList.remove("hidden");
}

async function refreshAdminPhotos() {
  const session = getAdminSession();
  if (!session?.token) return;

  adminList.innerHTML = '<p class="empty">Cargando fotos...</p>';

  try {
    const response = await getAdminPhotos(session.token);
    const photos = Array.isArray(response) ? response : response.photos || [];
    renderAdminList(photos);
    setAdminStatus("Panel actualizado correctamente.", "success");
  } catch (error) {
    adminList.innerHTML = '<p class="empty">No se pudo cargar la lista de fotos.</p>';
    setAdminStatus(error.message || "Error al cargar fotos.", "error");
  }
}

function renderAdminList(photos) {
  adminList.innerHTML = "";

  if (!photos.length) {
    adminList.innerHTML = '<p class="empty">No hay fotos registradas todavía.</p>';
    return;
  }

  const filteredPhotos = photos.filter((photo) => photoMatchesFilter(photo, selectedFilter));

  if (!filteredPhotos.length) {
    const label = selectedFilter === "approved" ? "aprobadas" : "rechazadas";
    adminList.innerHTML = `<p class="empty">No hay fotos ${label} para mostrar.</p>`;
    return;
  }

  filteredPhotos.forEach((photo) => {
    const item = adminTemplate.content.firstElementChild.cloneNode(true);
    const state = getPhotoState(photo);

    item.querySelector("img").src = photo.thumbnailUrl || photo.imageUrl;
    item.querySelector(".meta").textContent = `${photo.participantName || "Invitado"} · ${formatDate(photo.createdAt)}`;
    item.querySelector(".text").textContent = photo.message || "Sin mensaje";
    item.querySelector(".badge").textContent = state.isRejected
      ? "Rechazada"
      : state.isApproved
        ? "Aprobada"
        : "Pendiente";

    const approveBtn = item.querySelector("[data-action='approve']");
    const rejectBtn = item.querySelector("[data-action='reject']");
    const visibilityToggle = item.querySelector("input[type='checkbox']");

    visibilityToggle.checked = state.isVisibleHome;
    visibilityToggle.disabled = !state.isApproved || state.isRejected;

    approveBtn.disabled = state.isApproved;
    rejectBtn.disabled = state.isRejected;

    approveBtn.addEventListener("click", async () => {
      const session = getAdminSession();
      if (!session?.adminId) return;
      setButtonLoading(approveBtn, true, "Aprobando...", "Aprobar");

      try {
        await approvePhoto(getPhotoId(photo), session.adminId, true, session.token);
        await refreshAdminPhotos();
      } catch (error) {
        setAdminStatus(error.message || "No se pudo aprobar la foto.", "error");
      } finally {
        setButtonLoading(approveBtn, false, "Aprobando...", "Aprobar");
      }
    });

    rejectBtn.addEventListener("click", async () => {
      const session = getAdminSession();
      if (!session?.adminId) return;
      setButtonLoading(rejectBtn, true, "Rechazando...", "Rechazar");

      try {
        await rejectPhoto(getPhotoId(photo), session.adminId, session.token);
        await refreshAdminPhotos();
      } catch (error) {
        setAdminStatus(error.message || "No se pudo rechazar la foto.", "error");
      } finally {
        setButtonLoading(rejectBtn, false, "Rechazando...", "Rechazar");
      }
    });

    visibilityToggle.addEventListener("change", async () => {
      const session = getAdminSession();
      visibilityToggle.disabled = true;

      try {
        await setPhotoVisibility(getPhotoId(photo), visibilityToggle.checked, session?.token);
        setAdminStatus("Visibilidad actualizada.", "success");
      } catch (error) {
        visibilityToggle.checked = !visibilityToggle.checked;
        setAdminStatus(error.message || "No se pudo actualizar la visibilidad.", "error");
      } finally {
        visibilityToggle.disabled = !getPhotoState(photo).isApproved;
      }
    });

    adminList.appendChild(item);
  });
}


filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedFilter = button.dataset.filter || "all";
    updateFilterButtons();
    refreshAdminPhotos();
  });
});

updateFilterButtons();

adminLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = adminUsernameInput.value.trim();
  const password = adminPasswordInput.value;

  if (!username || !password) {
    setAdminStatus("Ingresa usuario y contraseña.", "error");
    return;
  }

  setButtonLoading(loginButton, true, "Ingresando...", "Ingresar");
  setAdminStatus("Validando acceso...", "info");

  try {
    const response = await loginAdmin(username, password);
    setAdminSession({
      adminId: response.admin.id,
      username: response.admin.username,
      token: response.token,
    });

    showAdminPanel();
    await refreshAdminPhotos();
  } catch (error) {
    setAdminStatus(error.message || "No se pudo iniciar sesión.", "error");
  } finally {
    setButtonLoading(loginButton, false, "Ingresando...", "Ingresar");
  }
});

const adminSession = getAdminSession();
if (adminSession?.token) {
  showAdminPanel();
  refreshAdminPhotos();
}
