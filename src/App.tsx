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
import { PageTransition } from "./components/PageTransition";
import { UserProvider } from "./UserContext";

import { SplashScreen } from "./components/SplashScreen";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      {/* @ts-expect-error: key is needed by AnimatePresence */}
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
          path="/admin"
          element={
            <PageTransition>
              <AdminPage />
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
        <AnimatedRoutes />
      </BrowserRouter>
    </UserProvider>
  );
}
