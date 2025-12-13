import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { ArrowBack, PlayArrow, Stop, Pause, PlayCircle } from '@mui/icons-material';
import { ProductionTask } from '../../../api/production.api';
import { worklogsApi, WorkLog, WorkLogPause } from '../../../api/worklogs.api';
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
  const [activePause, setActivePause] = useState<WorkLogPause | null>(null);

  useEffect(() => {
    loadActiveWorkLog();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (workLog && !workLog.endTime) {
      interval = setInterval(() => {
        const start = new Date(workLog.startTime).getTime();
        const now = Date.now();
        
        // Вычитаем время всех завершенных пауз
        let pauseTime = 0;
        if (workLog.pauses) {
          workLog.pauses.forEach((pause) => {
            if (pause.pauseEnd) {
              const pauseStart = new Date(pause.pauseStart).getTime();
              const pauseEnd = new Date(pause.pauseEnd).getTime();
              pauseTime += pauseEnd - pauseStart;
            }
          });
        }
        
        // Вычитаем время активной паузы, если она есть
        if (activePause) {
          const pauseStart = new Date(activePause.pauseStart).getTime();
          pauseTime += now - pauseStart;
        }
        
        setElapsedTime(Math.floor((now - start - pauseTime) / 1000));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [workLog, activePause]);

  const loadActiveWorkLog = async () => {
    try {
      const active = await worklogsApi.getActiveWorkLog();
      if (active && active.taskId === task.id) {
        setWorkLog(active);
        // Проверяем активную паузу
        if (active.pauses) {
          const currentPause = active.pauses.find((p) => !p.pauseEnd);
          setActivePause(currentPause || null);
        }
      }
    } catch (error) {
      console.error('Failed to load work log:', error);
    }
  };

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

    // Завершаем активную паузу, если есть
    if (activePause) {
      try {
        await worklogsApi.endPause(activePause.id);
      } catch (error) {
        console.error('Failed to end pause:', error);
      }
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

  const handlePause = async () => {
    if (!workLog) return;

    if (activePause) {
      // Завершаем паузу
      try {
        setLoading(true);
        const endedPause = await worklogsApi.endPause(activePause.id);
        setActivePause(null);
        // Обновляем workLog
        const updated = await worklogsApi.getActiveWorkLog();
        if (updated && updated.taskId === task.id) {
          setWorkLog(updated);
        }
        showSuccess('Пауза завершена');
      } catch (error: any) {
        showError(error.response?.data?.error || 'Ошибка завершения паузы');
      } finally {
        setLoading(false);
      }
    } else {
      // Начинаем паузу
      try {
        setLoading(true);
        const newPause = await worklogsApi.startPause(workLog.id);
        setActivePause(newPause);
        showSuccess('Пауза начата');
      } catch (error: any) {
        showError(error.response?.data?.error || 'Ошибка начала паузы');
      } finally {
        setLoading(false);
      }
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
            <Alert severity={activePause ? 'warning' : 'info'} sx={{ mt: 2 }}>
              Работа начата: {format(new Date(workLog.startTime), 'HH:mm:ss')}
              <br />
              Время работы: {formatTime(elapsedTime)}
              {activePause && (
                <>
                  <br />
                  <strong>Пауза активна с {format(new Date(activePause.pauseStart), 'HH:mm:ss')}</strong>
                </>
              )}
            </Alert>
          )}

          {workLog && workLog.pauses && workLog.pauses.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                История пауз:
              </Typography>
              <List dense>
                {workLog.pauses
                  .filter((p) => p.pauseEnd) // Только завершенные паузы
                  .map((pause) => {
                    const start = new Date(pause.pauseStart);
                    const end = new Date(pause.pauseEnd!);
                    const duration = Math.floor((end.getTime() - start.getTime()) / 1000);
                    return (
                      <ListItem key={pause.id} sx={{ py: 0.5 }}>
                        <ListItemText
                          primary={`${format(start, 'HH:mm:ss')} - ${format(end, 'HH:mm:ss')}`}
                          secondary={`Длительность: ${formatTime(duration)}`}
                        />
                      </ListItem>
                    );
                  })}
              </List>
            </Box>
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
              <Button
                fullWidth
                variant={activePause ? 'contained' : 'outlined'}
                color={activePause ? 'warning' : 'primary'}
                size="large"
                startIcon={activePause ? <PlayCircle /> : <Pause />}
                onClick={handlePause}
                disabled={loading}
                sx={{ mb: 2 }}
              >
                {activePause ? 'Возобновить работу' : 'Пауза'}
              </Button>
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

