// src/api/conversation.ts
import { ConversationType } from "../types";

export async function createConversation(data: {
  type: ConversationType;
  name: string;
  chapter_id?: string;
  is_read_only: boolean;
}): Promise<void> {
  const response = await fetch(
    `${process.env.REACT_APP_API_URL}/conversations`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create conversation");
  }
}
