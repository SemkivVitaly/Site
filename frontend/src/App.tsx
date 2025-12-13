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
      main: '#6366f1', // Индиго - современный профессиональный цвет
      light: '#818cf8',
      dark: '#4f46e5',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ec4899', // Розовый - энергичный акцент
      light: '#f472b6',
      dark: '#db2777',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
    },
    info: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
    },
    divider: 'rgba(0, 0, 0, 0.06)',
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Inter"',
      '"Segoe UI"',
      '"Roboto"',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    fontSize: 14,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
      '@media (max-width:900px)': {
        fontSize: '2rem',
      },
      '@media (max-width:600px)': {
        fontSize: '1.75rem',
      },
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
      '@media (max-width:900px)': {
        fontSize: '1.75rem',
      },
      '@media (max-width:600px)': {
        fontSize: '1.5rem',
      },
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.4,
      '@media (max-width:900px)': {
        fontSize: '1.5rem',
      },
      '@media (max-width:600px)': {
        fontSize: '1.25rem',
      },
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
      '@media (max-width:900px)': {
        fontSize: '1.25rem',
      },
      '@media (max-width:600px)': {
        fontSize: '1.125rem',
      },
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
      '@media (max-width:600px)': {
        fontSize: '1.125rem',
      },
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
      '@media (max-width:600px)': {
        fontSize: '1rem',
      },
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      '@media (max-width:600px)': {
        fontSize: '0.9375rem',
      },
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      '@media (max-width:600px)': {
        fontSize: '0.8125rem',
      },
    },
    button: {
      fontSize: '0.9375rem',
      fontWeight: 500,
      textTransform: 'none',
      letterSpacing: '0.01em',
      '@media (max-width:600px)': {
        fontSize: '0.875rem',
      },
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.1)',
    '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
  ],
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 24px',
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
          '@media (max-width:600px)': {
            padding: '10px 20px',
            fontSize: '0.875rem',
            minHeight: '44px',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
          '@media (max-width:600px)': {
            borderRadius: 12,
            padding: '12px',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          '@media (max-width:600px)': {
            borderRadius: 12,
          },
        },
        elevation1: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            transition: 'all 0.2s ease-in-out',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#6366f1',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderWidth: 2,
            },
          },
          '@media (max-width:600px)': {
            '& .MuiInputBase-root': {
              fontSize: '1rem',
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          '@media (max-width:600px)': {
            padding: '12px 8px',
            fontSize: '0.875rem',
          },
        },
        head: {
          fontWeight: 600,
          backgroundColor: '#f8fafc',
          color: '#1e293b',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          '@media (max-width:600px)': {
            margin: '16px',
            maxWidth: 'calc(100% - 32px)',
            borderRadius: 16,
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
          '@media (max-width:600px)': {
            width: '280px',
            maxWidth: '85vw',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          '@media (max-width:600px)': {
            fontSize: '0.75rem',
            height: '28px',
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.9375rem',
          '@media (max-width:600px)': {
            fontSize: '0.875rem',
            minHeight: '48px',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          '@media (max-width:600px)': {
            padding: '10px',
            minWidth: '44px',
            minHeight: '44px',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '2px 8px',
          '&.Mui-selected': {
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(79, 70, 229, 0.1) 100%)',
            color: '#6366f1',
            '&:hover': {
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(79, 70, 229, 0.15) 100%)',
            },
          },
          '&:hover': {
            background: 'rgba(99, 102, 241, 0.08)',
          },
        },
      },
    },
  },
});

function App() {
  React.useEffect(() => {
    // Initialize offline queue
    initOfflineQueue().catch(console.error);
    
    // Уведомления теперь запрашиваются при авторизации, а не при загрузке приложения
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

