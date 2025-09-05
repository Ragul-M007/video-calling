import { useContext } from "react";
import { AuthContext } from "./AuthContext";

// Custom hook for consuming AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
};
