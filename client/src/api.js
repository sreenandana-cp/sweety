import axios from "axios";

const api = axios.create({ baseURL: "http://127.0.0.1:5001" });

// Add the login token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
