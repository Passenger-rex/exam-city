/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import React, { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

import LandingPage from "./pages/LandingPage";
import ExamPage from "./pages/ExamPage";
import Dashboard from "./pages/Dashboard";
import ReviewPage from "./pages/ReviewPage";
import AdminPage from "./pages/AdminPage";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import CheckoutPage from "./pages/CheckoutPage";
import TutorPage from "./pages/TutorPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import VerifyLoginPage from "./pages/VerifyLoginPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import DevicesPage from "./pages/DevicesPage";
import ArticleListPage from "./pages/ArticleListPage";
import ArticleDetailPage from "./pages/ArticleDetailPage";
import { PageTransition } from "./components/PageTransition";
import { UserProvider } from "./UserContext";

import { SplashScreen } from "./components/SplashScreen";
import { DarkModeToggle } from "./components/DarkModeToggle";
import { AppSkeleton } from "./components/Skeleton";

// Helper to retrieve permanent device footprint
export const getDeviceId = () => {
  let id = localStorage.getItem("deviceId");
  if (!id) {
    id = "dvc_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem("deviceId", id);
  }
  return id;
};

// Route wrapper that enforces authentication
function ProtectedRoute({ children, allowGuests = false }: { children: React.ReactNode; allowGuests?: boolean }) {
  const [checking, setChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      setChecking(false);
    });

    return () => unsub();
  }, []);

  if (checking) {
    return <AppSkeleton />;
  }

  if (!auth.currentUser) {
    if (allowGuests) {
      return <>{children}</>;
    }
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageTransition>
              <LandingPage />
            </PageTransition>
          }
        />
        <Route
          path="/login"
          element={
            <PageTransition>
              <AuthPage />
            </PageTransition>
          }
        />
        <Route
          path="/signup"
          element={
            <PageTransition>
              <AuthPage />
            </PageTransition>
          }
        />
        <Route
          path="/checkout"
          element={
            <PageTransition>
              <CheckoutPage />
            </PageTransition>
          }
        />
        <Route
          path="/exam"
          element={
            <ProtectedRoute allowGuests={true}>
              <PageTransition>
                <ExamPage />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <PageTransition>
                <Dashboard />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <PageTransition>
                <ProfilePage />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/review/:resultId"
          element={
            <ProtectedRoute>
              <PageTransition>
                <ReviewPage />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutor"
          element={
            <ProtectedRoute>
              <PageTransition>
                <TutorPage />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <PageTransition>
                <AdminPage />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/privacy"
          element={
            <PageTransition>
              <PrivacyPage />
            </PageTransition>
          }
        />
        <Route
          path="/terms"
          element={
            <PageTransition>
              <TermsPage />
            </PageTransition>
          }
        />
        <Route
          path="/verify-login"
          element={
            <PageTransition>
              <VerifyLoginPage />
            </PageTransition>
          }
        />
        <Route
          path="/verify-email"
          element={
            <PageTransition>
              <VerifyEmailPage />
            </PageTransition>
          }
        />
        <Route
          path="/settings/devices"
          element={
            <ProtectedRoute>
              <PageTransition>
                <DevicesPage />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/articles"
          element={
            <PageTransition>
              <ArticleListPage />
            </PageTransition>
          }
        />
        <Route
          path="/articles/:slug"
          element={
            <PageTransition>
              <ArticleDetailPage />
            </PageTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <SplashScreen />
        <DarkModeToggle />
        <AnimatedRoutes />
      </BrowserRouter>
    </UserProvider>
  );
}
