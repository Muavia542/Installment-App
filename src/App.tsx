import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from "./lib/auth-context";
import { AuthLayout } from "./components/layout/AuthLayout";
import { AppLayout } from "./components/layout/AppLayout";
import { RootRedirect } from "./routes/root";
import { Login } from "./routes/login";
import { AdminDashboard } from "./routes/admin/dashboard";
import { AdminClients } from "./routes/admin/clients";
import { AdminDeals } from "./routes/admin/deals";
import { AdminPayments } from "./routes/admin/payments";
import { ClientDashboard } from "./routes/client/dashboard";
import { ClientDeals } from "./routes/client/deals";
import { ClientPayments } from "./routes/client/payments";
import { ClientProfile } from "./routes/client/profile";
import { ClientNotifications } from "./routes/client/notifications";
import { AdminNotifications } from "./routes/admin/notifications";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <RootRedirect /> },
      { path: "admin", element: <AdminDashboard /> },
      { path: "admin/clients", element: <AdminClients /> },
      { path: "admin/deals", element: <AdminDeals /> },
      { path: "admin/payments", element: <AdminPayments /> },
      { path: "admin/notifications", element: <AdminNotifications /> },

      
      { path: "dashboard", element: <ClientDashboard /> },
      { path: "dashboard/deals", element: <ClientDeals /> },
      { path: "dashboard/payments", element: <ClientPayments /> },
      { path: "dashboard/profile", element: <ClientProfile /> },
      { path: "dashboard/notifications", element: <ClientNotifications /> },
    ]
  },

  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <Login /> }
    ]
  }
]);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
