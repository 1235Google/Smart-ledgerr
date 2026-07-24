import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider, useStore } from './context/StoreContext';
import Layout from './components/Layout';
import InitialSetup from './pages/InitialSetup';
import Dashboard from './pages/Dashboard';
import CurrentBalance from './pages/CurrentBalance';
import MoneyReceived from './pages/MoneyReceived';
import PendingPayments from './pages/PendingPayments';
import SendMoney from './pages/SendMoney';
import Analytics from './pages/Analytics';
import Search from './pages/Search';
import Settings from './pages/Settings';
import MonthlyReports from './pages/MonthlyReports';
import Vault from './pages/Vault';
import Goals from './pages/Goals';
import Gullak from './pages/Gullak';
import ImportExport from './pages/ImportExport';
import Calculator from './pages/Calculator';
import TimelineReplay from './pages/TimelineReplay';
import SecurityWrapper from './components/SecurityWrapper';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isSetupComplete, isLoading } = useStore();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isSetupComplete) {
    return <Navigate to="/setup" replace />;
  }
  return <>{children}</>;
}

function SetupRoute({ children }: { children: React.ReactNode }) {
  const { isSetupComplete, isLoading } = useStore();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isSetupComplete) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/setup" element={
        <SetupRoute>
          <InitialSetup />
        </SetupRoute>
      } />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="balance" element={<CurrentBalance />} />
        <Route path="received" element={<MoneyReceived />} />
        <Route path="sent" element={<SendMoney />} />
        <Route path="pending" element={<PendingPayments />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="search" element={<Search />} />
        <Route path="vault" element={<Vault />} />
        <Route path="goals" element={<Goals />} />
        <Route path="gullak" element={<Gullak />} />
        <Route path="timeline" element={<TimelineReplay />} />
        <Route path="calculator" element={<Calculator />} />
        <Route path="import-export" element={<ImportExport />} />
        <Route path="reports" element={<MonthlyReports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <SecurityWrapper>
          <AppRoutes />
        </SecurityWrapper>
      </BrowserRouter>
    </StoreProvider>
  );
}

