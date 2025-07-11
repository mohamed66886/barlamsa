import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Barbers from "./pages/Barbers";
import Performance from "./pages/Performance";
import Advances from "./pages/Advances";
import Expenses from "./pages/Expenses";
import Settings from "./pages/Settings";
import DashboardLayout from "./components/layout/DashboardLayout";
import NotFound from "./pages/NotFound";

// صفحات الحلاقين
import BarberLogin from "./pages/BarberLogin";
import BarberLayout from "./components/layout/BarberLayout";
import BarberDailyRecords from "./pages/barber/BarberDailyRecords";
import BarberAdvances from "./pages/barber/BarberAdvances";
import BarberProfile from "./pages/barber/BarberProfile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Login pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/barber-login" element={<BarberLogin />} />
          
          {/* Admin Dashboard routes */}
          <Route path="/dashboard" element={
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          } />
          <Route path="/barbers" element={
            <DashboardLayout>
              <Barbers />
            </DashboardLayout>
          } />
          <Route path="/performance" element={
            <DashboardLayout>
              <Performance />
            </DashboardLayout>
          } />
          <Route path="/advances" element={
            <DashboardLayout>
              <Advances />
            </DashboardLayout>
          } />
          <Route path="/expenses" element={
            <DashboardLayout>
              <Expenses />
            </DashboardLayout>
          } />
          <Route path="/settings" element={
            <DashboardLayout>
              <Settings />
            </DashboardLayout>
          } />
          
          {/* Barber Dashboard routes */}
          <Route path="/barber-dashboard" element={<BarberLayout />}>
            <Route index element={<BarberDailyRecords />} />
            <Route path="advances" element={<BarberAdvances />} />
            <Route path="profile" element={<BarberProfile />} />
          </Route>
          
          {/* 404 page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
