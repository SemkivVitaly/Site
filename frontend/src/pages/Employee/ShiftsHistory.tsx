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
} from '@mui/material';
import { shiftsApi, Shift } from '../../api/shifts.api';
import { analyticsApi } from '../../api/analytics.api';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const ShiftsHistory: React.FC = () => {
  const { user } = useAuth();
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
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        История смен
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Дата</TableCell>
              <TableCell>Время начала</TableCell>
              <TableCell>Время окончания</TableCell>
              <TableCell>Длительность смены</TableCell>
              <TableCell>Обед</TableCell>
              <TableCell>Длительность обеда</TableCell>
              <TableCell>Выполнено задач</TableCell>
              <TableCell>КПД</TableCell>
              <TableCell>Статус</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {shifts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography variant="body2" color="text.secondary">
                    Нет данных о сменах
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              shifts.map((shift) => {
                const efficiency = efficiencyData[shift.id];
                const tasksCount = efficiency?.workLogsCount || 0;
                const avgEfficiency = efficiency?.efficiency || 0;

                return (
                  <TableRow key={shift.id}>
                    <TableCell>
                      {format(new Date(shift.date), 'dd MMM yyyy', { locale: ru })}
                    </TableCell>
                    <TableCell>
                      {shift.timeIn ? format(new Date(shift.timeIn), 'HH:mm') : '-'}
                    </TableCell>
                    <TableCell>
                      {shift.timeOut ? format(new Date(shift.timeOut), 'HH:mm') : '-'}
                    </TableCell>
                    <TableCell>{getShiftDuration(shift)}</TableCell>
                    <TableCell>
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
                    <TableCell>{getLunchDuration(shift)}</TableCell>
                    <TableCell>{tasksCount}</TableCell>
                    <TableCell>
                      {avgEfficiency > 0 ? (
                        <Chip
                          label={`${avgEfficiency.toFixed(1)}%`}
                          size="small"
                          color={avgEfficiency >= 100 ? 'success' : avgEfficiency >= 80 ? 'warning' : 'error'}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {shift.isLate && <Chip label="Опоздание" size="small" color="error" />}
                      {!shift.timeOut && <Chip label="В процессе" size="small" color="info" />}
                      {shift.timeOut && !shift.isLate && <Chip label="Завершена" size="small" color="success" />}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default ShiftsHistory;

