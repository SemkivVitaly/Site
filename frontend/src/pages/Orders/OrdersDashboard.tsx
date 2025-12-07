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
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { ordersApi, Order } from '../../api/orders.api';
import KanbanBoard from '../../components/KanbanBoard/KanbanBoard';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
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

  const memoizedOrders = useMemo(() => orders, [orders]);

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
    <Container>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Заказы</Typography>
        {user?.role === 'MANAGER' || user?.role === 'ADMIN' ? (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/orders/new')}
          >
            Создать заказ
          </Button>
        ) : null}
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={viewMode} onChange={(_, v) => setViewMode(v)}>
          <Tab label="Канбан" value="kanban" />
          <Tab label="Таблица" value="table" />
        </Tabs>
      </Box>

      {viewMode === 'kanban' ? (
        <KanbanBoard orders={memoizedOrders} onOrderUpdate={loadOrders} onDeleteOrder={handleDeleteOrder} />
      ) : (
        <Box>
          <Typography>Табличный вид (в разработке)</Typography>
        </Box>
      )}

      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Удалить заказ?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы уверены, что хотите удалить заказ "{orderToDelete?.title}"?
            Это действие нельзя отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Отмена</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OrdersDashboard;

