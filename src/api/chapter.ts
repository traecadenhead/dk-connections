import axios from "axios";
import { Chapter } from "../types";
import { REACT_APP_API_URL } from "../constants";

export const getChapters = async (): Promise<Chapter[]> => {
  const response = await axios.get(`${REACT_APP_API_URL}/chapters`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("jwt")}`,
    },
  });
  return response.data;
};
