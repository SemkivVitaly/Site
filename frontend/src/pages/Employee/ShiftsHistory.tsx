import React, { useState, useEffect } from 'react';
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
  Chip,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { shiftsApi, Shift } from '../../api/shifts.api';
import { analyticsApi } from '../../api/analytics.api';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const ShiftsHistory: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [efficiencyData, setEfficiencyData] = useState<Record<string, any>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const shiftsData = await shiftsApi.getShifts({ userId: user?.id });
      setShifts(shiftsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

      // Load efficiency data for each shift
      const efficiencyPromises = shiftsData.map(async (shift) => {
        if (shift.timeIn && shift.timeOut) {
          try {
            const startDate = new Date(shift.date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(shift.date);
            endDate.setHours(23, 59, 59, 999);
            
            const efficiency = await analyticsApi.getEmployeeEfficiency(
              user!.id,
              startDate.toISOString(),
              endDate.toISOString()
            );
            return { shiftId: shift.id, efficiency };
          } catch (error) {
            return { shiftId: shift.id, efficiency: null };
          }
        }
        return { shiftId: shift.id, efficiency: null };
      });

      const efficiencyResults = await Promise.all(efficiencyPromises);
      const efficiencyMap: Record<string, any> = {};
      efficiencyResults.forEach((result) => {
        efficiencyMap[result.shiftId] = result.efficiency;
      });
      setEfficiencyData(efficiencyMap);
    } catch (error) {
      console.error('Failed to load shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getShiftDuration = (shift: Shift): string => {
    if (!shift.timeIn || !shift.timeOut) return '-';
    
    const start = new Date(shift.timeIn);
    const end = new Date(shift.timeOut);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHours}ч ${diffMinutes}м`;
  };

  const getLunchDuration = (shift: Shift): string => {
    if (!shift.lunchStart || !shift.lunchEnd) {
      // Check if it's marked as "no lunch"
      if (shift.lunchStart) {
        const lunchStartDate = new Date(shift.lunchStart);
        const noLunchMarker = new Date('1970-01-01T00:00:00.000Z');
        if (lunchStartDate.getTime() === noLunchMarker.getTime()) {
          return 'Без обеда';
        }
      }
      return '-';
    }
    
    const start = new Date(shift.lunchStart);
    const end = new Date(shift.lunchEnd);
    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    return `${diffMinutes} мин`;
  };

  if (loading) {
    return (
      <Container sx={{ px: { xs: 1, sm: 2 } }}>
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
        История смен
      </Typography>

      {shifts.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Нет данных о сменах
          </Typography>
        </Paper>
      ) : isMobile ? (
        // Мобильный вид: карточки
        <Box>
          {shifts.map((shift) => {
            const efficiency = efficiencyData[shift.id];
            const tasksCount = efficiency?.workLogsCount || 0;
            const avgEfficiency = efficiency?.efficiency || 0;

            return (
              <Card key={shift.id} sx={{ mb: 2 }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Typography 
                    variant="h6"
                    sx={{ 
                      fontSize: { xs: '0.9375rem', sm: '1.125rem' },
                      fontWeight: 600,
                      mb: 1.5
                    }}
                  >
                    {format(new Date(shift.date), 'dd MMM yyyy', { locale: ru })}
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}
                    >
                      Время начала
                    </Typography>
                    <Typography 
                      variant="body2"
                      sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' }, fontWeight: 500 }}
                    >
                      {shift.timeIn ? format(new Date(shift.timeIn), 'HH:mm') : '-'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}
                    >
                      Время окончания
                    </Typography>
                    <Typography 
                      variant="body2"
                      sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' }, fontWeight: 500 }}
                    >
                      {shift.timeOut ? format(new Date(shift.timeOut), 'HH:mm') : '-'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}
                    >
                      Длительность смены
                    </Typography>
                    <Typography 
                      variant="body2"
                      sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' }, fontWeight: 500 }}
                    >
                      {getShiftDuration(shift)}
                    </Typography>
                  </Box>

                  {(shift.lunchStart || shift.lunchEnd) && (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}
                        >
                          Обед
                        </Typography>
                        <Typography 
                          variant="body2"
                          sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
                        >
                          {shift.lunchStart ? (
                            shift.lunchEnd ? (
                              `${format(new Date(shift.lunchStart), 'HH:mm')} - ${format(new Date(shift.lunchEnd), 'HH:mm')}`
                            ) : (
                              format(new Date(shift.lunchStart), 'HH:mm')
                            )
                          ) : (
                            '-'
                          )}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}
                        >
                          Длительность обеда
                        </Typography>
                        <Typography 
                          variant="body2"
                          sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
                        >
                          {getLunchDuration(shift)}
                        </Typography>
                      </Box>
                    </>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}
                    >
                      Выполнено задач
                    </Typography>
                    <Typography 
                      variant="body2"
                      sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' }, fontWeight: 500 }}
                    >
                      {tasksCount}
                    </Typography>
                  </Box>

                  {avgEfficiency > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}
                      >
                        КПД
                      </Typography>
                      <Chip
                        label={`${avgEfficiency.toFixed(1)}%`}
                        size="small"
                        color={avgEfficiency >= 100 ? 'success' : avgEfficiency >= 80 ? 'warning' : 'error'}
                        sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}
                      />
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 2 }}>
                    {shift.isLate && <Chip label="Опоздание" size="small" color="error" sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }} />}
                    {!shift.timeOut && <Chip label="В процессе" size="small" color="info" sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }} />}
                    {shift.timeOut && !shift.isLate && <Chip label="Завершена" size="small" color="success" sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }} />}
                  </Box>
                </CardContent>
              </Card>
            );
          })}
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
                <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Дата</TableCell>
                <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Время начала</TableCell>
                <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Время окончания</TableCell>
                <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Длительность смены</TableCell>
                <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Обед</TableCell>
                <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Длительность обеда</TableCell>
                <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Выполнено задач</TableCell>
                <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>КПД</TableCell>
                <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Статус</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {shifts.map((shift) => {
                const efficiency = efficiencyData[shift.id];
                const tasksCount = efficiency?.workLogsCount || 0;
                const avgEfficiency = efficiency?.efficiency || 0;

                return (
                  <TableRow key={shift.id}>
                    <TableCell sx={{ fontSize: { sm: '0.8125rem', md: '0.875rem' } }}>
                      {format(new Date(shift.date), 'dd MMM yyyy', { locale: ru })}
                    </TableCell>
                    <TableCell sx={{ fontSize: { sm: '0.8125rem', md: '0.875rem' } }}>
                      {shift.timeIn ? format(new Date(shift.timeIn), 'HH:mm') : '-'}
                    </TableCell>
                    <TableCell sx={{ fontSize: { sm: '0.8125rem', md: '0.875rem' } }}>
                      {shift.timeOut ? format(new Date(shift.timeOut), 'HH:mm') : '-'}
                    </TableCell>
                    <TableCell sx={{ fontSize: { sm: '0.8125rem', md: '0.875rem' } }}>{getShiftDuration(shift)}</TableCell>
                    <TableCell sx={{ fontSize: { sm: '0.8125rem', md: '0.875rem' } }}>
                      {shift.lunchStart ? (
                        shift.lunchEnd ? (
                          `${format(new Date(shift.lunchStart), 'HH:mm')} - ${format(new Date(shift.lunchEnd), 'HH:mm')}`
                        ) : (
                          format(new Date(shift.lunchStart), 'HH:mm')
                        )
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell sx={{ fontSize: { sm: '0.8125rem', md: '0.875rem' } }}>{getLunchDuration(shift)}</TableCell>
                    <TableCell sx={{ fontSize: { sm: '0.8125rem', md: '0.875rem' } }}>{tasksCount}</TableCell>
                    <TableCell>
                      {avgEfficiency > 0 ? (
                        <Chip
                          label={`${avgEfficiency.toFixed(1)}%`}
                          size="small"
                          color={avgEfficiency >= 100 ? 'success' : avgEfficiency >= 80 ? 'warning' : 'error'}
                          sx={{ fontSize: '0.75rem' }}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {shift.isLate && <Chip label="Опоздание" size="small" color="error" sx={{ fontSize: '0.75rem' }} />}
                        {!shift.timeOut && <Chip label="В процессе" size="small" color="info" sx={{ fontSize: '0.75rem' }} />}
                        {shift.timeOut && !shift.isLate && <Chip label="Завершена" size="small" color="success" sx={{ fontSize: '0.75rem' }} />}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default ShiftsHistory;

