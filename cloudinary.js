import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_FOLDER,
  CLOUDINARY_UPLOAD_PRESET,
} from "./config.js";

export async function uploadImageToCloudinary(file) {
  if (!CLOUDINARY_CLOUD_NAME || CLOUDINARY_CLOUD_NAME === "YOUR_CLOUD_NAME") {
    throw new Error("Configura CLOUDINARY_CLOUD_NAME en config.js");
  }

  if (!CLOUDINARY_UPLOAD_PRESET || CLOUDINARY_UPLOAD_PRESET === "YOUR_UPLOAD_PRESET") {
    throw new Error("Configura CLOUDINARY_UPLOAD_PRESET en config.js");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", CLOUDINARY_FOLDER);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "No se pudo subir la imagen a Cloudinary.");
  }

  return {
    secureUrl: data.secure_url,
    thumbnailUrl: data.secure_url,
    originalFilename: data.original_filename || file.name,
    fileSize: data.bytes || file.size,
    mimeType: file.type || (data.format ? `image/${data.format}` : "image/jpeg"),
    format: data.format || "jpg",
  };
}
