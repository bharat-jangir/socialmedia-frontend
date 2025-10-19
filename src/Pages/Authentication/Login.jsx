import { ErrorMessage, Field, Form, Formik } from "formik";
import { TextField, Button, Alert, Snackbar, Grid, Card } from "@mui/material";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, getUserProfile } from "../../state/Auth/authActions";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import ImageCarousel from "../../components/ImageCarousel";
import { useThemeContext } from "../../context/ThemeContext";
import { IconButton, Tooltip } from "@mui/material";
import { LightMode, DarkMode } from "@mui/icons-material";

const initialValues = {
  email: "",
  password: "",
};

const validationSchema = Yup.object({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, jwt } = useSelector((state) => state.auth);
  const { mode, toggleTheme } = useThemeContext();

  const [showErrorAlert, setShowErrorAlert] = useState(false);

  // Carousel images array
  const carouselImages = [
    "/carousel-images/1.png",
    "/carousel-images/2.png",
    "/carousel-images/3.png",
    "/carousel-images/4.png",
  ];

  // Handle successful login - fetch user profile and redirect
  useEffect(() => {
    if (jwt && !loading && !error) {
      // Dispatch getUserProfile to fetch user data
      dispatch(getUserProfile(jwt));
      // The App.jsx will handle the redirect based on user state
    }
  }, [jwt, loading, error, dispatch]);

  // Handle login error
  useEffect(() => {
    if (error && !loading) {
      setShowErrorAlert(true);
    }
  }, [error, loading]);

  const handleSubmit = async (values) => {
    try {
      console.log("handle submit", values);
      await dispatch(loginUser({ data: values }));
    } catch (error) {
      // Handle error
      console.error("Error:", error);
    }
  };

  return (
    <div>
      {/* Theme Toggle Button */}
      <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>
        <IconButton
          onClick={toggleTheme}
          sx={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 1000,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            color: mode === 'dark' ? '#FF6B6B' : '#1976d2',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 1)',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
        >
          {mode === 'dark' ? <LightMode /> : <DarkMode />}
        </IconButton>
      </Tooltip>

      <Grid container className="h-screen">
        {/* Image Carousel Section - Hidden on mobile, visible on medium+ screens */}
        <Grid
          item
          xs={0}
          md={7}
          sx={{ display: { xs: "none", md: "block" } }}
        >
          <ImageCarousel 
            images={carouselImages}
            autoPlay={true}
            interval={4000}
          />
        </Grid>

        {/* Form Section - Full width on mobile, 5 columns on medium+ screens */}
        <Grid item xs={12} md={5}>
          <div className="px-4 sm:px-8 md:px-12 lg:px-20 flex flex-col justify-center h-screen">
            <Card className="card p-4 sm:p-6 md:p-8">
              <div className="flex flex-col items-center mb-5 space-y-1">
                <h1 className="logo text-center text-2xl sm:text-3xl md:text-4xl">
                  ChatterBox
                </h1>
                <p className="text-center text-xs sm:text-sm w-[90%] sm:w-[80%] md:w-[70%]">
                  Connecting Lives, Sharing Stories: Your World, Your Way
                </p>
              </div>

              <Formik
                onSubmit={handleSubmit}
                initialValues={initialValues}
                validationSchema={validationSchema}
              >
                <Form className="space-y-5">
                  <div className="space-y-5">
                    <div>
                      <Field
                        as={TextField}
                        name="email"
                        placeholder="Email here"
                        type="email"
                        variant="outlined"
                        fullWidth
                      />

                      <ErrorMessage
                        name="email"
                        component={"div"}
                        className="text-red-500"
                      />
                    </div>

                    <div>
                      <Field
                        as={TextField}
                        name="password"
                        placeholder="Password here"
                        type="password"
                        variant="outlined"
                        fullWidth
                      />

                      <ErrorMessage
                        name="password"
                        component={"div"}
                        className="text-red-500"
                      />
                    </div>
                  </div>
                  <Button
                    sx={{ padding: ".8rem 0rem" }}
                    fullWidth
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : "Login"}
                  </Button>
                </Form>
              </Formik>

              <div className="flex gap-2 items-center justify-center pt-5">
                <p>Don't have an account?</p>
                <Button onClick={() => navigate("/register")}>Register</Button>
              </div>
            </Card>
          </div>
        </Grid>
      </Grid>

      {/* Error Alert */}
      <Snackbar
        open={showErrorAlert}
        autoHideDuration={4000}
        onClose={() => setShowErrorAlert(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setShowErrorAlert(false)}
          severity="error"
          sx={{ width: "100%" }}
        >
          {error?.message ||
            "Login failed. Please check your credentials."}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default Login;
