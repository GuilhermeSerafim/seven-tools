// seven_tools_front/src/lib/apiClient.ts
import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

const TOKEN_KEY = "seventools_token";

// --- Case conversion helpers ---

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function convertKeys(obj: unknown, converter: (key: string) => string): unknown {
  if (Array.isArray(obj)) {
    return obj.map((item) => convertKeys(item, converter));
  }
  if (obj !== null && typeof obj === "object" && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([key, value]) => [
        converter(key),
        convertKeys(value, converter),
      ])
    );
  }
  return obj;
}

// --- Axios instance ---

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: attach token + convert keys to snake_case
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data && typeof config.data === "object" && !(config.data instanceof FormData)) {
    config.data = convertKeys(config.data, toSnakeCase);
  }
  return config;
});

// Response interceptor: convert keys to camelCase + handle errors
api.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === "object") {
      response.data = convertKeys(response.data, toCamelCase);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      const hadToken = !!localStorage.getItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_KEY);
      if (hadToken) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// --- Token management ---

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export default api;
