import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { shiftsApi, Shift } from '../../api/shifts.api';
import { analyticsApi } from '../../api/analytics.api';
import { worklogsApi, WorkLog } from '../../api/worklogs.api';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Assignment } from '@mui/icons-material';

interface ShiftDetailsProps {
  date: Date;
  onClose: () => void;
}

const ShiftDetails: React.FC<ShiftDetailsProps> = ({ date, onClose }) => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [efficiencyData, setEfficiencyData] = useState<Record<string, any>>({});
  const [workLogsByShift, setWorkLogsByShift] = useState<Record<string, WorkLog[]>>({});
  const [workLogsDialogOpen, setWorkLogsDialogOpen] = useState(false);
  const [selectedShiftForWorkLogs, setSelectedShiftForWorkLogs] = useState<{ shiftId: string; userName: string } | null>(null);

  const loadShifts = useCallback(async () => {
    try {
      setLoading(true);
      const dateKey = format(date, 'yyyy-MM-dd');
      // Используем формат YYYY-MM-DD для избежания проблем с часовыми поясами
      const calendar = await shiftsApi.getShiftCalendar(dateKey, dateKey);
      const dayShifts = calendar[dateKey] || [];
      setShifts(dayShifts);

      // Load efficiency data for each shift
      const efficiencyPromises = dayShifts.map(async (shift) => {
        if (shift.timeIn && shift.timeOut) {
          try {
            // Используем локальные компоненты даты для правильной обработки
            const shiftDate = new Date(shift.date);
            const startDate = new Date(shiftDate.getFullYear(), shiftDate.getMonth(), shiftDate.getDate(), 0, 0, 0, 0);
            const endDate = new Date(shiftDate.getFullYear(), shiftDate.getMonth(), shiftDate.getDate(), 23, 59, 59, 999);
            
            const efficiency = await analyticsApi.getEmployeeEfficiency(
              shift.userId,
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

      // Load work logs (completed tasks) for each shift
      const workLogsPromises = dayShifts.map(async (shift) => {
        try {
          // Используем локальные компоненты даты для правильной обработки
          const shiftDate = new Date(shift.date);
          const startDate = new Date(shiftDate.getFullYear(), shiftDate.getMonth(), shiftDate.getDate(), 0, 0, 0, 0);
          const endDate = new Date(shiftDate.getFullYear(), shiftDate.getMonth(), shiftDate.getDate(), 23, 59, 59, 999);
          
          const workLogs = await worklogsApi.getWorkLogsByUserAndDate(
            shift.userId,
            startDate.toISOString(),
            endDate.toISOString()
          );
          return { shiftId: shift.id, workLogs };
        } catch (error) {
          console.error(`Failed to load work logs for shift ${shift.id}:`, error);
          return { shiftId: shift.id, workLogs: [] };
        }
      });

      const workLogsResults = await Promise.all(workLogsPromises);
      const workLogsMap: Record<string, WorkLog[]> = {};
      workLogsResults.forEach((result) => {
        workLogsMap[result.shiftId] = result.workLogs;
      });
      setWorkLogsByShift(workLogsMap);
    } catch (error) {
      console.error('Failed to load shifts:', error);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getShiftDuration = (shift: Shift): string => {

  const isFutureDate = date > new Date();
  const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

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

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Смена: {format(date, 'dd MMM yyyy', { locale: ru })}
        {isFutureDate && <Chip label="Будущая смена" size="small" color="info" sx={{ ml: 2 }} />}
        {isToday && <Chip label="Сегодня" size="small" color="primary" sx={{ ml: 2 }} />}
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : shifts.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
            {isFutureDate ? 'На эту дату пока нет запланированных сотрудников' : 'Нет данных о смене'}
          </Typography>
        ) : (
          <Box>
            <Typography variant="subtitle1" gutterBottom sx={{ mb: 2 }}>
              Всего сотрудников: {shifts.length}
            </Typography>
            <List>
              {shifts.map((shift) => {
                const efficiency = efficiencyData[shift.id];
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const tasksCount = efficiency?.workLogsCount || 0;
                const avgEfficiency = efficiency?.efficiency || 0;

                return (
                  <ListItem
                    key={shift.id}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                    }}
                  >
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6">
                          {shift.user.firstName} {shift.user.lastName}
                        </Typography>
                        {shift.isLate && <Chip label="Опоздание" size="small" color="error" />}
                      </Box>
                      
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1 }}>
                        <Typography variant="body2">
                          <strong>Время начала:</strong>{' '}
                          {shift.timeIn ? format(new Date(shift.timeIn), 'HH:mm') : shift.plannedStart ? format(new Date(shift.plannedStart), 'HH:mm') : 'Не указано'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Время окончания:</strong>{' '}
                          {shift.timeOut ? format(new Date(shift.timeOut), 'HH:mm') : '-'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Обед:</strong>{' '}
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
                        <Typography variant="body2">
                          <strong>Длительность обеда:</strong> {getLunchDuration(shift)}
                        </Typography>
                      </Box>

                      {!isFutureDate && (
                        <Box sx={{ mt: 1 }}>
                          {avgEfficiency > 0 && (
                            <Typography variant="body2" sx={{ mb: 2 }}>
                              <strong>КПД:</strong>{' '}
                              <Chip
                                label={`${avgEfficiency.toFixed(1)}%`}
                                size="small"
                                color={avgEfficiency >= 100 ? 'success' : avgEfficiency >= 80 ? 'warning' : 'error'}
                              />
                            </Typography>
                          )}
                          {workLogsByShift[shift.id] && workLogsByShift[shift.id].length > 0 ? (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Assignment />}
                              onClick={() => {
                                setSelectedShiftForWorkLogs({
                                  shiftId: shift.id,
                                  userName: `${shift.user.firstName} ${shift.user.lastName}`,
                                });
                                setWorkLogsDialogOpen(true);
                              }}
                              sx={{ mt: 1 }}
                            >
                              Сессии работы ({workLogsByShift[shift.id].length})
                            </Button>
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              Нет завершенных сессий работы
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
      </DialogActions>
      
      {/* Диалог для отображения сессий работы */}
      <Dialog
        open={workLogsDialogOpen}
        onClose={() => setWorkLogsDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Сессии работы: {selectedShiftForWorkLogs?.userName}
        </DialogTitle>
        <DialogContent>
          {selectedShiftForWorkLogs && workLogsByShift[selectedShiftForWorkLogs.shiftId] && (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Заказ</TableCell>
                    <TableCell>Операция</TableCell>
                    <TableCell>Станок</TableCell>
                    <TableCell>Количество</TableCell>
                    <TableCell>Выполнено</TableCell>
                    <TableCell>Время начала</TableCell>
                    <TableCell>Время завершения</TableCell>
                    <TableCell>Брак</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {workLogsByShift[selectedShiftForWorkLogs.shiftId].map((workLog) => (
                    <TableRow key={workLog.id}>
                      <TableCell>{workLog.task?.order?.title || '-'}</TableCell>
                      <TableCell>{workLog.task?.operation || '-'}</TableCell>
                      <TableCell>{workLog.task?.machine?.name || '-'}</TableCell>
                      <TableCell>{workLog.task?.totalQuantity || '-'}</TableCell>
                      <TableCell>{workLog.quantityProduced} шт</TableCell>
                      <TableCell>
                        {workLog.startTime
                          ? format(new Date(workLog.startTime), 'dd MMM yyyy HH:mm', { locale: ru })
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {workLog.endTime
                          ? format(new Date(workLog.endTime), 'dd MMM yyyy HH:mm', { locale: ru })
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {workLog.defectQuantity > 0 ? (
                          <Chip
                            label={`${workLog.defectQuantity} шт`}
                            size="small"
                            color="error"
                          />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWorkLogsDialogOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default ShiftDetails;

