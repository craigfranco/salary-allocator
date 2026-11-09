import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import SalaryTable from '@/pages/SalaryTable';
import HotelBudgets from '@/pages/HotelBudgets';
import OrgChart from '@/pages/OrgChart.jsx';
import Alerts from '@/pages/Alerts';
import Analytics from '@/pages/Analytics';
import ScenarioComparison from '@/pages/ScenarioComparison';
import DeptBudgets from '@/pages/DeptBudgets';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Mfa from '@/pages/Mfa';
import { ThemeProvider } from '@/lib/theme.jsx';
import { ScenarioProvider } from '@/lib/ScenarioContext';
import { RedactionProvider } from '@/lib/RedactionContext';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/mfa" element={<Mfa />} />

      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<SalaryTable />} />
          <Route path="/budgets" element={<HotelBudgets />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/org-chart" element={<OrgChart />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/compare" element={<ScenarioComparison />} />
          <Route path="/finance" element={<SalaryTable dept="FINANCE" />} />
          <Route path="/finance/budgets" element={<DeptBudgets dept="FINANCE" />} />
          <Route path="/finance/analytics" element={<Analytics dept="FINANCE" />} />
          <Route path="/finance/alerts" element={<Alerts dept="FINANCE" />} />
          <Route path="/finance/compare" element={<ScenarioComparison dept="FINANCE" />} />
          <Route path="/finance/org-chart" element={<OrgChart dept="FINANCE" />} />
          <Route path="/hr" element={<SalaryTable dept="HR" />} />
          <Route path="/hr/budgets" element={<DeptBudgets dept="HR" />} />
          <Route path="/hr/analytics" element={<Analytics dept="HR" />} />
          <Route path="/hr/alerts" element={<Alerts dept="HR" />} />
          <Route path="/hr/compare" element={<ScenarioComparison dept="HR" />} />
          <Route path="/hr/org-chart" element={<OrgChart dept="HR" />} />
          <Route path="/engineering" element={<SalaryTable dept="ENGINEERING" />} />
          <Route path="/engineering/budgets" element={<DeptBudgets dept="ENGINEERING" />} />
          <Route path="/engineering/analytics" element={<Analytics dept="ENGINEERING" />} />
          <Route path="/engineering/alerts" element={<Alerts dept="ENGINEERING" />} />
          <Route path="/engineering/compare" element={<ScenarioComparison dept="ENGINEERING" />} />
          <Route path="/engineering/org-chart" element={<OrgChart dept="ENGINEERING" />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <RedactionProvider>
      <ScenarioProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClientInstance}>
            <Router>
              <AppRoutes />
            </Router>
            <Toaster />
          </QueryClientProvider>
        </AuthProvider>
      </ScenarioProvider>
      </RedactionProvider>
    </ThemeProvider>
  )
}

export default App