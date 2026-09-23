import axios from "axios";

const api = axios.create({
  baseURL: "/ams",
  headers: {
    "Content-Type": "application/json"
  }
});

export default api;
