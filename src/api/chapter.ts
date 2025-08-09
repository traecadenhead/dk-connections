import axios from "axios";
import { Chapter } from "../types";

export const getChapters = async (): Promise<Chapter[]> => {
  const response = await axios.get(
    `${process.env.REACT_APP_API_URL}/chapters`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
      },
    }
  );
  return response.data;
};
