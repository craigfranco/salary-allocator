import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from '@/components/layout/AppLayout';
import SalaryTable from '@/pages/SalaryTable';
import HotelBudgets from '@/pages/HotelBudgets';
import OrgChart from '@/pages/OrgChart.jsx';
import Alerts from '@/pages/Alerts';
import Analytics from '@/pages/Analytics';
import ScenarioComparison from '@/pages/ScenarioComparison';
import { ThemeProvider } from '@/lib/theme.jsx';
import { ScenarioProvider } from '@/lib/ScenarioContext';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<SalaryTable />} />
        <Route path="/budgets" element={<HotelBudgets />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/org-chart" element={<OrgChart />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/compare" element={<ScenarioComparison />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <ScenarioProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClientInstance}>
            <Router>
              <AuthenticatedApp />
            </Router>
            <Toaster />
          </QueryClientProvider>
        </AuthProvider>
      </ScenarioProvider>
    </ThemeProvider>
  )
}

export default App