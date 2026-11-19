import ReactDOM from "react-dom/client";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { ThemeProvider } from "./contexts/ThemeContext.tsx";
import { Toaster } from "./components/ui/sonner.tsx";
import AppRouter from "./routes/router.tsx";

// Migrate the former automatic option to an explicit choice before the provider reads storage.
try {
  if (localStorage.getItem("oscar-dashboard-theme") === "system") {
    localStorage.setItem("oscar-dashboard-theme", "light");
  }
  const dark = localStorage.getItem("oscar-dashboard-theme") === "dark";
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
} catch {
  // Private browsing can make storage unavailable.
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <AuthProvider>
      <Toaster />
      <AppRouter />
    </AuthProvider>
  </ThemeProvider>
);
