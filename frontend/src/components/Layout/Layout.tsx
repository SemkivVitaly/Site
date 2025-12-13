import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
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
  Avatar,
  Chip,
  useTheme,
  useMediaQuery,
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
  QrCodeScanner,
  Inventory,
  AdminPanelSettings,
  BusinessCenter,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import IncidentDialog from '../IncidentDialog/IncidentDialog';

const drawerWidth = 280;
const mobileDrawerWidth = 280;

const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
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
    { text: 'Склад', icon: <Inventory />, path: '/warehouse', roles: ['ADMIN'], section: 'equipment' },
    
    // Администрирование
    { text: 'Пользователи', icon: <People />, path: '/admin/users', roles: ['ADMIN'], section: 'admin' },
    { text: 'QR-коды', icon: <QrCodeScanner />, path: '/admin/qr', roles: ['ADMIN'], section: 'admin' },
    
    // Обращения
    { text: 'Обращения', icon: <Warning />, path: '/incidents', customCheck: hasIncidentsAccess, section: 'incidents' },
    
    // Рабочее место (для сотрудников)
    { text: 'Рабочее место', icon: <Dashboard />, path: '/employee', roles: ['EMPLOYEE', 'ADMIN'], section: 'employee' },
    { text: 'Мои задачи', icon: <Dashboard />, path: '/employee/tasks', roles: ['EMPLOYEE', 'ADMIN'], section: 'employee' },
    { text: 'Заказы', icon: <ShoppingCart />, path: '/employee/orders', roles: ['EMPLOYEE', 'ADMIN'], section: 'employee' },
    { text: 'История смен', icon: <AccessTime />, path: '/employee/shifts', roles: ['EMPLOYEE', 'ADMIN'], section: 'employee' },
    { text: 'Моя статистика', icon: <TrendingUp />, path: '/employee/stats', roles: ['EMPLOYEE', 'ADMIN'], section: 'employee' },
    { text: 'QR-сканер', icon: <QrCodeScanner />, path: '/employee/qr-scanner', roles: ['EMPLOYEE', 'ADMIN', 'MANAGER'], section: 'employee' },
    { text: 'Помощь', icon: <Warning />, path: '/employee/help', roles: ['EMPLOYEE', 'ADMIN'], section: 'employee' },
  ].filter((item) => {
    if (item.customCheck) {
      return item.customCheck();
    }
    return !item.roles || item.roles.includes(user?.role || '');
  });

  // Группируем по секциям с иконками
  const sections = [
    { key: 'orders', title: 'Заказы и производство', icon: <BusinessCenter /> },
    { key: 'planning', title: 'Планирование и аналитика', icon: <TrendingUp /> },
    { key: 'equipment', title: 'Оборудование и склад', icon: <Factory /> },
    { key: 'admin', title: 'Администрирование', icon: <AdminPanelSettings /> },
    { key: 'incidents', title: 'Обращения', icon: <Warning /> },
    { key: 'employee', title: 'Рабочее место', icon: <Dashboard /> },
  ];

  const getSectionItems = (sectionKey: string) => {
    return menuItems.filter((item) => item.section === sectionKey);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'primary';
      case 'MANAGER':
        return 'secondary';
      case 'EMPLOYEE':
        return 'success';
      default:
        return 'default';
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

  const drawer = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 3,
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            fontSize: { xs: '1.125rem', sm: '1.25rem' },
            textAlign: 'center',
          }}
        >
          ERP Типография
        </Typography>
        {user && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                fontSize: '1.25rem',
                fontWeight: 600,
                border: '2px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              {getInitials(user.firstName, user.lastName)}
            </Avatar>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                {user.firstName} {user.lastName}
              </Typography>
              <Chip
                label={user.role === 'ADMIN' ? 'Администратор' : user.role === 'MANAGER' ? 'Менеджер' : 'Сотрудник'}
                size="small"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontSize: '0.75rem',
                  height: 20,
                }}
              />
            </Box>
          </Box>
        )}
      </Box>

      {/* Navigation */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <List sx={{ px: 1, py: 2 }}>
          {sections.map((section) => {
            const sectionItems = getSectionItems(section.key);
            if (sectionItems.length === 0) return null;

            const isOpen = openSections[section.key] ?? true;

            return (
              <React.Fragment key={section.key}>
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => toggleSection(section.key)}
                    sx={{
                      borderRadius: 2,
                      py: 1.5,
                      px: 2,
                      '&:hover': {
                        bgcolor: 'rgba(99, 102, 241, 0.08)',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                      {section.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={section.title}
                      primaryTypographyProps={{
                        variant: 'subtitle2',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                      }}
                    />
                    {isOpen ? (
                      <ExpandLess sx={{ color: 'text.secondary' }} />
                    ) : (
                      <ExpandMore sx={{ color: 'text.secondary' }} />
                    )}
                  </ListItemButton>
                </ListItem>
                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {sectionItems.map((item) => {
                      const isSelected = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                      return (
                        <ListItem key={item.text} disablePadding>
                          <ListItemButton
                            selected={isSelected}
                            onClick={() => {
                              navigate(item.path);
                              setMobileOpen(false);
                            }}
                            sx={{
                              pl: 5,
                              pr: 2,
                              py: 1.25,
                              borderRadius: 2,
                              mx: 1,
                              my: 0.25,
                              '&.Mui-selected': {
                                bgcolor: 'primary.main',
                                color: 'white',
                                '&:hover': {
                                  bgcolor: 'primary.dark',
                                },
                                '& .MuiListItemIcon-root': {
                                  color: 'white',
                                },
                              },
                              '&:hover': {
                                bgcolor: isSelected ? 'primary.dark' : 'rgba(99, 102, 241, 0.08)',
                              },
                            }}
                          >
                            <ListItemIcon
                              sx={{
                                minWidth: 36,
                                color: isSelected ? 'white' : 'text.secondary',
                              }}
                            >
                              {item.icon}
                            </ListItemIcon>
                            <ListItemText
                              primary={item.text}
                              primaryTypographyProps={{
                                variant: 'body2',
                                fontWeight: isSelected ? 600 : 400,
                                fontSize: '0.875rem',
                              }}
                            />
                          </ListItemButton>
                        </ListItem>
                      );
                    })}
                  </List>
                </Collapse>
              </React.Fragment>
            );
          })}
        </List>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <ListItemButton
          onClick={logout}
          sx={{
            borderRadius: 2,
            py: 1.5,
            px: 2,
            color: 'error.main',
            '&:hover': {
              bgcolor: 'rgba(239, 68, 68, 0.08)',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: 'error.main' }}>
            <ExitToApp />
          </ListItemIcon>
          <ListItemText
            primary="Выход"
            primaryTypographyProps={{
              variant: 'body2',
              fontWeight: 500,
            }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Toolbar
          sx={{
            minHeight: { xs: 64, sm: 70 },
            px: { xs: 2, sm: 3 },
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{
                mr: { xs: 1, sm: 0 },
                display: { sm: 'none' },
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                },
              }}
            >
              <MenuIcon />
            </IconButton>
            {!isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}
                >
                  {user && getInitials(user.firstName, user.lastName)}
                </Avatar>
                <Box>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.9375rem',
                      color: 'white',
                    }}
                  >
                    {user?.firstName} {user?.lastName}
                  </Typography>
                  <Chip
                    label={user?.role === 'ADMIN' ? 'Администратор' : user?.role === 'MANAGER' ? 'Менеджер' : 'Сотрудник'}
                    size="small"
                    sx={{
                      height: 20,
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontSize: '0.6875rem',
                      fontWeight: 500,
                      mt: 0.25,
                    }}
                  />
                </Box>
              </Box>
            )}
          </Box>
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
            BackdropProps: {
              sx: {
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
              },
            },
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: mobileDrawerWidth,
              maxWidth: '85vw',
              borderRight: 'none',
              boxShadow: '4px 0 24px rgba(0, 0, 0, 0.12)',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid',
              borderColor: 'divider',
              boxShadow: 'none',
            },
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
          p: { xs: 1, sm: 3, md: 4 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: { xs: 'calc(100vh - 64px)', sm: 'calc(100vh - 70px)' },
          height: { xs: 'calc(100vh - 64px)', sm: 'calc(100vh - 70px)' },
          bgcolor: 'background.default',
          transition: 'padding 0.3s ease-in-out',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 64, sm: 70 }, flexShrink: 0 }} />
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'visible',
            WebkitOverflowScrolling: 'touch',
            width: '100%',
            maxWidth: { lg: '1400px', xl: '1600px' },
            mx: 'auto',
            px: { xs: 0, sm: 2, md: 0 },
            animation: 'fadeIn 0.3s ease-in',
            '@keyframes fadeIn': {
              from: {
                opacity: 0,
                transform: 'translateY(10px)',
              },
              to: {
                opacity: 1,
                transform: 'translateY(0)',
              },
            },
          }}
        >
          <Outlet />
        </Box>
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

