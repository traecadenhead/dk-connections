// src/api/member.ts
import axios from "axios";
import { MemberProfileResponse } from "../types";

export async function getCurrentMember(jwt: string) {
  const response = await axios.get(
    `${process.env.REACT_APP_API_URL}/member/me`,
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    }
  );
  return response.data;
}

export const getMemberProfileBatch = async (
  ids: string[]
): Promise<MemberProfileResponse[]> => {
  const response = await fetch(
    `${process.env.REACT_APP_API_URL}/member/profile/batch`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
      },
      body: JSON.stringify({ member_ids: ids }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update profile");
  }

  return response.json();
};

export const getMemberProfile = async (
  memberId: string
): Promise<MemberProfileResponse> => {
  const response = await axios.get(
    `${process.env.REACT_APP_API_URL}/member/profile/${memberId}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
      },
    }
  );
  return response.data;
};

export async function updateMemberProfile(data: {
  photo_url: string;
  bio: string;
  interests: string;
}): Promise<void> {
  const response = await fetch(
    `${process.env.REACT_APP_API_URL}/member/profile`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update profile");
  }
}
