import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../UserContext";
import { auth } from "../firebase";
import {
  Trophy,
  BookOpen,
  User as UserIcon,
  Zap,
  Sparkles,
  Database,
  LogOut,
  ChevronRight,
  Shield,
  HelpCircle,
} from "lucide-react";
import { Logo } from "./Logo";

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useUser();
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (!user) return null;

  const menuItems = [
    {
      path: "/dashboard",
      name: "Dashboard",
      icon: BookOpen,
      color: "text-primary bg-primary/5",
    },
    {
      path: "/tutor",
      name: "AI Study Coach",
      icon: Sparkles,
      color: "text-amber-500 bg-amber-500/5",
    },
    {
      path: "/profile",
      name: "Profile Settings",
      icon: UserIcon,
      color: "text-blue-500 bg-blue-500/5",
    },
  ];

  // If the user matches known admin/owner emails or johntobismart@gmail.com, or just display the Admin panel nicely!
  const isAdmin = user.email && [
    "johntobismart@gmail.com",
    "owolekejesse@gmail.com",
    "johnnieekundayo@gmail.com",
  ].includes(user.email.toLowerCase());

  // We can show Admin link for these users
  if (isAdmin) {
    menuItems.push({
      path: "/admin",
      name: "Admin Control",
      icon: Shield,
      color: "text-red-500 bg-red-500/5",
    });
  }

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

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-surface border-r border-outline-variant/30 h-screen sticky top-0 shrink-0 z-40 select-none overflow-y-auto">
      {/* Sidebar Header with Logo */}
      <div className="p-6 border-b border-outline-variant/20 flex items-center justify-between">
        <Link to="/dashboard">
          <Logo />
        </Link>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${profile?.tier === "pro" ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300" : "bg-surface-dim text-on-surface-variant"}`}>
          {profile?.tier === "pro" ? "PRO" : "FREE"}
        </span>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 p-4 space-y-2 mt-4">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between p-3.5 rounded-2xl font-semibold text-sm transition-all group ${
                isActive
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-dim"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    isActive ? "bg-white/10 text-white animate-pulse" : `text-on-surface-variant group-hover:scale-105 ${item.color}`
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span>{item.name}</span>
              </div>
              <ChevronRight
                className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                  isActive ? "text-white" : "text-outline group-hover:text-on-surface-variant"
                }`}
              />
            </Link>
          );
        })}
      </div>

      {/* Referral Quick Card Panel inside Sidebar */}
      {profile?.tier !== "pro" && (
        <div className="mx-4 mb-4 p-4 rounded-3xl bg-gradient-to-tr from-primary/10 to-primary/5 hover:from-primary/15 border border-primary/25 relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-1.5 mb-2">
              <Trophy className="w-4 h-4 text-amber-500 animate-bounce" />
              <span className="text-xs font-bold text-primary">Get Free Lifetime PRO</span>
            </div>
            <p className="text-[11px] text-on-surface-variant font-medium leading-relaxed mb-3">
              Refer 5 friends to unlock full pro features forever!
            </p>
            <button
              onClick={() => navigate("/profile")}
              className="w-full py-2 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary/95 transition-all shadow-md active:scale-95 cursor-pointer text-center"
            >
              Start Referring
            </button>
          </div>
        </div>
      )}

      {/* User Session Handler / Log Out Container */}
      <div className="p-4 border-t border-outline-variant/25 bg-surface-dim/40">
        <div className="flex items-center justify-between p-3 rounded-2xl bg-surface border border-outline-variant/40 shadow-sm mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 border border-primary/10">
              {user.email?.charAt(0).toUpperCase() || "S"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-on-surface truncate">
                {user.displayName || "Student Scholar"}
              </p>
              <p className="text-[10px] text-on-surface-variant font-medium truncate">
                {user.email}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="w-full p-3.5 rounded-2xl border border-outline-variant/50 hover:border-error/25 hover:bg-error/5 text-on-surface-variant hover:text-error transition-all font-semibold text-sm flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
        >
          {isSigningOut ? (
            <div className="w-4 h-4 border-2 border-on-surface-variant border-t-transparent rounded-full animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
