import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../UserContext";
import { auth } from "../firebase";
import { Logo } from "./Logo";
import {
  BookOpen,
  Sparkles,
  User as UserIcon,
  Shield,
  LogOut,
  Menu,
  X,
  Zap,
  Award,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useUser();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Sign out error", error);
      setIsSigningOut(false);
    }
  };

  const isAdmin = user.email?.toLowerCase() === "johntobismart@gmail.com";

  const menuItems = [
    {
      path: "/admin",
      name: "Admin Center",
      icon: Shield,
    },
  ].filter(item => isAdmin || item.path !== "/admin");

  const userInitial = user.email?.charAt(0).toUpperCase() || "S";
  const userDisplayName = profile?.name || user.displayName || (user.email ? user.email.split("@")[0].split(/[^a-zA-Z]/).map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).filter(Boolean).join(" ") : "Student Scholar");

  return (
    <header className="hidden md:block sticky top-0 z-[60] bg-surface/90 backdrop-blur-md border-b border-outline-variant/30 w-full select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2">
              <Logo className="text-xl md:text-2xl" />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5 ml-4">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-on-surface-variant hover:text-on-surface hover:bg-surface-dim"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-on-surface-variant/70"}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Badge, User Info, Actions */}
          <div className="hidden md:flex items-center gap-6 pl-4">
            <div className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-md border ${profile?.tier === "pro" ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
              {profile?.tier === "pro" ? "PRO" : "FREE"}
            </div>

            <div 
              onClick={() => navigate("/profile")}
              className="flex items-center gap-3 pl-6 border-l border-outline-variant/30 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="text-right hidden lg:block">
                <p className="text-xs font-bold text-on-surface">
                  {userDisplayName}
                </p>
                <p className="text-[10px] text-on-surface-variant opacity-70">
                  {user.email?.toLowerCase()}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-surface-dim text-primary flex items-center justify-center font-bold text-sm border border-outline-variant transition-colors hover:border-primary/50" title={user.email || ""}>
                {userInitial}
              </div>
            </div>

            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="p-2.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/5 transition-all cursor-pointer border border-transparent hover:border-error/20"
            >
              {isSigningOut ? (
                <div className="w-4 h-4 border-2 border-on-surface-variant border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogOut className="w-4.5 h-4.5" />
              )}
            </button>
          </div>

          {/* Mobile Menu Actions Button */}
          <div className="flex md:hidden items-center gap-3">
            {profile?.tier !== "pro" && (
              <button
                onClick={() => navigate("/profile")}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20 cursor-pointer"
              >
                <Award className="w-3 h-3 text-amber-500" />
                <span>Get Pro</span>
              </button>
            )}

            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${profile?.tier === "pro" ? "bg-amber-100 text-amber-800" : "bg-surface-dim text-on-surface-variant"}`}>
              {profile?.tier === "pro" ? "PRO" : "FREE"}
            </span>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-dim rounded-xl transition-all cursor-pointer border border-outline-variant/30"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-outline-variant/20 bg-surface/95 backdrop-blur-md overflow-hidden"
          >
            <div className="px-4 py-3 space-y-2">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 p-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-primary text-white shadow-md shadow-primary/15"
                        : "text-on-surface-variant hover:text-on-surface hover:bg-surface-dim"
                    }`}
                  >
                    <Icon className={`w-4.5 h-4.5 ${isActive ? "text-white" : "text-primary"}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              <div className="border-t border-outline-variant/20 pt-2 mt-2">
                <div className="flex items-center gap-3 p-3 text-on-surface-variant">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/10">
                    {userInitial}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-on-surface truncate">{userDisplayName}</p>
                    <p className="text-[10px] text-on-surface-variant truncate">{user.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  disabled={isSigningOut}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-sm font-semibold text-error hover:bg-error/5 transition-all text-left cursor-pointer"
                >
                  {isSigningOut ? (
                    <div className="w-4 h-4 border-2 border-error border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <LogOut className="w-4.5 h-4.5" />
                  )}
                  <span>Log Out of Account</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
