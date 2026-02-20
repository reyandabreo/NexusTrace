"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useAuditStore } from "@/store/auditStore";
import type { LoginRequest, RegisterRequest, AuthResponse, User } from "@/types/auth";

export function useLogin() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const addAuditLog = useAuditStore((s) => s.addAuditLog);

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const res = await api.post<AuthResponse>("/auth/login", data);
      return res.data;
    },
    onSuccess: async (data) => {
      // If user data is included in response, use it
      if (data.user) {
        setAuth(data.access_token, data.user);
        
        // Log successful login
        addAuditLog({
          user: data.user.username || data.user.email,
          userId: data.user.id,
          action: "LOGIN",
          resource: "Dashboard",
          status: "success",
          details: "Successful login from web interface",
        });
        
        toast.success("Login successful", {
          description: `Welcome back, ${data.user.username}`,
        });
      } else {
        // Fallback: Extract username from JWT payload (sub claim)
        try {
          const payload = JSON.parse(atob(data.access_token.split('.')[1]));
          let user: User = {
            id: payload.user_id || '',
            username: payload.sub || '',
            email: payload.email || '', // Try to get email from JWT
          };
          
          // If email is missing, try to fetch from user profile endpoint
          if (!user.email) {
            try {
              // Set token first so the interceptor can use it
              if (typeof window !== "undefined") {
                localStorage.setItem("access_token", data.access_token);
              }
              const profileRes = await api.get('/auth/me');
              if (profileRes.data?.email) {
                user.email = profileRes.data.email;
              }
            } catch (profileError) {
              // Profile fetch failed, continue with empty email
              console.warn("Could not fetch user profile:", profileError);
            }
          }
          
          setAuth(data.access_token, user);
          
          // Log successful login
          addAuditLog({
            user: user.username || user.email,
            userId: user.id,
            action: "LOGIN",
            resource: "Dashboard",
            status: "success",
            details: "Successful login from web interface",
          });
          
          toast.success("Login successful", {
            description: `Welcome back, ${user.username}`,
          });
        } catch (e) {
          // Last resort fallback
          setAuth(data.access_token, { id: '', username: 'User', email: '' });
          toast.success("Login successful");
        }
      }
      router.push("/dashboard");
    },
    onError: (error: any) => {
      const data = error.response?.data;
      let description = "Invalid credentials";
      
      // Handle Zod validation error (array)
      if (Array.isArray(data)) {
        description = data[0]?.msg || "Invalid credentials";
      }
      // Handle single validation error object
      else if (data && typeof data === "object" && data.msg) {
        description = data.msg;
      }
      // Handle API detail field
      else if (typeof data?.detail === "string") {
        description = data.detail;
      }
      
      // Log failed login attempt
      addAuditLog({
        user: "Unknown",
        userId: "unknown",
        action: "LOGIN",
        resource: "Dashboard",
        status: "failed",
        details: description,
        errorMessage: description,
      });
      
      toast.error("Login failed", { description });
    },
  });
}

export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const res = await api.post<AuthResponse>("/auth/register", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Account created", {
        description: "Please log in with your credentials",
      });
      router.push("/login");
    },
    onError: (error: any) => {
      const data = error.response?.data;
      let description = "Could not create account";
      
      // Handle Zod validation error (array)
      if (Array.isArray(data)) {
        description = data[0]?.msg || "Validation failed";
      }
      // Handle single validation error object
      else if (data && typeof data === "object" && data.msg) {
        description = data.msg;
      }
      // Handle API detail field
      else if (typeof data?.detail === "string") {
        description = data.detail;
      }
      
      toast.error("Registration failed", { description });
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const addAuditLog = useAuditStore((s) => s.addAuditLog);

  return () => {
    // Log logout before clearing the user data
    if (user) {
      addAuditLog({
        user: user.username || user.email,
        userId: user.id,
        action: "LOGOUT",
        resource: "Dashboard",
        status: "success",
        details: "User logged out successfully",
      });
    }
    
    logout();
    toast.success("Logged out");
    router.push("/login");
  };
}
