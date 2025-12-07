import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Button,
  Chip,
  Card,
  CardContent,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import { ordersApi, Order } from '../../api/orders.api';
import { tasksApi } from '../../api/tasks.api';
import { ProductionTask } from '../../api/production.api';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { translateTaskStatus, translateOrderStatus, translatePriority } from '../../utils/translations';

const OrdersList: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [tasks, setTasks] = useState<ProductionTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    if (selectedOrder) {
      loadTasksForOrder(selectedOrder.id);
    }
  }, [selectedOrder]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await ordersApi.getAll();
      // Filter only orders with tasks
      const ordersWithTasks = data.filter((order) => order.status !== 'ISSUED');
      
      // Загружаем прогресс выполнения для каждого заказа
      const ordersWithProgress = await Promise.all(
        ordersWithTasks.map(async (order) => {
          try {
            const fullOrder = await ordersApi.getById(order.id);
            return { ...order, completionPercentage: fullOrder.completionPercentage };
          } catch {
            return { ...order, completionPercentage: 0 };
          }
        })
      );
      
      setOrders(ordersWithProgress);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTasksForOrder = async (orderId: string) => {
    try {
      const allTasks = await tasksApi.getAll();
      const orderTasks = allTasks.filter((task) => task.orderId === orderId);
      setTasks(orderTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const handleTaskClick = (task: ProductionTask) => {
    // Navigate to task executor
    navigate('/employee/tasks', { state: { taskId: task.id } });
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (selectedOrder) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mb: 2 }}>
          <Button onClick={() => setSelectedOrder(null)} sx={{ mb: 2 }}>
            ← Назад к заказам
          </Button>
          <Typography variant="h5" gutterBottom>
            Заказ: {selectedOrder.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Клиент: {selectedOrder.client}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Тираж: {selectedOrder.printRun} шт
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Дедлайн: {format(new Date(selectedOrder.deadline), 'dd MMM yyyy', { locale: ru })}
          </Typography>
        </Box>

        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Задачи по заказу
          </Typography>
          {tasks.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Нет задач для этого заказа
            </Typography>
          ) : (
            <List>
              {tasks.map((task) => (
                <ListItem
                  key={task.id}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                  }}
                >
                  <ListItemText
                    primary={task.operation}
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          Станок: {task.machine.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Chip label={translateTaskStatus(task.status)} size="small" />
                          <Chip label={`${task.completedQuantity}/${task.totalQuantity}`} size="small" />
                          {task.priority && (
                            <Chip
                              label={translatePriority(task.priority)}
                              size="small"
                              color={
                                task.priority === 'CRITICAL'
                                  ? 'error'
                                  : task.priority === 'HIGH'
                                  ? 'warning'
                                  : 'default'
                              }
                            />
                          )}
                        </Box>
                      </Box>
                    }
                  />
                  <Button
                    variant="contained"
                    onClick={() => handleTaskClick(task)}
                    disabled={task.status === 'COMPLETED'}
                  >
                    {task.status === 'COMPLETED' ? 'Завершено' : task.status === 'IN_PROGRESS' ? 'Продолжить' : 'Начать работу'}
                  </Button>
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Typography variant="h5" gutterBottom>
        Выбор заказа
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Выберите заказ для просмотра и выполнения задач
      </Typography>

      <Box sx={{ mt: 3 }}>
        {orders.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Нет доступных заказов
            </Typography>
          </Paper>
        ) : (
          orders.map((order) => {
            const daysUntilDeadline = Math.ceil(
              (new Date(order.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );
            const isUrgent = daysUntilDeadline < 7;

            return (
              <Card
                key={order.id}
                sx={{
                  mb: 2,
                  cursor: 'pointer',
                  borderLeft: isUrgent ? '4px solid red' : 'none',
                  bgcolor: isUrgent ? 'error.light' : 'background.paper',
                  '&:hover': { boxShadow: 4 },
                }}
                onClick={() => setSelectedOrder(order)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Box>
                      <Typography variant="h6">{order.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Клиент: {order.client}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Тираж: {order.printRun} шт
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={format(new Date(order.deadline), 'dd MMM yyyy', { locale: ru })}
                          size="small"
                          color={isUrgent ? 'error' : 'default'}
                        />
                        {isUrgent && (
                          <Chip label={`${daysUntilDeadline} дн.`} size="small" color="error" />
                        )}
                        <Chip label={translateOrderStatus(order.status)} size="small" />
                      </Box>
                      {order.completionPercentage !== undefined && (
                        <Box sx={{ mt: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption">Выполнение заказа</Typography>
                            <Typography variant="caption">{order.completionPercentage}%</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={order.completionPercentage} />
                        </Box>
                      )}
                    </Box>
                    <Button variant="outlined">Выбрать</Button>
                  </Box>
                </CardContent>
              </Card>
            );
          })
        )}
      </Box>
    </Container>
  );
};

export default OrdersList;

