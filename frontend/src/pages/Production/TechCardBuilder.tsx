import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Checkbox,
  FormControlLabel,
  OutlinedInput,
} from '@mui/material';
import { Add, Delete, ArrowUpward, ArrowDownward, Edit } from '@mui/icons-material';
import { productionApi, ProductionTask, CreateTaskDto } from '../../api/production.api';
import { machinesApi, Machine } from '../../api/machines.api';
import { ordersApi, Order } from '../../api/orders.api';
import { usersApi, User } from '../../api/users.api';
import { useNotification } from '../../contexts/NotificationContext';
import { Priority } from '../../types';
import { translateTaskStatus } from '../../utils/translations';

const TechCardBuilder: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { showError, showSuccess } = useNotification();
  const [order, setOrder] = useState<Order | null>(null);
  const [tasks, setTasks] = useState<ProductionTask[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ProductionTask | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<ProductionTask | null>(null);
  const [formData, setFormData] = useState<Omit<CreateTaskDto, 'orderId'>>({
    machineId: '',
    operation: '',
    totalQuantity: 0,
    priority: Priority.MEDIUM,
    sequence: 1,
    assignedUserId: undefined,
    assignedUserIds: [],
  });
  const [useCustomOperation, setUseCustomOperation] = useState(false);

  useEffect(() => {
    if (orderId) {
      loadData();
    }
  }, [orderId]);

  const getMachineCapabilities = (machineId: string): string[] => {
    const machine = machines.find((m) => m.id === machineId);
    return machine?.capabilities || [];
  };

  const loadData = async () => {
    try {
      const [orderData, tasksData, machinesData, employeesData] = await Promise.all([
        ordersApi.getById(orderId!),
        productionApi.getTechCardByOrderId(orderId!),
        machinesApi.getAll(),
        usersApi.getAll(),
      ]);
      setOrder(orderData);
      setTasks(tasksData);
      setMachines(machinesData.filter((m) => m.status === 'WORKING'));
      setEmployees(employeesData.filter((e) => e.role === 'EMPLOYEE'));
    } catch (error: any) {
      console.error('Failed to load data:', error);
      showError(error.response?.data?.error || 'Ошибка загрузки данных');
      navigate('/orders');
    }
  };

  const handleOpen = (task?: ProductionTask) => {
    if (task) {
      // Режим редактирования
      setEditingTask(task);
      const machineCapabilities = getMachineCapabilities(task.machineId);
      const isCustomOperation = !machineCapabilities.includes(task.operation);
      
      // Извлекаем assignedUserIds из assignments, если они есть
      const assignedUserIds = task.assignments?.map(a => a.userId) || [];
      
      setFormData({
        machineId: task.machineId,
        operation: task.operation,
        totalQuantity: task.totalQuantity,
        priority: task.priority as Priority,
        sequence: task.sequence,
        assignedUserId: task.assignedUserId || undefined,
        assignedUserIds: assignedUserIds,
      });
      setUseCustomOperation(isCustomOperation);
    } else {
      // Режим создания
      setEditingTask(null);
      setFormData({
        machineId: '',
        operation: '',
        totalQuantity: order?.printRun || 0,
        priority: Priority.MEDIUM,
        sequence: tasks.length + 1,
        assignedUserId: undefined,
        assignedUserIds: [],
      });
      setUseCustomOperation(false);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingTask(null);
  };

  const handleSubmit = async () => {
    // Валидация формы
    if (!formData.machineId) {
      showError('Выберите станок');
      return;
    }
    
    if (!formData.operation || formData.operation.trim() === '') {
      showError('Укажите операцию');
      return;
    }
    
    if (!formData.totalQuantity || formData.totalQuantity <= 0) {
      showError('Укажите количество (больше 0)');
      return;
    }

    try {
      if (editingTask) {
        // Редактирование задачи
        await productionApi.updateTask(editingTask.id, {
          machineId: formData.machineId,
          operation: formData.operation,
          totalQuantity: formData.totalQuantity,
          priority: formData.priority,
          assignedUserId: formData.assignedUserId,
        });
        showSuccess('Задача обновлена');
      } else if (tasks.length === 0) {
        // Create tech card
        await productionApi.createTechCard({
          orderId: orderId!,
          tasks: [formData],
        });
        showSuccess('Технологическая карта создана');
      } else {
        // Add task
        await productionApi.addTask({
          ...formData,
          orderId: orderId!,
        });
        showSuccess('Задача добавлена');
      }
      handleClose();
      loadData();
    } catch (error: any) {
      showError(error.response?.data?.error || 'Ошибка сохранения');
    }
  };

  const handleDeleteClick = (task: ProductionTask) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;

    try {
      await productionApi.deleteTask(taskToDelete.id);
      showSuccess('Задача удалена');
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
      loadData();
    } catch (error: any) {
      showError(error.response?.data?.error || 'Ошибка удаления задачи');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setTaskToDelete(null);
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === tasks.length - 1)
    ) {
      return;
    }

    const newTasks = [...tasks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newTasks[index], newTasks[targetIndex]] = [newTasks[targetIndex], newTasks[index]];

    const taskIds = newTasks.map((t) => t.id);
    try {
      await productionApi.updateSequence(orderId!, taskIds);
      loadData();
      showSuccess('Порядок задач обновлен');
    } catch (error: any) {
      showError(error.response?.data?.error || 'Ошибка обновления порядка');
    }
  };

  if (!order) {
    return <Container>Загрузка...</Container>;
  }

  return (
    <Container>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Технологическая карта: {order.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Тираж: {order.printRun} шт
        </Typography>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Задачи производства</Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
            Добавить задачу
          </Button>
        </Box>

        {tasks.length === 0 ? (
          <Typography color="text.secondary">
            Технологическая карта не создана. Добавьте первую задачу.
          </Typography>
        ) : (
          <List>
            {tasks.map((task, index) => (
              <ListItem
                key={task.id}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Chip label={`${index + 1}`} size="small" />
                    <Typography variant="subtitle1">{task.operation}</Typography>
                    <Chip label={task.machine.name} size="small" color="primary" />
                    <Chip label={translateTaskStatus(task.status)} size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Количество: {task.completedQuantity} / {task.totalQuantity} шт
                  </Typography>
                  {(task.assignments && task.assignments.length > 0) ? (
                    <Typography variant="body2" color="text.secondary">
                      Исполнители: {task.assignments.map(a => `${a.user.firstName} ${a.user.lastName}`).join(', ')}
                    </Typography>
                  ) : task.assignedUser ? (
                    <Typography variant="body2" color="text.secondary">
                      Исполнитель: {task.assignedUser.firstName} {task.assignedUser.lastName}
                    </Typography>
                  ) : null}
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleOpen(task)}
                    title="Редактировать"
                    color="primary"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteClick(task)}
                    title="Удалить"
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleMove(index, 'up')}
                    disabled={index === 0}
                    title="Переместить вверх"
                  >
                    <ArrowUpward />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleMove(index, 'down')}
                    disabled={index === tasks.length - 1}
                    title="Переместить вниз"
                  >
                    <ArrowDownward />
                  </IconButton>
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTask ? 'Редактировать задачу' : 'Добавить задачу'}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Станок</InputLabel>
            <Select
              value={formData.machineId}
              onChange={(e) => {
                const machineId = e.target.value;
                const capabilities = getMachineCapabilities(machineId);
                setFormData({
                  ...formData,
                  machineId,
                  operation: capabilities[0] || '',
                });
              }}
            >
              {machines.map((machine) => (
                <MenuItem key={machine.id} value={machine.id}>
                  {machine.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={useCustomOperation}
                  onChange={(e) => {
                    setUseCustomOperation(e.target.checked);
                    if (!e.target.checked && formData.machineId) {
                      const capabilities = getMachineCapabilities(formData.machineId);
                      setFormData({ ...formData, operation: capabilities[0] || '' });
                    } else {
                      setFormData({ ...formData, operation: '' });
                    }
                  }}
                />
              }
              label="Ввести операцию вручную"
            />
          </Box>

          {useCustomOperation ? (
            <TextField
              fullWidth
              label="Операция"
              value={formData.operation}
              onChange={(e) => setFormData({ ...formData, operation: e.target.value })}
              margin="normal"
              placeholder="Введите название операции"
              required
            />
          ) : (
            <FormControl fullWidth margin="normal">
              <InputLabel>Операция</InputLabel>
              <Select
                value={formData.operation}
                onChange={(e) => setFormData({ ...formData, operation: e.target.value })}
                disabled={!formData.machineId}
              >
                {formData.machineId &&
                  getMachineCapabilities(formData.machineId).map((cap) => (
                    <MenuItem key={cap} value={cap}>
                      {cap}
                    </MenuItem>
                  ))}
                {formData.machineId && getMachineCapabilities(formData.machineId).length === 0 && (
                  <MenuItem value="" disabled>
                    Нет доступных операций
                  </MenuItem>
                )}
                {!formData.machineId && (
                  <MenuItem value="" disabled>
                    Сначала выберите станок
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          )}

          <TextField
            fullWidth
            label="Количество"
            type="number"
            value={formData.totalQuantity}
            onChange={(e) => setFormData({ ...formData, totalQuantity: Number(e.target.value) })}
            margin="normal"
            required
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Приоритет</InputLabel>
            <Select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            >
              <MenuItem value={Priority.LOW}>Низкий</MenuItem>
              <MenuItem value={Priority.MEDIUM}>Средний</MenuItem>
              <MenuItem value={Priority.HIGH}>Высокий</MenuItem>
              <MenuItem value={Priority.CRITICAL}>Критический</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Назначить сотрудников</InputLabel>
            <Select
              multiple
              value={formData.assignedUserIds || []}
              onChange={(e) => {
                const value = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
                setFormData({ ...formData, assignedUserIds: value as string[] });
              }}
              input={<OutlinedInput label="Назначить сотрудников" />}
              renderValue={(selected) => {
                if (!selected || selected.length === 0) {
                  return <em>Не назначать</em>;
                }
                return selected
                  .map((userId) => {
                    const employee = employees.find((e) => e.id === userId);
                    return employee ? `${employee.firstName} ${employee.lastName}` : '';
                  })
                  .filter(Boolean)
                  .join(', ');
              }}
            >
              {employees.map((employee) => (
                <MenuItem key={employee.id} value={employee.id}>
                  <Checkbox checked={(formData.assignedUserIds || []).indexOf(employee.id) > -1} />
                  <ListItemText primary={`${employee.firstName} ${employee.lastName}`} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Отмена</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingTask ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Удалить задачу?</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить задачу "{taskToDelete?.operation}"?
            {taskToDelete?.workLogs && taskToDelete.workLogs.length > 0 && (
              <Typography color="error" sx={{ mt: 1 }}>
                Внимание: Эта задача содержит записи о работе. Задача с записями о работе не может быть удалена.
              </Typography>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Отмена</Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={taskToDelete?.workLogs && taskToDelete.workLogs.length > 0}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TechCardBuilder;

