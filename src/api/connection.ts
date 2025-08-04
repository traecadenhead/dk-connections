// src/api/connection.ts

export async function createConnection(data: {
  member_id: string;
  connected_member_id: string;
}): Promise<void> {
  const response = await fetch(`${process.env.REACT_APP_API_URL}/connections`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("jwt")}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create connection");
  }
}
