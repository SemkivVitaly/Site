import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ArrowBack, PlayArrow, Stop } from '@mui/icons-material';
import { ProductionTask } from '../../../api/production.api';
import { worklogsApi, WorkLog } from '../../../api/worklogs.api';
import { useNotification } from '../../../contexts/NotificationContext';
import { format } from 'date-fns';

interface TaskExecutorProps {
  task: ProductionTask;
  onBack: () => void;
}

const TaskExecutor: React.FC<TaskExecutorProps> = ({ task, onBack }) => {
  const { showError, showSuccess } = useNotification();
  const [workLog, setWorkLog] = useState<WorkLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(0);
  const [defectQuantity, setDefectQuantity] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  const loadActiveWorkLog = useCallback(async () => {
    try {
      const active = await worklogsApi.getActiveWorkLog();
      if (active && active.taskId === task.id) {
        setWorkLog(active);
      }
    } catch (error) {
      console.error('Failed to load work log:', error);
    }
  }, [task.id]);

  useEffect(() => {
    loadActiveWorkLog();
  }, [loadActiveWorkLog]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (workLog && !workLog.endTime) {
      interval = setInterval(() => {
        const start = new Date(workLog.startTime).getTime();
        const now = Date.now();
        setElapsedTime(Math.floor((now - start) / 1000));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [workLog]);


  const handleStart = async () => {
    try {
      setLoading(true);
      const newWorkLog = await worklogsApi.startWorkLog({ taskId: task.id });
      setWorkLog(newWorkLog);
      showSuccess('Работа начата');
    } catch (error: any) {
      showError(error.response?.data?.error || 'Ошибка начала работы');
    } finally {
      setLoading(false);
    }
  };

  const handleEnd = async () => {
    if (!workLog) return;

    if (quantity <= 0) {
      showError('Введите количество произведенных единиц');
      return;
    }

    try {
      setLoading(true);
      await worklogsApi.endWorkLog({
        workLogId: workLog.id,
        quantityProduced: quantity,
        defectQuantity: defectQuantity,
      });
      showSuccess('Работа завершена');
      onBack();
    } catch (error: any) {
      showError(error.response?.data?.error || 'Ошибка завершения работы');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 2 }}>
        <Button startIcon={<ArrowBack />} onClick={onBack}>
          Назад
        </Button>

        <Paper sx={{ p: 3, mt: 2 }}>
          <Typography variant="h5" gutterBottom>
            {task.operation}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {task.order?.title || `Заказ ${task.orderId}`} - {task.machine.name}
          </Typography>
          <Typography variant="body2" gutterBottom>
            Прогресс: {task.completedQuantity} / {task.totalQuantity}
          </Typography>

          {workLog && !workLog.endTime && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Работа начата: {format(new Date(workLog.startTime), 'HH:mm:ss')}
              <br />
              Время работы: {formatTime(elapsedTime)}
            </Alert>
          )}

          {!workLog ? (
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<PlayArrow />}
              onClick={handleStart}
              disabled={loading}
              sx={{ mt: 3 }}
            >
              Начать работу
            </Button>
          ) : (
            <Box sx={{ mt: 3 }}>
              <TextField
                fullWidth
                label="Количество произведено"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Количество брака"
                type="number"
                value={defectQuantity}
                onChange={(e) => setDefectQuantity(Number(e.target.value))}
                margin="normal"
                required
              />
              <Button
                fullWidth
                variant="contained"
                color="error"
                size="large"
                startIcon={<Stop />}
                onClick={handleEnd}
                disabled={loading || quantity <= 0}
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Завершить работу'}
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default TaskExecutor;

