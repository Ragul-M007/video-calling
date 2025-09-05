import { Navigate } from "react-router-dom";
import { useAuth } from "./useAuth";  // ✅ Import from useAuth.js

export default function PrivateRoute({ children, role }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/login" replace />;

  return children;
}
