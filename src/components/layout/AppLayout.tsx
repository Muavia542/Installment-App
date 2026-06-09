import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../lib/auth-context";
import { LayoutDashboard, Users, Receipt, CircleDollarSign, LogOut, Bell } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { AppNotification, useNotifications } from "../../hooks/use-notifications";

export function AppLayout() {
  const { user, profile, isLoading, signOut } = useAuth();
  const location = useLocation();
  const { data: notifications = [] } = useNotifications();
  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = profile?.role === "ADMIN";
  const isClient = profile?.role === "CLIENT";

  if (isAdmin && location.pathname.startsWith("/dashboard")) {
    return <Navigate to="/admin" replace />;
  }

  if (isClient && location.pathname.startsWith("/admin")) {
    return <Navigate to="/dashboard" replace />;
  }

  const navItems = isAdmin ? [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Clients", href: "/admin/clients", icon: Users },
    { name: "Deals", href: "/admin/deals", icon: Receipt },
    { name: "Payments", href: "/admin/payments", icon: CircleDollarSign },
    { name: "Notifications", href: "/admin/notifications", icon: Bell },
  ] : [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Deals", href: "/dashboard/deals", icon: Receipt },
    { name: "Payments", href: "/dashboard/payments", icon: CircleDollarSign },
    { name: "Profile", href: "/dashboard/profile", icon: Users },
    { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 hidden md:flex md:flex-col">
        <div className="flex h-16 items-center px-6 border-b border-gray-200">
          <span className="text-xl font-bold text-blue-600">Installment Pro</span>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
          <nav className="flex-1 space-y-1 px-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <Icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-500"
                    }`}
                  />
                  <span className="flex-1">{item.name}</span>
                  {item.name === "Notifications" && unreadCount > 0 && (
                    <span className="ml-auto inline-block py-0.5 px-2 text-xs font-medium rounded-full bg-blue-100 text-blue-600">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">{profile?.name || user.email}</p>
              <p className="text-xs font-medium text-gray-500">{profile?.role}</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="mt-4 flex w-full items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md"
          >
            <LogOut className="mr-3 h-5 w-5 text-gray-400" />
            Sign out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
