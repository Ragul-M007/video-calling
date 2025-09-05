import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import PrivateRoute from "./auth/PrivateRoute";
import Login from "./pages/Login";
import BuyerDashboard from "./modules/buyer/pages/BuyerDashboard";
import SellerDashboard from "./modules/seller/pages/SellerDashboard";
import AdminDashboard from "./modules/admin/pages/AdminDashboard";
import "./App.css";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/buyer"
            element={
              <PrivateRoute role="buyer">
                <BuyerDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/seller"
            element={
              <PrivateRoute role="seller">
                <SellerDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute role="admin">
                <AdminDashboard />
              </PrivateRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Login />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
