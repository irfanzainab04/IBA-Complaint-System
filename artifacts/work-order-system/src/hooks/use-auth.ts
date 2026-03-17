import { useEffect, useState } from "react";
import { useGetCurrentUser, useLogout, type User } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

export function useAuth() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: user, isLoading, isError, error } = useGetCurrentUser({
    query: {
      enabled: !!token,
      retry: false,
    }
  });

  const logoutMutation = useLogout({
    mutation: {
      onSettled: () => {
        localStorage.removeItem("token");
        setToken(null);
        queryClient.clear();
        setLocation("/login");
      }
    }
  });

  useEffect(() => {
    if (isError) {
      // If /api/auth/me fails (e.g. 401 Unauthorized), clear token
      localStorage.removeItem("token");
      setToken(null);
      queryClient.clear();
      setLocation("/login");
    }
  }, [isError, queryClient, setLocation]);

  const login = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    user: user as User | undefined,
    isAuthenticated: !!user,
    isLoading: isLoading && !!token,
    login,
    logout,
    isLoggingOut: logoutMutation.isPending
  };
}
