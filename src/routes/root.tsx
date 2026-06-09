import React, { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";

export function RootRedirect() {
  const { profile, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && profile) {
      if (profile.role === "ADMIN") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [profile, isLoading, navigate]);

  if (isLoading) {
    return <div className="flex justify-center mt-20">Loading...</div>;
  }

  return null; // The useEffect will handle the redirect
}
