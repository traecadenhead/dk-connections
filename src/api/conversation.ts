// src/api/conversation.ts
import { ConversationType, MemberConversation } from "../types";

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

export async function removeConversation(
  conversationSid: string
): Promise<void> {
  const response = await fetch(
    `${process.env.REACT_APP_API_URL}/conversations/${conversationSid}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
      },
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to delete conversation");
  }
}

export async function getChapterConversations(
  chapterId: string
): Promise<MemberConversation[]> {
  const response = await fetch(
    `${process.env.REACT_APP_API_URL}/conversations/chapter/${chapterId}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
      },
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch chapter conversations");
  }

  return response.json();
}

export async function getNationalConversations(): Promise<
  MemberConversation[]
> {
  const response = await fetch(
    `${process.env.REACT_APP_API_URL}/conversations/national`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
      },
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch national conversations");
  }

  return response.json();
}

export async function getConversationBySid(
  conversation_sid: string
): Promise<MemberConversation> {
  const response = await fetch(
    `${process.env.REACT_APP_API_URL}/conversations/${conversation_sid}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
      },
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch conversation");
  }

  return response.json();
}

export async function addConversationParticipant(
  conversationSid: string,
  memberId: string
): Promise<void> {
  const response = await fetch(
    `${process.env.REACT_APP_API_URL}/conversations/${conversationSid}/participants/${memberId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
      },
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to add participant to conversation");
  }
}

export async function removeConversationParticipant(
  conversationSid: string,
  memberId: string
): Promise<void> {
  const response = await fetch(
    `${process.env.REACT_APP_API_URL}/conversations/${conversationSid}/participants/${memberId}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
      },
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err.detail || "Failed to remove participant from conversation"
    );
  }
}

export async function addConversationAdmin(
  conversationSid: string,
  memberId: string
): Promise<void> {
  const response = await fetch(
    `${process.env.REACT_APP_API_URL}/conversations/${conversationSid}/admins/${memberId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
      },
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to add admin to conversation");
  }
}

export async function updateConversationName(
  conversationSid: string,
  name: string
): Promise<void> {
  const response = await fetch(
    `${process.env.REACT_APP_API_URL}/conversations/${conversationSid}/name`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
      },
      body: JSON.stringify({ name: name }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update conversation name");
  }
}
