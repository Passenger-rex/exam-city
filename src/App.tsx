/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "motion/react";
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
import DevicesPage from "./pages/DevicesPage";
import { PageTransition } from "./components/PageTransition";
import { UserProvider } from "./UserContext";

import { SplashScreen } from "./components/SplashScreen";
import { DarkModeToggle } from "./components/DarkModeToggle";

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
            <PageTransition>
              <ExamPage />
            </PageTransition>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PageTransition>
              <Dashboard />
            </PageTransition>
          }
        />
        <Route
          path="/profile"
          element={
            <PageTransition>
              <ProfilePage />
            </PageTransition>
          }
        />
        <Route
          path="/review/:resultId"
          element={
            <PageTransition>
              <ReviewPage />
            </PageTransition>
          }
        />
        <Route
          path="/tutor"
          element={
            <PageTransition>
              <TutorPage />
            </PageTransition>
          }
        />
        <Route
          path="/admin"
          element={
            <PageTransition>
              <AdminPage />
            </PageTransition>
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
          path="/settings/devices"
          element={
            <PageTransition>
              <DevicesPage />
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
