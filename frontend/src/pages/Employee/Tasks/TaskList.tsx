import React, { useState, useEffect, useMemo } from 'react';
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
  Divider,
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

  useEffect(() => {
    loadTasks();
  }, [tab]);

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

  const loadTasks = async () => {
    try {
      if (tab === 0) {
        // Мои задачи - только те, которые назначены начальником производства (assignedUserId не null)
        const tasks = await tasksApi.getAll({ assignedUserId: user?.id });
        // Фильтруем только задачи, которые были назначены (assignedUserId === user.id)
        setMyTasks(tasks.filter((t) => t.assignedUserId === user?.id && (t.status === 'PENDING' || t.status === 'IN_PROGRESS')));
      } else {
        // Свободные задачи - показываем все задачи по каждому заказу, даже если они уже взяты
        const tasks = await tasksApi.getAvailableTasks();
        setAvailableTasks(tasks);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  // Группируем задачи по заказам для вкладки "Свободные"
  const tasksByOrder = useMemo(() => {
    if (tab !== 1) return {};
    
    const grouped: Record<string, ProductionTask[]> = {};
    availableTasks.forEach((task) => {
      const orderId = task.orderId;
      if (!grouped[orderId]) {
        grouped[orderId] = [];
      }
      grouped[orderId].push(task);
    });
    return grouped;
  }, [availableTasks, tab]);

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

  const renderTaskItem = (task: ProductionTask, isMyTask: boolean) => {
    const isAssigned = task.assignedUserId !== null;
    const isAssignedToMe = task.assignedUserId === user?.id;
    const canTake = !isAssigned || isAssignedToMe;

    return (
      <ListItem
        key={task.id}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          mb: 1,
          opacity: isAssigned && !isAssignedToMe ? 0.7 : 1,
        }}
      >
        <ListItemText
          primary={task.operation}
          secondary={
            <Box>
              <Typography variant="body2">
                {task.order?.title || `Заказ ${task.orderId}`} - {task.machine.name}
              </Typography>
              {isAssigned && task.assignedUser && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  Назначено: {task.assignedUser.firstName} {task.assignedUser.lastName}
                </Typography>
              )}
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Chip label={translateTaskStatus(task.status)} size="small" />
                <Chip label={`${task.completedQuantity}/${task.totalQuantity}`} size="small" />
                {isAssigned && !isAssignedToMe && (
                  <Chip label="Занято" size="small" color="warning" />
                )}
              </Box>
            </Box>
          }
        />
        <Button
          variant="contained"
          onClick={() => setSelectedTask(task)}
          disabled={!canTake && !isMyTask}
        >
          {isMyTask ? 'Продолжить' : (isAssignedToMe ? 'Продолжить' : (isAssigned ? 'Просмотр' : 'Взять'))}
        </Button>
      </ListItem>
    );
  };

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

      {tab === 0 ? (
        <List>
          {myTasks.map((task) => renderTaskItem(task, true))}
        </List>
      ) : (
        <List>
          {Object.entries(tasksByOrder).map(([orderId, tasks]) => (
            <Box key={orderId}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1, px: 2 }}>
                {tasks[0]?.order?.title || `Заказ ${orderId}`}
              </Typography>
              <Divider sx={{ mb: 1 }} />
              {tasks.map((task) => renderTaskItem(task, false))}
            </Box>
          ))}
        </List>
      )}
    </Container>
  );
};

export default TaskList;

