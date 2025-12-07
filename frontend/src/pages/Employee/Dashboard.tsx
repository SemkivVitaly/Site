import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Button,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  QrCodeScanner,
  Assignment,
  AccessTime,
  Help,
  Restaurant,
  ShoppingCart,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { shiftsApi, Shift } from '../../api/shifts.api';
import { worklogsApi, WorkLog } from '../../api/worklogs.api';

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [activeWorkLog, setActiveWorkLog] = useState<WorkLog | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [shift, workLog] = await Promise.all([
        shiftsApi.getCurrentShift(),
        worklogsApi.getActiveWorkLog(),
      ]);
      setCurrentShift(shift);
      setActiveWorkLog(workLog);
    } catch (error) {
      // Ошибка загрузки данных - игнорируем для неавторизованных пользователей
    }
  };

  const handleLunch = async (action: 'start' | 'end') => {
    try {
      await shiftsApi.processLunch(action);
      await loadData();
      showSuccess(action === 'start' ? 'Обед начат' : 'Обед завершен');
    } catch (error: any) {
      showError(error.response?.data?.error || `Ошибка: ${action === 'start' ? 'не удалось начать обед' : 'не удалось завершить обед'}`);
    }
  };

  const handleNoLunch = async () => {
    try {
      await shiftsApi.markNoLunch();
      await loadData();
      showSuccess('Отмечено: без обеда');
    } catch (error: any) {
      showError(error.response?.data?.error || 'Ошибка: не удалось отметить отсутствие обеда');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 3 }}>
        <Typography variant="h5" gutterBottom align="center">
          Добро пожаловать, {user?.firstName}!
        </Typography>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Смена
                </Typography>
                {currentShift ? (
                  <Box>
                    <Typography variant="body2">
                      Вход: {currentShift.timeIn ? new Date(currentShift.timeIn).toLocaleTimeString() : 'Не отмечен'}
                    </Typography>
                    {currentShift.timeOut && (
                      <Typography variant="body2">
                        Выход: {new Date(currentShift.timeOut).toLocaleTimeString()}
                      </Typography>
                    )}
                    {currentShift.isLate && (
                      <Typography variant="body2" color="error">
                        Опоздание зафиксировано
                      </Typography>
                    )}
                    {currentShift.lunchStart && (() => {
                      const lunchStartDate = new Date(currentShift.lunchStart);
                      const noLunchMarker = new Date('1970-01-01T00:00:00.000Z');
                      const isNoLunch = lunchStartDate.getTime() === noLunchMarker.getTime();
                      
                      if (isNoLunch) {
                        return (
                          <Typography variant="body2" color="text.secondary">
                            Обед: Без обеда
                          </Typography>
                        );
                      }
                      
                      return (
                        <Typography variant="body2" color="text.secondary">
                          Обед: {lunchStartDate.toLocaleTimeString()}
                          {currentShift.lunchEnd ? ` - ${new Date(currentShift.lunchEnd).toLocaleTimeString()}` : ' (в процессе)'}
                        </Typography>
                      );
                    })()}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Смена не начата. Отсканируйте QR-код для начала смены.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {activeWorkLog && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Активная задача
                  </Typography>
                  <Typography variant="body2">
                    {activeWorkLog.task?.operation} - {activeWorkLog.task?.machine?.name}
                  </Typography>
                  <Button
                    fullWidth
                    variant="contained"
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/employee/tasks')}
                  >
                    Продолжить работу
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          )}

          {currentShift && !currentShift.timeOut && (
            <>
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant={currentShift.lunchStart && !currentShift.lunchEnd ? "contained" : "outlined"}
                  size="large"
                  startIcon={<Restaurant />}
                  onClick={() => handleLunch(currentShift?.lunchStart && !currentShift?.lunchEnd ? 'end' : 'start')}
                  sx={{ py: 2 }}
                  disabled={!!(!currentShift.timeIn || (currentShift.lunchStart && currentShift.lunchEnd && new Date(currentShift.lunchStart).getTime() === new Date('1970-01-01T00:00:00.000Z').getTime()))}
                >
                  {currentShift.lunchStart && !currentShift.lunchEnd ? 'Завершить обед' : 'Уйти на обед'}
                </Button>
              </Grid>
              {currentShift.timeIn && (() => {
                if (!currentShift.lunchStart) return true;
                const lunchStartDate = new Date(currentShift.lunchStart);
                const noLunchMarker = new Date('1970-01-01T00:00:00.000Z');
                const isNoLunch = lunchStartDate.getTime() === noLunchMarker.getTime();
                return !isNoLunch && !currentShift.lunchEnd;
              })() && (
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    onClick={async () => {
                      try {
                        await shiftsApi.markNoLunch();
                        await loadData();
                        showSuccess('Отмечено: без обеда');
                      } catch (error: any) {
                        showError(error.response?.data?.error || 'Ошибка отметки');
                      }
                    }}
                    sx={{ py: 2 }}
                  >
                    Без обеда
                  </Button>
                </Grid>
              )}
            </>
          )}

          <Grid item xs={12}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<QrCodeScanner />}
              onClick={() => navigate('/employee/qr-scanner')}
              sx={{ py: 2 }}
            >
              {currentShift?.timeIn && !currentShift?.timeOut ? 'Выход (QR)' : 'Вход (QR)'}
            </Button>
          </Grid>

          <Grid item xs={12}>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<Assignment />}
              onClick={() => navigate('/employee/tasks')}
              sx={{ py: 2 }}
            >
              Мои задачи
            </Button>
          </Grid>

          <Grid item xs={12}>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<ShoppingCart />}
              onClick={() => navigate('/employee/orders')}
              sx={{ py: 2 }}
            >
              Выбрать заказ
            </Button>
          </Grid>

          <Grid item xs={12}>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<Help />}
              onClick={() => navigate('/employee/help')}
              sx={{ py: 2 }}
            >
              Помощь
            </Button>
          </Grid>

          <Grid item xs={12}>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<AccessTime />}
              onClick={() => navigate('/employee/shifts')}
              sx={{ py: 2 }}
            >
              История смен
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default EmployeeDashboard;

