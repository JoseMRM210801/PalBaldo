const STORAGE_KEY = "palbaldo_album_entries_v1";

const uploadForm = document.getElementById("uploadForm");
const authorInput = document.getElementById("author");
const photoInput = document.getElementById("photo");
const messageInput = document.getElementById("message");
const adminList = document.getElementById("adminList");
const publicGallery = document.getElementById("publicGallery");
const adminTemplate = document.getElementById("adminItemTemplate");
const cardTemplate = document.getElementById("cardTemplate");

function loadEntries() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function uid() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleString("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function render() {
  const entries = loadEntries();

  adminList.innerHTML = "";
  publicGallery.innerHTML = "";

  if (!entries.length) {
    adminList.innerHTML = '<p class="empty">Aún no hay fotos cargadas.</p>';
    publicGallery.innerHTML = '<p class="empty">No hay fotos publicadas todavía.</p>';
    return;
  }

  entries.forEach((entry) => {
    const adminItem = adminTemplate.content.firstElementChild.cloneNode(true);
    adminItem.querySelector("img").src = entry.imageData;
    adminItem.querySelector(".meta").textContent = `${entry.author} · ${formatDate(entry.createdAt)}`;
    adminItem.querySelector(".text").textContent = entry.message;

    const toggle = adminItem.querySelector("input[type='checkbox']");
    toggle.checked = Boolean(entry.visible);
    toggle.addEventListener("change", () => {
      const updated = loadEntries().map((item) =>
        item.id === entry.id ? { ...item, visible: toggle.checked } : item
      );
      saveEntries(updated);
      render();
    });

    adminList.appendChild(adminItem);

    if (entry.visible) {
      const card = cardTemplate.content.firstElementChild.cloneNode(true);
      card.querySelector("img").src = entry.imageData;
      card.querySelector(".meta").textContent = `${entry.author} · ${formatDate(entry.createdAt)}`;
      card.querySelector(".text").textContent = entry.message;
      publicGallery.appendChild(card);
    }
  });

  if (!publicGallery.children.length) {
    publicGallery.innerHTML = '<p class="empty">Hay fotos cargadas, pero ninguna está aprobada para mostrarse.</p>';
  }
}

uploadForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const file = photoInput.files?.[0];

  if (!file) {
    alert("Debes seleccionar una foto.");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const entries = loadEntries();
    entries.unshift({
      id: uid(),
      author: authorInput.value.trim(),
      message: messageInput.value.trim(),
      imageData: String(reader.result),
      visible: false,
      createdAt: new Date().toISOString(),
    });

    saveEntries(entries);
    uploadForm.reset();
    render();
  };

  reader.readAsDataURL(file);
});

render();
