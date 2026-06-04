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
import { PageTransition } from "./components/PageTransition";
import { UserProvider } from "./UserContext";

import { SplashScreen } from "./components/SplashScreen";
import { DarkModeToggle } from "./components/DarkModeToggle";

// Helper to retrieve permanent device footprint
export const getDeviceId = () => {
  let id = localStorage.getItem("deviceId");
  if (!id) {
    id = "dvc_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem("deviceId", id);
  }
  return id;
};

// Route wrapper that enforces authentication and device validation
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setAuthorized(false);
        setChecking(false);
        return;
      }

      try {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);
        const currentDeviceId = getDeviceId();
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const trustedDevices = userData?.trustedDevices || [];

          if (trustedDevices.includes(currentDeviceId)) {
            setAuthorized(true);
          } else {
            console.warn("Unrecognized device blocked in ProtectedRoute:", currentDeviceId);
            setAuthorized(false);
          }
        } else {
          // Profile doc does not exist yet! Securely create it on-the-fly for them initializing their original device
          await setDoc(userDocRef, {
            name: user.displayName || user.email?.split("@")[0] || "User",
            email: user.email,
            trustedDevices: [currentDeviceId],
            createdAt: serverTimestamp(),
          });
          setAuthorized(true);
        }
      } catch (err) {
        console.error("Error checking device authorization:", err);
        // Do NOT authorize the user on error/failures as that permits effortless credentials bypass. Keep them restricted.
        setAuthorized(false);
      } finally {
        setChecking(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center text-on-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold tracking-tight">Securing session...</p>
        </div>
      </div>
    );
  }

  if (!auth.currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!authorized) {
    // Force untrusted device to authenticate via device verification loop
    return <Navigate to="/login?reason=unrecognized_device" replace state={{ from: location, email: auth.currentUser.email }} />;
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
            <ProtectedRoute>
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
