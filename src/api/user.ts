// src/api/user.ts
import axios from "axios";

export async function getCurrentUser(jwt: string) {
  console.log("getting current user");
  const response = await axios.get(
    `${process.env.REACT_APP_API_URL}/member/me`,
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    }
  );
  console.log(response.data);
  return response.data;
}
