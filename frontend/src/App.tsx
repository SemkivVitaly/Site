import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Layout from './components/Layout/Layout';
import OfflineIndicator from './components/OfflineIndicator/OfflineIndicator';
import Login from './pages/Login/Login';
import OrdersDashboard from './pages/Orders/OrdersDashboard';
import OrderForm from './pages/Orders/OrderForm';
import MachinesManagement from './pages/Machines/MachinesManagement';
import MachineHistory from './pages/Machines/MachineHistory';
import TechCardBuilder from './pages/Production/TechCardBuilder';
import TaskPlanner from './pages/Production/TaskPlanner';
import EfficiencyDashboard from './pages/Analytics/EfficiencyDashboard';
import QRGenerator from './pages/Admin/QRGenerator';
import UsersManagement from './pages/Admin/UsersManagement';
import ShiftPlanner from './pages/Shifts/ShiftPlanner';
import EmployeeDashboard from './pages/Employee/Dashboard';
import QRScanner from './pages/Employee/QRScanner';
import TaskList from './pages/Employee/Tasks/TaskList';
import HelpButton from './pages/Employee/HelpButton';
import ShiftsHistory from './pages/Employee/ShiftsHistory';
import OrdersList from './pages/Employee/OrdersList';
import EmployeeStats from './pages/Employee/EmployeeStats';
import MaterialsManagement from './pages/Warehouse/MaterialsManagement';
import IncidentsList from './pages/Incidents/IncidentsList';
import ProductionWorkload from './pages/Production/ProductionWorkload';
import ProductionStatistics from './pages/Production/ProductionStatistics';
import { initOfflineQueue } from './utils/offlineQueue';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  React.useEffect(() => {
    // Initialize offline queue
    initOfflineQueue().catch(console.error);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
        <NotificationProvider>
          <AuthProvider>
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <OfflineIndicator />
              <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/orders" replace />} />
              <Route path="orders" element={<OrdersDashboard />} />
              <Route path="orders/new" element={<OrderForm />} />
              <Route path="orders/:id" element={<OrderForm />} />
              <Route path="orders/:orderId/tech-card" element={<TechCardBuilder />} />
              <Route path="machines" element={<MachinesManagement />} />
              <Route path="machines/:id/history" element={<MachineHistory />} />
              <Route path="production" element={<TaskPlanner />} />
              <Route path="analytics" element={<EfficiencyDashboard />} />
              <Route path="admin/qr" element={<QRGenerator />} />
              <Route path="admin/users" element={<UsersManagement />} />
              <Route path="shifts" element={<ShiftPlanner />} />
              <Route path="warehouse" element={<MaterialsManagement />} />
              <Route path="employee" element={<EmployeeDashboard />} />
              <Route path="employee/qr-scanner" element={<QRScanner />} />
              <Route path="employee/tasks" element={<TaskList />} />
              <Route path="employee/help" element={<HelpButton />} />
              <Route path="employee/shifts" element={<ShiftsHistory />} />
              <Route path="employee/orders" element={<OrdersList />} />
              <Route path="employee/stats" element={<EmployeeStats />} />
              <Route path="incidents" element={<IncidentsList />} />
              <Route path="production/workload" element={<ProductionWorkload />} />
              <Route path="production/statistics" element={<ProductionStatistics />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </NotificationProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;

