import axios from "axios";
import { toast } from "sonner";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  timeout: 120000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Auth endpoints that should NOT trigger a session-expired redirect on 401
const AUTH_ENDPOINTS = ["/auth/login", "/auth/register"];

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Global error interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || "";
    const isAuthEndpoint = AUTH_ENDPOINTS.some((ep) => requestUrl.includes(ep));

    // Login/register flows handle their own toasts to avoid duplicate notifications.
    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    // Handle network errors (backend unreachable)
    if (!error.response) {
      toast.error("⚠️ Connection error", {
        description: "Cannot reach the server. Please check if the backend is running.",
      });
      return Promise.reject(error);
    }

    // Handle 401 — only redirect if NOT on a login/register endpoint
    if (error.response.status === 401 && !isAuthEndpoint) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        toast.error("⚠️ Session expired", {
          description: "Please log in again to continue.",
        });
        // Use a small delay so the toast is visible before redirect
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      }
    }

    // Handle 403
    if (error.response.status === 403) {
      toast.error("❌ Access denied", {
        description: "You don't have permission to perform this action.",
      });
    }

    // Handle 500+ server errors
    if (error.response.status >= 500) {
      toast.error("⚠️ Server error", {
        description: "Something went wrong on the server. Please try again later.",
      });
    }

    return Promise.reject(error);
  }
);

export default api;
