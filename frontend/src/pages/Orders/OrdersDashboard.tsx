import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import { Add, ShoppingCart, TrendingUp, AccessTime, CheckCircle, Edit, Delete, Star, Build } from '@mui/icons-material';
import { ordersApi, Order } from '../../api/orders.api';
import KanbanBoard from '../../components/KanbanBoard/KanbanBoard';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { translateOrderStatus, translatePriority } from '../../utils/translations';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';

const OrdersDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError, showSuccess } = useNotification();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await ordersApi.getAll();
      
      // Calculate completion percentage for each order
      const ordersWithCompletion = await Promise.all(
        data.map(async (order) => {
          try {
            const fullOrder = await ordersApi.getById(order.id);
            return { ...order, completionPercentage: fullOrder.completionPercentage };
          } catch {
            return order;
          }
        })
      );
      
      setOrders(ordersWithCompletion);
    } catch (error: any) {
      console.error('Failed to load orders:', error);
      showError(error.response?.data?.error || 'Ошибка загрузки заказов');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      setOrderToDelete(order);
      setDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;

    try {
      await ordersApi.delete(orderToDelete.id);
      showSuccess('Заказ успешно удален');
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
      loadOrders();
    } catch (error: any) {
      showError(error.response?.data?.error || 'Ошибка удаления заказа');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setOrderToDelete(null);
  };

  const handleEditOrder = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };

  const handleTechCardClick = (orderId: string) => {
    navigate(`/orders/${orderId}/tech-card`);
  };

  const memoizedOrders = useMemo(() => orders, [orders]);

  const getDeadlineColor = (deadline: string) => {
    const days = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (days < 1) return 'error';
    if (days < 3) return 'warning';
    return 'default';
  };

  const getPriorityColor = (priority: string): 'error' | 'warning' | 'info' | 'default' => {
    switch (priority) {
      case 'CRITICAL':
        return 'error';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'info';
      case 'LOW':
        return 'default';
      default:
        return 'default';
    }
  };

  const canDeleteOrder = (order: Order) => {
    return (user?.role === 'ADMIN' || user?.role === 'MANAGER') && 
           (order.status === 'READY' || order.status === 'ISSUED');
  };

  const stats = useMemo(() => {
    const total = orders.length;
    const inProgress = orders.filter(o => o.status === 'IN_PROGRESS' || o.status === 'IN_QUEUE').length;
    const ready = orders.filter(o => o.status === 'READY' || o.status === 'ISSUED').length;
    const urgent = orders.filter(o => {
      const days = Math.ceil((new Date(o.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return days < 3;
    }).length;
    return { total, inProgress, ready, urgent };
  }, [orders]);

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' }, 
        mb: 4,
        gap: { xs: 2, sm: 0 }
      }}>
        <Box>
          <Typography 
            variant="h4" 
            sx={{ 
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' },
              fontWeight: 700,
              mb: 0.5,
            }}
          >
            Заказы
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Управление заказами и их статусами
          </Typography>
        </Box>
        {user?.role === 'MANAGER' || user?.role === 'ADMIN' ? (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/orders/new')}
            size="large"
            sx={{ 
              width: { xs: '100%', sm: 'auto' },
              minWidth: { xs: 'auto', sm: '180px' },
              borderRadius: 2,
            }}
          >
            Создать заказ
          </Button>
        ) : null}
      </Box>

      {/* Статистические карточки */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <Card
            elevation={0}
            sx={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: 'white',
              borderRadius: 3,
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
              },
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Всего заказов
                  </Typography>
                </Box>
                <ShoppingCart sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card
            elevation={0}
            sx={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              borderRadius: 3,
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
              },
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {stats.inProgress}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    В работе
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card
            elevation={0}
            sx={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              borderRadius: 3,
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
              },
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {stats.ready}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Готово
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card
            elevation={0}
            sx={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              borderRadius: 3,
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
              },
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {stats.urgent}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Срочные
                  </Typography>
                </Box>
                <AccessTime sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mb: 3 }}>
        <Tabs 
          value={viewMode} 
          onChange={(_, v) => setViewMode(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.9375rem',
              minHeight: 56,
            },
          }}
        >
          <Tab 
            label="Канбан" 
            value="kanban"
          />
          <Tab 
            label="Таблица" 
            value="table"
          />
        </Tabs>
      </Box>

      {viewMode === 'kanban' ? (
        <KanbanBoard orders={memoizedOrders} onOrderUpdate={loadOrders} onDeleteOrder={handleDeleteOrder} />
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflowX: 'auto !important',
            overflowY: 'visible !important',
            WebkitOverflowScrolling: 'touch !important',
            touchAction: 'pan-x pan-y !important',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(0,0,0,0.4) rgba(0,0,0,0.1)',
            position: 'relative',
            width: '100%',
            '&::-webkit-scrollbar': {
              height: '14px !important',
              display: 'block !important',
              WebkitAppearance: 'none !important',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(0,0,0,0.1) !important',
              borderRadius: '7px !important',
              margin: '2px !important',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(0,0,0,0.4) !important',
              borderRadius: '7px !important',
              border: '3px solid rgba(255,255,255,0.9) !important',
              minHeight: '20px !important',
              '&:hover': {
                background: 'rgba(0,0,0,0.6) !important',
              },
            },
          }}
        >
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow
                sx={{
                  bgcolor: 'grey.50',
                  '& .MuiTableCell-head': {
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: 'text.primary',
                  },
                }}
              >
                <TableCell>Название</TableCell>
                <TableCell>Клиент</TableCell>
                <TableCell align="center">Тираж</TableCell>
                <TableCell>Дедлайн</TableCell>
                <TableCell align="center">Статус</TableCell>
                <TableCell align="center">Приоритет</TableCell>
                <TableCell align="center">Прогресс</TableCell>
                <TableCell align="center">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {memoizedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Заказы не найдены
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                memoizedOrders.map((order) => {
                  const daysUntilDeadline = Math.ceil(
                    (new Date(order.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );
                  const isUrgent = daysUntilDeadline < 3;

                  return (
                    <TableRow
                      key={order.id}
                      hover
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                        ...(isUrgent && {
                          bgcolor: 'rgba(239, 68, 68, 0.05)',
                          borderLeft: '4px solid',
                          borderColor: 'error.main',
                        }),
                      }}
                      onClick={() => handleEditOrder(order.id)}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: { xs: 150, sm: 200, md: 250 },
                            }}
                          >
                            {order.title}
                          </Typography>
                          {order.isImportant && (
                            <Star
                              sx={{
                                color: 'warning.main',
                                fontSize: 18,
                                flexShrink: 0,
                              }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: { xs: 120, sm: 150, md: 200 },
                          }}
                        >
                          {order.client}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {order.printRun} шт
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Chip
                            label={format(new Date(order.deadline), 'dd MMM yyyy', { locale: ru })}
                            color={getDeadlineColor(order.deadline)}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                          {isUrgent && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: 'error.main',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                              }}
                            >
                              {daysUntilDeadline < 0 ? 'Просрочен' : `${daysUntilDeadline} дн.`}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={translateOrderStatus(order.status)}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={translatePriority(order.priority)}
                          color={getPriorityColor(order.priority)}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ minWidth: 120 }}>
                        {order.completionPercentage !== undefined ? (
                          <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                                {order.completionPercentage}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={order.completionPercentage}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                bgcolor: 'grey.200',
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 3,
                                  background: 'linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)',
                                },
                              }}
                            />
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Box
                          sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                            <>
                              <Tooltip title="Техкарта">
                                <IconButton
                                  size="small"
                                  onClick={() => handleTechCardClick(order.id)}
                                  sx={{
                                    color: 'primary.main',
                                    '&:hover': {
                                      bgcolor: 'primary.light',
                                      color: 'white',
                                    },
                                  }}
                                >
                                  <Build fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Редактировать">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditOrder(order.id)}
                                  sx={{
                                    color: 'info.main',
                                    '&:hover': {
                                      bgcolor: 'info.light',
                                      color: 'white',
                                    },
                                  }}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          {canDeleteOrder(order) && (
                            <Tooltip title="Удалить">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteOrder(order.id)}
                                sx={{
                                  color: 'error.main',
                                  '&:hover': {
                                    bgcolor: 'error.light',
                                    color: 'white',
                                  },
                                }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog 
        open={deleteDialogOpen} 
        onClose={handleDeleteCancel}
        fullScreen={window.innerWidth < 600}
        sx={{
          '& .MuiDialog-paper': {
            m: { xs: 0, sm: 2 },
            maxHeight: { xs: '100%', sm: '90vh' },
          }
        }}
      >
        <DialogTitle sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
          Удалить заказ?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            Вы уверены, что хотите удалить заказ "{orderToDelete?.title}"?
            Это действие нельзя отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 }, gap: { xs: 1, sm: 2 } }}>
          <Button 
            onClick={handleDeleteCancel}
            sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
          >
            Отмена
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            variant="contained" 
            color="error"
            sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OrdersDashboard;

