import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import { incidentsApi } from '../../api/incidents.api';
import { IncidentType } from '../../types';
import { machinesApi, Machine } from '../../api/machines.api';
import { tasksApi } from '../../api/tasks.api';
import { ProductionTask } from '../../api/production.api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const HelpButton: React.FC = () => {
  const { user } = useAuth();
  const { showError, showSuccess } = useNotification();
  const [type, setType] = useState<IncidentType>(IncidentType.TASK_QUESTION);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [machineId, setMachineId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [machines, setMachines] = useState<Machine[]>([]);
  const [tasks, setTasks] = useState<ProductionTask[]>([]);
  const [success, setSuccess] = useState(false);

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [machinesData, tasksData] = await Promise.all([
        machinesApi.getAll(),
        tasksApi.getAll(), // Загружаем все доступные задачи
      ]);
      setMachines(machinesData);
      // Показываем только активные задачи (PENDING или IN_PROGRESS)
      setTasks(tasksData.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'PENDING'));
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await incidentsApi.createIncident({
        type,
        title,
        description,
        machineId: type === IncidentType.MACHINE_BREAKDOWN ? machineId : undefined,
        taskId: type === IncidentType.TASK_QUESTION ? taskId : undefined,
      });

      setSuccess(true);
      setTitle('');
      setDescription('');
      setMachineId('');
      setTaskId('');

      showSuccess('Запрос отправлен. К вам скоро подойдут.');
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      showError(error.response?.data?.error || 'Ошибка создания инцидента');
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h5" gutterBottom align="center">
          Требуется помощь
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Запрос отправлен. К вам скоро подойдут.
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Тип проблемы</InputLabel>
            <Select value={type} onChange={(e) => setType(e.target.value as IncidentType)}>
              <MenuItem value={IncidentType.MACHINE_BREAKDOWN}>Сломался станок</MenuItem>
              <MenuItem value={IncidentType.TASK_QUESTION}>Вопрос по задаче</MenuItem>
            </Select>
          </FormControl>

          {type === IncidentType.MACHINE_BREAKDOWN && (
            <FormControl fullWidth margin="normal">
              <InputLabel>Станок</InputLabel>
              <Select value={machineId} onChange={(e) => setMachineId(e.target.value)}>
                {machines.map((machine) => (
                  <MenuItem key={machine.id} value={machine.id}>
                    {machine.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {type === IncidentType.TASK_QUESTION && (
            <FormControl fullWidth margin="normal">
              <InputLabel>Задача</InputLabel>
              <Select value={taskId} onChange={(e) => setTaskId(e.target.value)}>
                {tasks.map((task) => (
                  <MenuItem key={task.id} value={task.id}>
                    {task.operation} - {task.order?.title || `Заказ ${task.orderId}`}
                    {task.assignedUser && ` (${task.assignedUser.firstName} ${task.assignedUser.lastName})`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <TextField
            fullWidth
            label="Краткое описание"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Подробное описание"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            margin="normal"
            multiline
            rows={4}
          />

          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>
            Отправить запрос
          </Button>
        </form>
      </Paper>
    </Container>
  );
};

export default HelpButton;

