import axios from "axios";
import { cookies } from "next/headers";

export const axiosInstance = axios.create({
  baseURL: process.env.API_BASE_URL,
  timeout: 10000,
});

axiosInstance.interceptors.request.use(async (config) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("hq_access_token")?.value;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
