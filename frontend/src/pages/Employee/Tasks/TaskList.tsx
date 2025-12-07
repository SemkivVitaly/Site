import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemText,
  Button,
  Chip,
} from '@mui/material';
import { tasksApi } from '../../../api/tasks.api';
import { ProductionTask } from '../../../api/production.api';
import { useAuth } from '../../../contexts/AuthContext';
import TaskExecutor from './TaskExecutor';
import { translateTaskStatus } from '../../../utils/translations';

const TaskList: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [tab, setTab] = useState(0);
  const [myTasks, setMyTasks] = useState<ProductionTask[]>([]);
  const [availableTasks, setAvailableTasks] = useState<ProductionTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<ProductionTask | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      if (tab === 0) {
        // Мои задачи - только те, которые назначены начальником производства (assignedUserId не null)
        const tasks = await tasksApi.getAll({ assignedUserId: user?.id });
        // Фильтруем только задачи, которые были назначены (assignedUserId === user.id)
        setMyTasks(tasks.filter((t) => t.assignedUserId === user?.id && (t.status === 'PENDING' || t.status === 'IN_PROGRESS')));
      } else {
        // Свободные задачи - только те, которые не назначены (assignedUserId === null)
        const tasks = await tasksApi.getAvailableTasks();
        setAvailableTasks(tasks);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }, [tab, user?.id]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    // Check if taskId was passed from OrdersList
    if (location.state?.taskId) {
      const taskId = location.state.taskId;
      // Load task by ID
      tasksApi.getById(taskId).then((task) => {
        setSelectedTask(task);
      }).catch(console.error);
    }
  }, [location.state]);

  if (selectedTask) {
    return (
      <TaskExecutor
        task={selectedTask}
        onBack={() => {
          setSelectedTask(null);
          loadTasks();
        }}
      />
    );
  }

  return (
    <Container maxWidth="sm">
      <Typography variant="h5" gutterBottom>
        Задачи
      </Typography>

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Мои задачи" />
          <Tab label="Свободные" />
        </Tabs>
      </Paper>

      <List>
        {(tab === 0 ? myTasks : availableTasks).map((task) => (
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
                    {task.order?.title || `Заказ ${task.orderId}`} - {task.machine.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip label={translateTaskStatus(task.status)} size="small" />
                    <Chip label={`${task.completedQuantity}/${task.totalQuantity}`} size="small" />
                  </Box>
                </Box>
              }
            />
            <Button
              variant="contained"
              onClick={() => setSelectedTask(task)}
            >
              {tab === 0 ? 'Продолжить' : 'Взять'}
            </Button>
          </ListItem>
        ))}
      </List>
    </Container>
  );
};

export default TaskList;

