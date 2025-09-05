import { useEffect } from "react";
import { useAuth } from "../auth/useAuth";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Formik, Form } from "formik";
import { loginValidationSchema } from "../validation/authValidation";
import FormikTextField from "../components/form/FormikTextField";

// MUI
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
} from "@mui/material";
import AppleIcon from "@mui/icons-material/Apple";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(`/${user.role}`);
    }
  }, [user, navigate]);

  const handleSubmit = (values, { setSubmitting }) => {
    const loggedInUser = login(values.username, values.password);

    if (loggedInUser) {
      toast.success(`Welcome ${loggedInUser.name}`);
      navigate(`/${loggedInUser.role}`);
    } else {
      toast.error("Invalid credentials");
    }
    setSubmitting(false);
  };

  const handleAppleLogin = async () => {
    try {
      const response = await window.AppleID.auth.signIn();
      const id_token = response.authorization.id_token;

      // Send token to backend
      const res = await fetch("http://localhost:4000/auth/apple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token }),
      });

      const data = await res.json();

      if (data.token) {
        toast.success("Apple Login Success!");
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);
        navigate(`/${data.user.role}`);
      } else {
        toast.error("Apple login failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Apple login error");
    }
  };

  return (
    <Container maxWidth="sm" sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Card sx={{ width: "100%", borderRadius: 3, boxShadow: 6 }}>
        <CardContent sx={{ p: 5 }}>
          <Typography variant="h4" align="center" fontWeight="bold" gutterBottom>
            Welcome Back
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" mb={3}>
            Please sign in to continue
          </Typography>

          {/* Formik Form */}
          <Formik initialValues={{ username: "", password: "" }} validationSchema={loginValidationSchema} onSubmit={handleSubmit}>
            {({ isSubmitting }) => (
              <Form>
                <FormikTextField name="username" label="Username" />
                <FormikTextField name="password" type="password" label="Password" />

                <Button type="submit" variant="contained" fullWidth disabled={isSubmitting} sx={{ mt: 2, py: 1.5, fontWeight: "bold", backgroundColor: "#000", "&:hover": { backgroundColor: "#333" } }}>
                  {isSubmitting ? "Logging in..." : "Login"}
                </Button>
              </Form>
            )}
          </Formik>

          <Divider sx={{ my: 4 }}>or</Divider>

          {/* Apple Login Button */}
          <Button fullWidth variant="contained" startIcon={<AppleIcon />} onClick={handleAppleLogin} sx={{ backgroundColor: "#000", color: "#fff", textTransform: "none", fontWeight: "bold", py: 1.5, "&:hover": { backgroundColor: "#333" } }}>
            Continue with Apple
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
}
