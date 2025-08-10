// src/api/connection.ts
import { MemberConnectionResponse } from "../types";
import { REACT_APP_API_URL } from "../constants";

export async function createConnection(data: {
  member_id: string;
  connected_member_id: string;
}): Promise<void> {
  const response = await fetch(`${REACT_APP_API_URL}/connections`, {
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

export async function removeConnection(data: {
  member_id: string;
  connected_member_id: string;
}): Promise<void> {
  const response = await fetch(
    `${REACT_APP_API_URL}/connections/${data.member_id}/${data.connected_member_id}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to remove connection");
  }
}

export async function getMemberConnections(
  memberId: string
): Promise<MemberConnectionResponse[]> {
  const response = await fetch(`${REACT_APP_API_URL}/connections/${memberId}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("jwt")}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch connections");
  }

  return response.json();
}
