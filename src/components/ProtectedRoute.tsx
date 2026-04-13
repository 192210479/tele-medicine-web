import React from "react";
import { Navigate } from "react-router-dom";
import { getAuth } from "../utils/auth";

interface Props {
  children: React.ReactNode;
  allowedRoles: ("patient" | "doctor" | "admin")[];
}

export function ProtectedRoute({ children, allowedRoles }: Props) {
  const auth = getAuth();
  if (!auth) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(auth.role)) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default ProtectedRoute;
