import React from "react";
import ReactDOM from "react-dom/client";
import "./globals.css";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { Toaster } from "sonner";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute.tsx";
import Login from "./pages/login/index.tsx";
import AppRouter from "./routes/router.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <Toaster />
      <AppRouter />
    </AuthProvider>
  </React.StrictMode>
);
