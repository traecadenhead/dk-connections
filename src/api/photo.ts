// src/api/photo.ts
import { REACT_APP_API_URL } from "../constants";

export async function uploadMemberPhoto(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${REACT_APP_API_URL}/member/photo`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("jwt")}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Photo upload failed");
  }

  const data = await response.json();
  return data.photo_url;
}
