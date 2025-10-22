"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";

export function useHydrateUser() {
  const { setUser, setToken } = useAuthStore();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
  }, [setUser, setToken]);
}
