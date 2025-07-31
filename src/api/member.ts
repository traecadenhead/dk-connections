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
