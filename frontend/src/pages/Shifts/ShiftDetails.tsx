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
import { worklogsApi, WorkLog, WorkLogPause } from '../../api/worklogs.api';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Assignment, Download, Pause } from '@mui/icons-material';
import * as XLSX from 'xlsx';

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
  const [pausesDialogOpen, setPausesDialogOpen] = useState(false);
  const [selectedWorkLogForPauses, setSelectedWorkLogForPauses] = useState<WorkLog | null>(null);

  useEffect(() => {
    loadShifts();
  }, [date]);

  const loadShifts = async () => {
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
  };

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

  const exportAllShiftsToExcel = () => {
    const shiftDate = format(date, 'dd.MM.yyyy');
    const workbook = XLSX.utils.book_new();

    // Создаем лист со сводной информацией по всем сменам
    const summaryData: any[] = [];
    
    // Заголовок
    summaryData.push(['СВОДНАЯ ИНФОРМАЦИЯ ПО СМЕНАМ']);
    summaryData.push(['Дата смены:', shiftDate]);
    summaryData.push(['Всего сотрудников:', shifts.length]);
    summaryData.push([]);
    
    // Заголовки таблицы смен
    summaryData.push([
      '№',
      'Сотрудник',
      'Планируемое начало',
      'Время начала',
      'Время окончания',
      'Длительность смены',
      'Обед начало',
      'Обед окончание',
      'Длительность обеда',
      'Опоздание',
      'КПД (%)',
      'Количество сессий',
    ]);

    // Данные по сменам
    shifts.forEach((shift, index) => {
      const efficiency = efficiencyData[shift.id];
      const workLogs = workLogsByShift[shift.id] || [];
      const avgEfficiency = efficiency?.efficiency || 0;
      
      summaryData.push([
        index + 1,
        `${shift.user.firstName} ${shift.user.lastName}`,
        shift.plannedStart ? format(new Date(shift.plannedStart), 'HH:mm') : '-',
        shift.timeIn ? format(new Date(shift.timeIn), 'HH:mm') : '-',
        shift.timeOut ? format(new Date(shift.timeOut), 'HH:mm') : '-',
        getShiftDuration(shift),
        shift.lunchStart ? format(new Date(shift.lunchStart), 'HH:mm') : '-',
        shift.lunchEnd ? format(new Date(shift.lunchEnd), 'HH:mm') : '-',
        getLunchDuration(shift),
        shift.isLate ? 'Да' : 'Нет',
        avgEfficiency > 0 ? avgEfficiency.toFixed(1) : '-',
        workLogs.length,
      ]);
    });

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Устанавливаем ширину колонок
    summarySheet['!cols'] = [
      { wch: 5 },  // №
      { wch: 25 }, // Сотрудник
      { wch: 18 }, // Планируемое начало
      { wch: 15 }, // Время начала
      { wch: 18 }, // Время окончания
      { wch: 18 }, // Длительность смены
      { wch: 15 }, // Обед начало
      { wch: 18 }, // Обед окончание
      { wch: 18 }, // Длительность обеда
      { wch: 12 }, // Опоздание
      { wch: 12 }, // КПД
      { wch: 18 }, // Количество сессий
    ];
    
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Сводка');

    // Создаем отдельный лист для каждой смены с детальной информацией
    shifts.forEach((shift, shiftIndex) => {
      const workLogs = workLogsByShift[shift.id] || [];
      const shiftData: any[] = [];
      
      // Заголовок смены
      shiftData.push([`СМЕНА: ${shift.user.firstName} ${shift.user.lastName}`]);
      shiftData.push(['Дата:', shiftDate]);
      shiftData.push([]);
      
      // Информация о смене
      shiftData.push(['ИНФОРМАЦИЯ О СМЕНЕ']);
      shiftData.push(['Планируемое начало:', shift.plannedStart ? format(new Date(shift.plannedStart), 'HH:mm') : '-']);
      shiftData.push(['Время начала:', shift.timeIn ? format(new Date(shift.timeIn), 'HH:mm') : '-']);
      shiftData.push(['Время окончания:', shift.timeOut ? format(new Date(shift.timeOut), 'HH:mm') : '-']);
      shiftData.push(['Длительность смены:', getShiftDuration(shift)]);
      shiftData.push(['Обед начало:', shift.lunchStart ? format(new Date(shift.lunchStart), 'HH:mm') : '-']);
      shiftData.push(['Обед окончание:', shift.lunchEnd ? format(new Date(shift.lunchEnd), 'HH:mm') : '-']);
      shiftData.push(['Длительность обеда:', getLunchDuration(shift)]);
      shiftData.push(['Опоздание:', shift.isLate ? 'Да' : 'Нет']);
      
      const efficiency = efficiencyData[shift.id];
      if (efficiency && efficiency.efficiency > 0) {
        shiftData.push(['КПД:', `${efficiency.efficiency.toFixed(1)}%`]);
      }
      
      shiftData.push([]);
      shiftData.push(['СЕССИИ РАБОТЫ']);
      shiftData.push([]);
      
      // Заголовки сессий
      shiftData.push([
        '№',
        'Заказ',
        'Операция',
        'Станок',
        'Количество (план)',
        'Выполнено',
        'Брак',
        'Время начала',
        'Время завершения',
        'Время работы',
        'Время пауз',
        'Количество пауз',
      ]);

      // Данные сессий
      workLogs.forEach((workLog, logIndex) => {
        let workDuration = '-';
        let pauseDuration = '-';
        let pauseCount = 0;
        
        if (workLog.startTime && workLog.endTime) {
          const start = new Date(workLog.startTime).getTime();
          const end = new Date(workLog.endTime).getTime();
          const totalMs = end - start;
          
          let pauseTimeMs = 0;
          if (workLog.pauses) {
            const completedPauses = workLog.pauses.filter((p) => p.pauseEnd);
            pauseCount = completedPauses.length;
            completedPauses.forEach((pause) => {
              pauseTimeMs += new Date(pause.pauseEnd!).getTime() - new Date(pause.pauseStart).getTime();
            });
          }
          
          const workTimeMs = totalMs - pauseTimeMs;
          const workHours = Math.floor(workTimeMs / (1000 * 60 * 60));
          const workMinutes = Math.floor((workTimeMs % (1000 * 60 * 60)) / (1000 * 60));
          workDuration = `${workHours}ч ${workMinutes}м`;
          
          if (pauseTimeMs > 0) {
            const pauseHours = Math.floor(pauseTimeMs / (1000 * 60 * 60));
            const pauseMinutes = Math.floor((pauseTimeMs % (1000 * 60 * 60)) / (1000 * 60));
            pauseDuration = `${pauseHours}ч ${pauseMinutes}м`;
          } else {
            pauseDuration = '0м';
          }
        }

        shiftData.push([
          logIndex + 1,
          workLog.task?.order?.title || '-',
          workLog.task?.operation || '-',
          workLog.task?.machine?.name || '-',
          workLog.task?.totalQuantity || '-',
          workLog.quantityProduced,
          workLog.defectQuantity,
          workLog.startTime ? format(new Date(workLog.startTime), 'dd.MM.yyyy HH:mm') : '-',
          workLog.endTime ? format(new Date(workLog.endTime), 'dd.MM.yyyy HH:mm') : '-',
          workDuration,
          pauseDuration,
          pauseCount,
        ]);

        // Добавляем детальную информацию о паузах для этой сессии
        if (workLog.pauses && workLog.pauses.length > 0) {
          const completedPauses = workLog.pauses.filter((p) => p.pauseEnd);
          if (completedPauses.length > 0) {
            shiftData.push([]);
            shiftData.push([`Паузы для сессии ${logIndex + 1}:`]);
            shiftData.push([
              '№ паузы',
              'Время начала паузы',
              'Время окончания паузы',
              'Длительность паузы',
            ]);

            let totalPauseMs = 0;
            completedPauses.forEach((pause, pauseIndex) => {
              const pauseStart = new Date(pause.pauseStart);
              const pauseEnd = new Date(pause.pauseEnd!);
              const pauseDurationMs = pauseEnd.getTime() - pauseStart.getTime();
              totalPauseMs += pauseDurationMs;

              const pauseHours = Math.floor(pauseDurationMs / (1000 * 60 * 60));
              const pauseMinutes = Math.floor((pauseDurationMs % (1000 * 60 * 60)) / (1000 * 60));
              const pauseSeconds = Math.floor((pauseDurationMs % (1000 * 60)) / 1000);
              const pauseDurationStr = pauseHours > 0 
                ? `${pauseHours}ч ${pauseMinutes}м ${pauseSeconds}с`
                : pauseMinutes > 0
                ? `${pauseMinutes}м ${pauseSeconds}с`
                : `${pauseSeconds}с`;

              shiftData.push([
                pauseIndex + 1,
                format(pauseStart, 'dd.MM.yyyy HH:mm:ss'),
                format(pauseEnd, 'dd.MM.yyyy HH:mm:ss'),
                pauseDurationStr,
              ]);
            });

            // Добавляем строку с общим временем пауз
            const totalPauseHours = Math.floor(totalPauseMs / (1000 * 60 * 60));
            const totalPauseMinutes = Math.floor((totalPauseMs % (1000 * 60 * 60)) / (1000 * 60));
            const totalPauseSeconds = Math.floor((totalPauseMs % (1000 * 60)) / 1000);
            const totalPauseDurationStr = totalPauseHours > 0 
              ? `${totalPauseHours}ч ${totalPauseMinutes}м ${totalPauseSeconds}с`
              : totalPauseMinutes > 0
              ? `${totalPauseMinutes}м ${totalPauseSeconds}с`
              : `${totalPauseSeconds}с`;

            shiftData.push([
              'ИТОГО',
              '',
              '',
              totalPauseDurationStr,
            ]);
            shiftData.push([]);
          }
        }
      });

      const sheet = XLSX.utils.aoa_to_sheet(shiftData);
      
      // Устанавливаем ширину колонок
      sheet['!cols'] = [
        { wch: 5 },  // №
        { wch: 30 }, // Заказ
        { wch: 25 }, // Операция
        { wch: 20 }, // Станок
        { wch: 18 }, // Количество (план)
        { wch: 12 }, // Выполнено
        { wch: 10 }, // Брак
        { wch: 20 }, // Время начала
        { wch: 20 }, // Время завершения
        { wch: 15 }, // Время работы
        { wch: 15 }, // Время пауз
        { wch: 15 }, // Количество пауз
      ];
      
      // Ограничиваем длину имени листа (Excel ограничение - 31 символ)
      const sheetName = `${shiftIndex + 1}. ${shift.user.firstName} ${shift.user.lastName}`.substring(0, 31);
      XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
    });

    // Сохраняем файл
    const fileName = `Смены_${shiftDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            Смена: {format(date, 'dd MMM yyyy', { locale: ru })}
            {isFutureDate && <Chip label="Будущая смена" size="small" color="info" sx={{ ml: 2 }} />}
            {isToday && <Chip label="Сегодня" size="small" color="primary" sx={{ ml: 2 }} />}
          </Box>
          {!isFutureDate && shifts.length > 0 && (
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={exportAllShiftsToExcel}
              color="primary"
            >
              Экспорт смены
            </Button>
          )}
        </Box>
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
                        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {avgEfficiency > 0 && (
                            <Typography variant="body2" sx={{ mb: 2, width: '100%' }}>
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
                    <TableCell>Время работы</TableCell>
                    <TableCell>Время пауз</TableCell>
                    <TableCell>Брак</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {workLogsByShift[selectedShiftForWorkLogs.shiftId].map((workLog) => {
                    // Вычисляем время работы (исключая паузы)
                    let workDuration = '-';
                    let pauseDuration = '-';
                    if (workLog.startTime && workLog.endTime) {
                      const start = new Date(workLog.startTime).getTime();
                      const end = new Date(workLog.endTime).getTime();
                      const totalMs = end - start;
                      
                      // Вычитаем время всех пауз
                      let pauseTimeMs = 0;
                      if (workLog.pauses) {
                        workLog.pauses.forEach((pause) => {
                          if (pause.pauseEnd) {
                            const pauseStart = new Date(pause.pauseStart).getTime();
                            const pauseEnd = new Date(pause.pauseEnd).getTime();
                            pauseTimeMs += pauseEnd - pauseStart;
                          }
                        });
                      }
                      
                      const workTimeMs = totalMs - pauseTimeMs;
                      const workHours = Math.floor(workTimeMs / (1000 * 60 * 60));
                      const workMinutes = Math.floor((workTimeMs % (1000 * 60 * 60)) / (1000 * 60));
                      workDuration = `${workHours}ч ${workMinutes}м`;
                      
                      if (pauseTimeMs > 0) {
                        const pauseHours = Math.floor(pauseTimeMs / (1000 * 60 * 60));
                        const pauseMinutes = Math.floor((pauseTimeMs % (1000 * 60 * 60)) / (1000 * 60));
                        pauseDuration = `${pauseHours}ч ${pauseMinutes}м`;
                      } else {
                        pauseDuration = '0м';
                      }
                    }

                    return (
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
                        <TableCell>{workDuration}</TableCell>
                        <TableCell>
                          {pauseDuration !== '-' && pauseDuration !== '0м' && workLog.pauses && workLog.pauses.length > 0 ? (
                            <Button
                              variant="text"
                              size="small"
                              startIcon={<Pause />}
                              onClick={() => {
                                setSelectedWorkLogForPauses(workLog);
                                setPausesDialogOpen(true);
                              }}
                              sx={{ textTransform: 'none' }}
                            >
                              {pauseDuration} ({workLog.pauses.filter((p) => p.pauseEnd).length} пауз)
                            </Button>
                          ) : (
                            pauseDuration
                          )}
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
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWorkLogsDialogOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>

      {/* Диалог для отображения пауз */}
      <Dialog
        open={pausesDialogOpen}
        onClose={() => setPausesDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Паузы: {selectedWorkLogForPauses?.task?.operation || 'Сессия работы'}
        </DialogTitle>
        <DialogContent>
          {selectedWorkLogForPauses && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Заказ: {selectedWorkLogForPauses.task?.order?.title || '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Станок: {selectedWorkLogForPauses.task?.machine?.name || '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                Время работы: {selectedWorkLogForPauses.startTime
                  ? format(new Date(selectedWorkLogForPauses.startTime), 'dd.MM.yyyy HH:mm', { locale: ru })
                  : '-'} - {selectedWorkLogForPauses.endTime
                  ? format(new Date(selectedWorkLogForPauses.endTime), 'dd.MM.yyyy HH:mm', { locale: ru })
                  : '-'}
              </Typography>

              {selectedWorkLogForPauses.pauses && selectedWorkLogForPauses.pauses.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>№</TableCell>
                        <TableCell>Время начала паузы</TableCell>
                        <TableCell>Время окончания паузы</TableCell>
                        <TableCell>Длительность</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedWorkLogForPauses.pauses
                        .filter((p) => p.pauseEnd)
                        .map((pause, index) => {
                          const start = new Date(pause.pauseStart);
                          const end = new Date(pause.pauseEnd!);
                          const durationMs = end.getTime() - start.getTime();
                          const hours = Math.floor(durationMs / (1000 * 60 * 60));
                          const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
                          const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
                          const duration = hours > 0 
                            ? `${hours}ч ${minutes}м ${seconds}с`
                            : minutes > 0
                            ? `${minutes}м ${seconds}с`
                            : `${seconds}с`;

                          return (
                            <TableRow key={pause.id}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>
                                {format(start, 'dd.MM.yyyy HH:mm:ss', { locale: ru })}
                              </TableCell>
                              <TableCell>
                                {format(end, 'dd.MM.yyyy HH:mm:ss', { locale: ru })}
                              </TableCell>
                              <TableCell>
                                <Chip label={duration} size="small" color="warning" />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      <TableRow>
                        <TableCell colSpan={3} align="right">
                          <strong>Общее время пауз:</strong>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            let totalPauseMs = 0;
                            selectedWorkLogForPauses.pauses?.forEach((pause) => {
                              if (pause.pauseEnd) {
                                totalPauseMs += new Date(pause.pauseEnd).getTime() - new Date(pause.pauseStart).getTime();
                              }
                            });
                            const totalHours = Math.floor(totalPauseMs / (1000 * 60 * 60));
                            const totalMinutes = Math.floor((totalPauseMs % (1000 * 60 * 60)) / (1000 * 60));
                            const totalSeconds = Math.floor((totalPauseMs % (1000 * 60)) / 1000);
                            const totalDuration = totalHours > 0 
                              ? `${totalHours}ч ${totalMinutes}м ${totalSeconds}с`
                              : totalMinutes > 0
                              ? `${totalMinutes}м ${totalSeconds}с`
                              : `${totalSeconds}с`;
                            return <Chip label={totalDuration} size="small" color="error" />;
                          })()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  Нет зарегистрированных пауз для этой сессии
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPausesDialogOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default ShiftDetails;

