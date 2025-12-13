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
  OutlinedInput,
  Checkbox,
  ListItemText,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Edit, PersonAdd, PersonRemove } from '@mui/icons-material';
import { tasksApi, AssignTaskDto, UpdateTaskDto } from '../../api/tasks.api';
import { ProductionTask } from '../../api/production.api';
import { usersApi } from '../../api/users.api';
import { useNotification } from '../../contexts/NotificationContext';
import { Priority, TaskStatus } from '../../types';
import { translateTaskStatus, translatePriority, translateMachineStatus } from '../../utils/translations';
import TaskCard from '../../components/TaskCard/TaskCard';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

const TaskPlanner: React.FC = () => {
  const { showError, showSuccess } = useNotification();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [tasks, setTasks] = useState<ProductionTask[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<ProductionTask | null>(null);
  const [formData, setFormData] = useState<AssignTaskDto>({
    taskId: '',
    userId: undefined,
    userIds: [],
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
    // Извлекаем userIds из assignments, если они есть
    const userIds = task.assignments?.map(a => a.userId) || [];
    setFormData({
      taskId: task.id,
      userId: task.assignedUserId || undefined,
      userIds: userIds,
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
      // Снимаем все назначения, отправляя пустой массив userIds
      await tasksApi.assignTask({ taskId, userIds: [] });
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
    <Container sx={{ px: { xs: 1, sm: 2 } }}>
      <Typography 
        variant="h4" 
        gutterBottom
        sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' }, mb: { xs: 2, sm: 3 } }}
      >
        Планирование задач
      </Typography>

      {isMobile ? (
        // Мобильный вид: карточки
        <Box>
          {memoizedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={handleOpen}
              onUnassign={handleUnassign}
              getPriorityColor={getPriorityColor}
              showError={showError}
              loadData={loadData}
            />
          ))}
        </Box>
      ) : (
        // Десктопный вид: таблица
        <TableContainer 
          component={Paper}
          sx={{
            overflowX: 'auto',
            '&::-webkit-scrollbar': {
              height: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(0,0,0,0.05)',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '4px',
            },
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Заказ</TableCell>
                <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Операция</TableCell>
                <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Станок</TableCell>
                <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Статус</TableCell>
                <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Приоритет</TableCell>
                <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Исполнитель</TableCell>
                <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Прогресс</TableCell>
                <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {memoizedTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell sx={{ fontSize: { sm: '0.8125rem', md: '0.875rem' } }}>
                    {task.order?.title || `Заказ ${task.orderId}`}
                  </TableCell>
                  <TableCell sx={{ fontSize: { sm: '0.8125rem', md: '0.875rem' } }}>
                    {task.operation}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${task.machine.name} (${translateMachineStatus(task.machine.status)})`}
                      size="small"
                      color={task.machine.status === 'WORKING' ? 'success' : 'error'}
                      sx={{ fontSize: '0.75rem' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={translateTaskStatus(task.status)} 
                      size="small"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={translatePriority(task.priority)}
                      size="small"
                      color={getPriorityColor(task.priority) as any}
                      sx={{ fontSize: '0.75rem' }}
                    />
                  </TableCell>
                  <TableCell>
                    {(task.assignments && task.assignments.length > 0) ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        {task.assignments.map((assignment) => (
                          <Chip
                            key={assignment.id}
                            label={`${assignment.user.firstName} ${assignment.user.lastName}`}
                            size="small"
                            onDelete={() => {
                              const newUserIds = task.assignments!
                                .filter(a => a.id !== assignment.id)
                                .map(a => a.userId);
                              tasksApi.assignTask({ taskId: task.id, userIds: newUserIds })
                                .then(() => loadData())
                                .catch((err) => showError(err.response?.data?.error || 'Ошибка снятия назначения'));
                            }}
                            sx={{ fontSize: '0.75rem' }}
                          />
                        ))}
                        <IconButton
                          size="small"
                          onClick={() => handleUnassign(task.id)}
                          title="Снять все назначения"
                        >
                          <PersonRemove fontSize="small" />
                        </IconButton>
                      </Box>
                    ) : task.assignedUser ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: { sm: '0.8125rem', md: '0.875rem' } }}>
                          {task.assignedUser.firstName} {task.assignedUser.lastName}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleUnassign(task.id)}
                        >
                          <PersonRemove fontSize="small" />
                        </IconButton>
                      </Box>
                    ) : (
                      <Chip 
                        label="Общая очередь" 
                        size="small" 
                        color="default"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    )}
                  </TableCell>
                  <TableCell sx={{ fontSize: { sm: '0.8125rem', md: '0.875rem' } }}>
                    {task.completedQuantity} / {task.totalQuantity}
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpen(task)}
                      sx={{ '& .MuiSvgIcon-root': { fontSize: '1.125rem' } }}
                    >
                      <Edit />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
        sx={{
          '& .MuiDialog-paper': {
            m: { xs: 0, sm: 2 },
            maxHeight: { xs: '100%', sm: '90vh' },
          }
        }}
      >
        <DialogTitle sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' }, pb: { xs: 1, sm: 2 } }}>
          Назначить задачу
        </DialogTitle>
        <DialogContent sx={{ pt: { xs: 2, sm: 3 } }}>
          <FormControl fullWidth margin="normal">
            <InputLabel sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Исполнители</InputLabel>
            <Select
              multiple
              value={formData.userIds || []}
              onChange={(e) => {
                const value = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
                setFormData({
                  ...formData,
                  userIds: value as string[],
                });
              }}
              input={<OutlinedInput label="Исполнители" />}
              sx={{
                fontSize: { xs: '0.875rem', sm: '1rem' },
                '& .MuiSelect-select': {
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  py: { xs: 1, sm: 1.25 }
                }
              }}
              renderValue={(selected) => {
                if (!selected || selected.length === 0) {
                  return <em style={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>Общая очередь</em>;
                }
                return (
                  <Box sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                    {selected
                      .map((userId) => {
                        const user = filteredUsers.find((u) => u.id === userId);
                        return user ? `${user.firstName} ${user.lastName}` : '';
                      })
                      .filter(Boolean)
                      .join(', ')}
                  </Box>
                );
              }}
            >
              {filteredUsers.map((user) => (
                <MenuItem 
                  key={user.id} 
                  value={user.id}
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  <Checkbox checked={(formData.userIds || []).indexOf(user.id) > -1} size="small" />
                  <ListItemText 
                    primary={`${user.firstName} ${user.lastName}`}
                    primaryTypographyProps={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Приоритет</InputLabel>
            <Select
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: e.target.value })
              }
              sx={{
                fontSize: { xs: '0.875rem', sm: '1rem' },
                '& .MuiSelect-select': {
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  py: { xs: 1, sm: 1.25 }
                }
              }}
            >
              <MenuItem value={Priority.LOW} sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Низкий</MenuItem>
              <MenuItem value={Priority.MEDIUM} sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Средний</MenuItem>
              <MenuItem value={Priority.HIGH} sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Высокий</MenuItem>
              <MenuItem value={Priority.CRITICAL} sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Критический</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 }, gap: { xs: 1, sm: 2 } }}>
          <Button 
            onClick={handleClose}
            sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
          >
            Отмена
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
          >
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TaskPlanner;

