import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import Snackbar from "@mui/material/Snackbar";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { AuthContext } from "../contexts/AuthContext";
import wallpaper from "../Assests/image2.png";

const defaultTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

export default function Authentication() {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [formState, setFormState] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const { handleRegister, handleLogin } = React.useContext(AuthContext);

  const handleAuth = async () => {
    try {
      if (formState === 0) {
        await handleLogin(username, password);
      }

      if (formState === 1) {
        const result = await handleRegister(
          name,
          username,
          password
        );

        setMessage(result);
        setOpen(true);

        setName("");
        setUsername("");
        setPassword("");
        setError("");

        setFormState(0);
      }
    } catch (err) {
      console.log(err);

      const message =
        err?.response?.data?.message ||
        "Something went wrong";

      setError(message);
    }
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <CssBaseline />
      <Grid
        container
        component="main"
        wrap="nowrap"
        sx={{
          width: "100%",
          height: "100vh",
          overflow: "hidden",
          background:
            "linear-gradient(to right,rgb(15, 23, 42),rgb(30, 41, 59))",
        }}
      >

        <Grid
          item
          xs={12}
          md={6}
          sx={{
            boxSizing: "border-box",
            height: "100vh",
            minWidth: 0,
            overflow: "hidden",

            display: { xs: "none", md: "flex" },
            flexDirection: "column",

            flex: { md: "0 0 50%" },
            maxWidth: { md: "50%" },
          }}
        >
          <Box
            component="img"
            src={wallpaper}
            alt="Wallpaper"
            sx={{
              width: "100%",
              height: "100%",
              minHeight: "100vh",
              flex: 1,
              objectFit: "cover",
              display: "block",
            }}
          />
        </Grid>

        <Grid
          item
          xs={12}
          md={6}
          component={Paper}
          elevation={0}
          square
          sx={{
            boxSizing: "border-box",
            height: "100vh",
            minHeight: 0,
            minWidth: 0,
            overflowY: "auto",

            background: "#111827",

            display: "flex",
            justifyContent: "center",
            alignItems: "center",

            flex: { xs: "1 1 100%", md: "0 0 50%" },
            maxWidth: { xs: "100%", md: "50%" },

            p: { xs: 3, sm: 4 },
          }}
        >
          <Box
            sx={{
              flex: "0 0 auto",
              width: "min(100%, 400px)",
              maxWidth: 400,
              alignSelf: "center",
              p: { xs: 3.5, sm: 4.5 },
              borderRadius: "22px",

              background: "#1f2937",

              backdropFilter: "blur(18px)",

              border: "1px solid rgba(255,255,255,0.1)",

              boxShadow:
                "0 8px 32px rgba(0,0,0,0.35)",
            }}
          >

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                mb: 2.5,
              }}
            >
              <Avatar
                sx={{
                  width: 54,
                  height: 54,
                  bgcolor: "#7c3aed",
                  mb: 2,
                }}
              >
                <LockOutlinedIcon sx={{ fontSize: 28 }} />
              </Avatar>

              <Typography
                variant="h5"
                sx={{
                  fontWeight: "bold",
                  fontSize: "1.35rem",
                  color: "white",
                }}
              >
                {formState === 0
                  ? "Welcome Back"
                  : "Create Account"}
              </Typography>

            </Box>

            <Box
              sx={{
                display: "flex",
                gap: 2,
                mb: 2.5,
                width: "100%",
              }}
            >
              <Button
                variant={
                  formState === 0
                    ? "contained"
                    : "outlined"
                }
                onClick={() => setFormState(0)}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  borderRadius: "12px",
                  py: 1.1,
                  fontSize: "0.9rem",
                  ...(formState !== 0 && {
                    color: "#e5e7eb",
                    borderColor: "rgba(255,255,255,0.35)",
                    "&:hover": {
                      borderColor: "rgba(255,255,255,0.55)",
                      backgroundColor: "rgba(255,255,255,0.06)",
                    },
                  }),
                }}
              >
                Sign In
              </Button>

              <Button
                variant={
                  formState === 1
                    ? "contained"
                    : "outlined"
                }
                onClick={() => setFormState(1)}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  borderRadius: "12px",
                  py: 1.1,
                  fontSize: "0.9rem",
                  ...(formState !== 1 && {
                    color: "#e5e7eb",
                    borderColor: "rgba(255,255,255,0.35)",
                    "&:hover": {
                      borderColor: "rgba(255,255,255,0.55)",
                      backgroundColor: "rgba(255,255,255,0.06)",
                    },
                  }),
                }}
              >
                Sign Up
              </Button>
            </Box>

            <Box component="form" noValidate>
              {formState === 1 && (
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Full Name"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  sx={textFieldStyle}
                />
              )}

              <TextField
                margin="normal"
                required
                fullWidth
                label="Email Address"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                sx={textFieldStyle}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                sx={textFieldStyle}
              />

              {error && (
                <Typography
                  sx={{
                    color: "#ff6b6b",
                    mt: 1,
                    fontSize: "14px",
                  }}
                >
                  {error}
                </Typography>
              )}

              <Button
                fullWidth
                variant="contained"
                onClick={handleAuth}
                sx={{
                  mt: 3.5,
                  py: 1.4,
                  borderRadius: "14px",
                  fontWeight: "bold",
                  fontSize: "0.95rem",

                  background:
                    "linear-gradient(90deg,#7c3aed,#2563eb)",

                  "&:hover": {
                    background:
                      "linear-gradient(90deg,#6d28d9,#1d4ed8)",
                  },
                }}
              >
                {formState === 0
                  ? "LOGIN"
                  : "CREATE ACCOUNT"}
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>

      <Snackbar
        open={open}
        autoHideDuration={4000}
        message={message}
        onClose={() => setOpen(false)}
      />
    </ThemeProvider>
  );
}

const textFieldStyle = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "14px",
    background: "rgba(255,255,255,0.05)",
    color: "white",

    "& fieldset": {
      borderColor: "rgba(255,255,255,0.1)",
    },

    "&:hover fieldset": {
      borderColor: "#7c3aed",
    },

    "&.Mui-focused fieldset": {
      borderColor: "#7c3aed",
    },
  },

  "& .MuiInputLabel-root": {
    color: "rgba(255,255,255,0.7)",
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: "#a78bfa",
  },
};