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
    <Container maxWidth="sm" sx={{ px: { xs: 1, sm: 2 } }}>
      <Box sx={{ py: { xs: 2, sm: 3 } }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography 
            variant="h4" 
            gutterBottom 
            sx={{ 
              fontSize: { xs: '1.5rem', sm: '2rem' },
              fontWeight: 700,
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
            }}
          >
            Добро пожаловать, {user?.firstName}!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Ваше рабочее место
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card
              elevation={0}
              sx={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(79, 70, 229, 0.05) 100%)',
                border: '1px solid',
                borderColor: 'primary.main',
                borderRadius: 3,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <AccessTime sx={{ fontSize: 32, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Смена
                  </Typography>
                </Box>
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
              <Card
                elevation={0}
                sx={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
                  border: '1px solid',
                  borderColor: 'success.main',
                  borderRadius: 3,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Assignment sx={{ fontSize: 32, color: 'success.main' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Активная задача
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                    {activeWorkLog.task?.operation}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Станок: {activeWorkLog.task?.machine?.name}
                  </Typography>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    sx={{ 
                      borderRadius: 2,
                      py: 1.5,
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    }}
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
                  sx={{ 
                    py: 2.5,
                    borderRadius: 3,
                    fontSize: '1rem',
                    fontWeight: 600,
                    borderWidth: currentShift.lunchStart && !currentShift.lunchEnd ? 0 : 2,
                    ...(currentShift.lunchStart && !currentShift.lunchEnd ? {
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    } : {}),
                  }}
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
              sx={{ 
                py: 2.5,
                borderRadius: 3,
                fontSize: '1rem',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(99, 102, 241, 0.5)',
                },
              }}
            >
              {currentShift?.timeIn && !currentShift?.timeOut ? 'Выход (QR)' : 'Вход (QR)'}
            </Button>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<Assignment />}
              onClick={() => navigate('/employee/tasks')}
              sx={{ 
                py: 2.5,
                borderRadius: 3,
                fontSize: '1rem',
                fontWeight: 600,
                borderWidth: 2,
                minHeight: 64,
              }}
            >
              Мои задачи
            </Button>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<ShoppingCart />}
              onClick={() => navigate('/employee/orders')}
              sx={{ 
                py: 2.5,
                borderRadius: 3,
                fontSize: '1rem',
                fontWeight: 600,
                borderWidth: 2,
                minHeight: 64,
              }}
            >
              Выбрать заказ
            </Button>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<Help />}
              onClick={() => navigate('/employee/help')}
              sx={{ 
                py: 2.5,
                borderRadius: 3,
                fontSize: '1rem',
                fontWeight: 600,
                borderWidth: 2,
                minHeight: 64,
              }}
            >
              Помощь
            </Button>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<AccessTime />}
              onClick={() => navigate('/employee/shifts')}
              sx={{ 
                py: 2.5,
                borderRadius: 3,
                fontSize: '1rem',
                fontWeight: 600,
                borderWidth: 2,
                minHeight: 64,
              }}
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

