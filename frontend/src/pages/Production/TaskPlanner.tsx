import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
} from '@mui/material';
import { Edit, PersonAdd, PersonRemove } from '@mui/icons-material';
import { tasksApi, AssignTaskDto, UpdateTaskDto } from '../../api/tasks.api';
import { ProductionTask } from '../../api/production.api';
import { usersApi } from '../../api/users.api';
import { useNotification } from '../../contexts/NotificationContext';
import { Priority, TaskStatus } from '../../types';
import { translateTaskStatus, translatePriority, translateMachineStatus } from '../../utils/translations';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

const TaskPlanner: React.FC = () => {
  const { showError, showSuccess } = useNotification();
  const [tasks, setTasks] = useState<ProductionTask[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<ProductionTask | null>(null);
  const [formData, setFormData] = useState<AssignTaskDto>({
    taskId: '',
    userId: undefined,
    priority: Priority.MEDIUM,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksData, usersData] = await Promise.all([
        tasksApi.getAll(),
        usersApi.getAll(),
      ]);
      setTasks(tasksData);
      setUsers(usersData.filter((u) => u.role === 'EMPLOYEE'));
    } catch (error: any) {
      console.error('Failed to load data:', error);
      showError(error.response?.data?.error || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (task: ProductionTask) => {
    setSelectedTask(task);
    setFormData({
      taskId: task.id,
      userId: task.assignedUserId || undefined,
      priority: task.priority,
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedTask(null);
  };

  const handleSubmit = useCallback(async () => {
    try {
      await tasksApi.assignTask(formData);
      handleClose();
      await loadData();
      showSuccess('Задача назначена');
    } catch (error: any) {
      showError(error.response?.data?.error || 'Ошибка назначения задачи');
    }
  }, [formData, showError, showSuccess]);

  const handleUnassign = useCallback(async (taskId: string) => {
    try {
      await tasksApi.updateTask(taskId, { assignedUserId: null });
      await loadData();
      showSuccess('Задача снята с назначения');
    } catch (error: any) {
      showError(error.response?.data?.error || 'Ошибка снятия задачи');
    }
  }, [showError, showSuccess]);

  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case Priority.CRITICAL:
        return 'error';
      case Priority.HIGH:
        return 'warning';
      case Priority.MEDIUM:
        return 'info';
      case Priority.LOW:
        return 'default';
      default:
        return 'default';
    }
  }, []);

  const filteredUsers = useMemo(() => users, [users]);
  const memoizedTasks = useMemo(() => tasks, [tasks]);

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
      <Typography variant="h4" gutterBottom>
        Планирование задач
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Заказ</TableCell>
              <TableCell>Операция</TableCell>
              <TableCell>Станок</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Приоритет</TableCell>
              <TableCell>Исполнитель</TableCell>
              <TableCell>Прогресс</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {memoizedTasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>{task.order?.title || `Заказ ${task.orderId}`}</TableCell>
                <TableCell>{task.operation}</TableCell>
                <TableCell>
                  <Chip
                    label={`${task.machine.name} (${translateMachineStatus(task.machine.status)})`}
                    size="small"
                    color={task.machine.status === 'WORKING' ? 'success' : 'error'}
                  />
                </TableCell>
                <TableCell>
                  <Chip label={translateTaskStatus(task.status)} size="small" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={translatePriority(task.priority)}
                    size="small"
                    color={getPriorityColor(task.priority) as any}
                  />
                </TableCell>
                <TableCell>
                  {task.assignedUser ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>
                        {task.assignedUser.firstName} {task.assignedUser.lastName}
                      </span>
                      <IconButton
                        size="small"
                        onClick={() => handleUnassign(task.id)}
                      >
                        <PersonRemove />
                      </IconButton>
                    </Box>
                  ) : (
                    <Chip label="Общая очередь" size="small" color="default" />
                  )}
                </TableCell>
                <TableCell>
                  {task.completedQuantity} / {task.totalQuantity}
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpen(task)}>
                    <Edit />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Назначить задачу</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Исполнитель</InputLabel>
            <Select
              value={formData.userId || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  userId: e.target.value || undefined,
                })
              }
            >
              <MenuItem value="">Общая очередь</MenuItem>
              {filteredUsers.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.firstName} {user.lastName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Приоритет</InputLabel>
            <Select
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: e.target.value })
              }
            >
              <MenuItem value={Priority.LOW}>Низкий</MenuItem>
              <MenuItem value={Priority.MEDIUM}>Средний</MenuItem>
              <MenuItem value={Priority.HIGH}>Высокий</MenuItem>
              <MenuItem value={Priority.CRITICAL}>Критический</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Отмена</Button>
          <Button onClick={handleSubmit} variant="contained">
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TaskPlanner;

