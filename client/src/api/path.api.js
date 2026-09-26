import { request } from "./http.js";

export const createPath = (values) =>
  request("/api/paths", { method: "POST", body: values, auth: true });

export const listPaths = () => request("/api/paths", { auth: true });

export const getPath = (id) => request(`/api/paths/${id}`, { auth: true });
