import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  Collapse,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  ShoppingCart,
  Settings,
  People,
  ExitToApp,
  Factory,
  AccessTime,
  TrendingUp,
  Warning,
  Assessment,
  BarChart,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import IncidentDialog from '../IncidentDialog/IncidentDialog';

const drawerWidth = 240;

const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Initialize notifications
  const { incidentDialogOpen, selectedIncidentId, closeIncidentDialog } = useNotifications();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Состояние для раскрытых секций (по умолчанию все открыты)
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({
    orders: true,
    planning: true,
    equipment: true,
    admin: true,
    incidents: true,
    employee: true,
  });

  const toggleSection = (sectionKey: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  // Проверка, имеет ли пользователь доступ к разделу "Обращения"
  const hasIncidentsAccess = () => {
    if (!user) return false;
    // ADMIN всегда имеет доступ
    if (user.role === 'ADMIN') return true;
    // EMPLOYEE должен иметь тег "Настройщик"
    if (user.role === 'EMPLOYEE' && user.tags) {
      const tags = Array.isArray(user.tags) ? user.tags : [];
      return tags.includes('Настройщик');
    }
    return false;
  };

  const menuItems: Array<{
    text: string;
    icon: React.ReactNode;
    path: string;
    roles?: string[];
    customCheck?: () => boolean;
    section?: string; // Для группировки
  }> = [
    // Заказы и производство
    { text: 'Заказы', icon: <ShoppingCart />, path: '/orders', roles: ['ADMIN', 'MANAGER'], section: 'orders' },
    { text: 'Производство', icon: <Dashboard />, path: '/production', roles: ['ADMIN'], section: 'orders' },
    { text: 'Нагрузка на производство', icon: <Assessment />, path: '/production/workload', roles: ['ADMIN', 'MANAGER'], section: 'orders' },
    { text: 'Статистика производительности', icon: <BarChart />, path: '/production/statistics', roles: ['ADMIN'], section: 'orders' },
    
    // Планирование и аналитика
    { text: 'Смены', icon: <AccessTime />, path: '/shifts', roles: ['ADMIN'], section: 'planning' },
    { text: 'Аналитика', icon: <TrendingUp />, path: '/analytics', roles: ['ADMIN'], section: 'planning' },
    
    // Оборудование и склад
    { text: 'Станки', icon: <Factory />, path: '/machines', roles: ['ADMIN'], section: 'equipment' },
    { text: 'Склад', icon: <Settings />, path: '/warehouse', roles: ['ADMIN'], section: 'equipment' },
    
    // Администрирование
    { text: 'Пользователи', icon: <People />, path: '/admin/users', roles: ['ADMIN'], section: 'admin' },
    { text: 'QR-коды', icon: <Settings />, path: '/admin/qr', roles: ['ADMIN'], section: 'admin' },
    
    // Обращения
    { text: 'Обращения', icon: <Warning />, path: '/incidents', customCheck: hasIncidentsAccess, section: 'incidents' },
    
    // Рабочее место (для сотрудников)
    { text: 'Рабочее место', icon: <Dashboard />, path: '/employee', roles: ['EMPLOYEE', 'ADMIN'], section: 'employee' },
    { text: 'Мои задачи', icon: <Dashboard />, path: '/employee/tasks', roles: ['EMPLOYEE', 'ADMIN'], section: 'employee' },
    { text: 'Заказы', icon: <ShoppingCart />, path: '/employee/orders', roles: ['EMPLOYEE', 'ADMIN'], section: 'employee' },
    { text: 'История смен', icon: <AccessTime />, path: '/employee/shifts', roles: ['EMPLOYEE', 'ADMIN'], section: 'employee' },
    { text: 'Моя статистика', icon: <TrendingUp />, path: '/employee/stats', roles: ['EMPLOYEE', 'ADMIN'], section: 'employee' },
    { text: 'QR-сканер', icon: <Settings />, path: '/employee/qr-scanner', roles: ['EMPLOYEE', 'ADMIN'], section: 'employee' },
    { text: 'Помощь', icon: <Settings />, path: '/employee/help', roles: ['EMPLOYEE', 'ADMIN'], section: 'employee' },
  ].filter((item) => {
    if (item.customCheck) {
      return item.customCheck();
    }
    return !item.roles || item.roles.includes(user?.role || '');
  });

  // Группируем по секциям
  const sections = [
    { key: 'orders', title: 'Заказы и производство' },
    { key: 'planning', title: 'Планирование и аналитика' },
    { key: 'equipment', title: 'Оборудование и склад' },
    { key: 'admin', title: 'Администрирование' },
    { key: 'incidents', title: 'Обращения' },
    { key: 'employee', title: 'Рабочее место' },
  ];

  const getSectionItems = (sectionKey: string) => {
    return menuItems.filter((item) => item.section === sectionKey);
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          ERP Типография
        </Typography>
      </Toolbar>
      <List>
        {sections.map((section) => {
          const sectionItems = getSectionItems(section.key);
          if (sectionItems.length === 0) return null;

          const isOpen = openSections[section.key] ?? true;

          return (
            <React.Fragment key={section.key}>
              {section.key !== 'orders' && <Divider sx={{ my: 1 }} />}
              <ListItem disablePadding>
                <ListItemButton onClick={() => toggleSection(section.key)}>
                  <ListItemIcon>
                    {isOpen ? <ExpandLess /> : <ExpandMore />}
                  </ListItemIcon>
                  <ListItemText 
                    primary={section.title} 
                    primaryTypographyProps={{ 
                      variant: 'subtitle2', 
                      fontWeight: 'bold' 
                    }} 
                  />
                </ListItemButton>
              </ListItem>
              <Collapse in={isOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {sectionItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                      <ListItemButton
                        selected={location.pathname.startsWith(item.path)}
                        onClick={() => {
                          navigate(item.path);
                          setMobileOpen(false);
                        }}
                        sx={{ pl: 4 }}
                      >
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </React.Fragment>
          );
        })}
        <Divider sx={{ my: 1 }} />
        <ListItem disablePadding>
          <ListItemButton onClick={logout}>
            <ListItemIcon>
              <ExitToApp />
            </ListItemIcon>
            <ListItemText primary="Выход" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {user?.firstName} {user?.lastName} ({user?.role})
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
      <IncidentDialog
        open={incidentDialogOpen}
        incidentId={selectedIncidentId}
        onClose={closeIncidentDialog}
      />
    </Box>
  );
};

export default Layout;

