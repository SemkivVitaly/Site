import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { DatePicker } from '@mui/x-date-pickers';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isFuture, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { shiftsApi, Shift } from '../../api/shifts.api';
import { analyticsApi } from '../../api/analytics.api';
import { worklogsApi, WorkLog } from '../../api/worklogs.api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { CalendarToday, TrendingUp, Assignment, AccessTime, Delete } from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const EmployeeStats: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [tab, setTab] = useState(0);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [efficiencyData, setEfficiencyData] = useState<any>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendar, setCalendar] = useState<Record<string, Shift[]>>({});
  const [planShiftDialog, setPlanShiftDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [plannedStart, setPlannedStart] = useState<Date | null>(null);
  const [planningShift, setPlanningShift] = useState(false);
  const [cancellingShift, setCancellingShift] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (tab === 2) {
      loadCalendar();
    }
  }, [tab, currentMonth]);

  const loadData = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

      // Load shifts
      const shiftsData = await shiftsApi.getShifts({
        userId: user?.id,
        startDate: startOfYear.toISOString(),
        endDate: endOfYear.toISOString(),
      });
      setShifts(shiftsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

      // Load efficiency for current month
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      try {
        const efficiency = await analyticsApi.getEmployeeEfficiency(
          user!.id,
          monthStart.toISOString(),
          monthEnd.toISOString()
        );
        setEfficiencyData(efficiency);
      } catch (error) {
        console.error('Failed to load efficiency:', error);
      }

      // Load completed work logs (sessions of work) for the user
      const completedWorkLogs = await worklogsApi.getWorkLogsByUserAndDate(
        user!.id,
        startOfYear.toISOString(),
        endOfYear.toISOString()
      );
      setWorkLogs(completedWorkLogs.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()));
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCalendar = async () => {
    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      // Используем формат YYYY-MM-DD для избежания проблем с часовыми поясами
      const startStr = format(start, 'yyyy-MM-dd');
      const endStr = format(end, 'yyyy-MM-dd');
      const calendarData = await shiftsApi.getShiftCalendar(startStr, endStr);
      setCalendar(calendarData);
    } catch (error) {
      console.error('Failed to load calendar:', error);
    }
  };

  // Проверяет, является ли выбранная дата прошедшей (без учета времени)
  const isPastDate = (date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    return dateOnly < today;
  };

  // Получает минимальную дату для DatePicker (сегодня)
  const getMinDate = (): Date => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const handlePlanShift = async () => {
    if (!selectedDate || !user) {
      showError('Выберите дату для планирования смены');
      return;
    }

    try {
      setPlanningShift(true);
      // Format date as YYYY-MM-DD (date only, no time)
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Combine selected date with planned time if provided
      let plannedStartStr: string | undefined;
      if (plannedStart) {
        const combinedDateTime = new Date(selectedDate);
        combinedDateTime.setHours(plannedStart.getHours(), plannedStart.getMinutes(), 0, 0);
        plannedStartStr = format(combinedDateTime, "yyyy-MM-dd'T'HH:mm:ss");
      }
      
      await shiftsApi.createShift({
        userId: user.id,
        date: dateStr,
        plannedStart: plannedStartStr,
      });
      showSuccess('Смена успешно запланирована');
      setPlanShiftDialog(false);
      setSelectedDate(null);
      setPlannedStart(null);
      loadCalendar();
      loadData();
    } catch (error: any) {
      showError(error.response?.data?.error || 'Не удалось запланировать смену');
    } finally {
      setPlanningShift(false);
    }
  };

  const handleCancelShift = async (shiftId: string) => {
    if (!window.confirm('Вы уверены, что хотите отменить запланированную смену?')) {
      return;
    }

    try {
      setCancellingShift(shiftId);
      await shiftsApi.deleteShift(shiftId);
      showSuccess('Смена успешно отменена');
      loadCalendar();
      loadData();
    } catch (error: any) {
      showError(error.response?.data?.error || 'Не удалось отменить смену');
    } finally {
      setCancellingShift(null);
    }
  };

  const getShiftDuration = (shift: Shift): string => {
    if (!shift.timeIn || !shift.timeOut) {
      if (shift.plannedStart) {
        return 'Запланирована';
      }
      return '-';
    }

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

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getShiftsForDate = (date: Date): Shift[] => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return calendar[dateKey] || [];
  };

  const hasShiftOnDate = (date: Date): boolean => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayShifts = calendar[dateKey] || [];
    return dayShifts.some((shift) => shift.userId === user?.id);
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
        Моя статистика
      </Typography>

      <Tabs value={tab} onChange={(_, newValue) => setTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Обзор" icon={<TrendingUp />} iconPosition="start" />
        <Tab label="Смены" icon={<AccessTime />} iconPosition="start" />
        <Tab label="Планирование" icon={<CalendarToday />} iconPosition="start" />
        <Tab label="Выполненная работа" icon={<Assignment />} iconPosition="start" />
      </Tabs>

      <TabPanel value={tab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  КПД за текущий месяц
                </Typography>
                <Typography variant="h4">
                  {efficiencyData?.efficiency ? `${efficiencyData.efficiency.toFixed(1)}%` : '-'}
                </Typography>
                {efficiencyData && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      Выполнено задач: {efficiencyData.workLogsCount || 0}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Фактически: {efficiencyData.totalActual || 0} шт
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Ожидалось: {efficiencyData.totalExpected || 0} шт
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Всего смен
                </Typography>
                <Typography variant="h4">{shifts.length}</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Запланировано: {shifts.filter((s) => s.plannedStart && !s.timeIn).length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Завершено: {shifts.filter((s) => s.timeOut).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Выполнено сессий работы
                </Typography>
                <Typography variant="h4">{workLogs.length}</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  За текущий год
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tab} index={1}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Дата</TableCell>
                <TableCell>Планируемое начало</TableCell>
                <TableCell>Время начала</TableCell>
                <TableCell>Время окончания</TableCell>
                <TableCell>Длительность</TableCell>
                <TableCell>Обед</TableCell>
                <TableCell>Статус</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {shifts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary">
                      Нет данных о сменах
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                shifts.map((shift) => (
                  <TableRow key={shift.id}>
                    <TableCell>
                      {format(new Date(shift.date), 'dd MMM yyyy', { locale: ru })}
                    </TableCell>
                    <TableCell>
                      {shift.plannedStart
                        ? format(new Date(shift.plannedStart), 'HH:mm')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {shift.timeIn ? format(new Date(shift.timeIn), 'HH:mm') : '-'}
                    </TableCell>
                    <TableCell>
                      {shift.timeOut ? format(new Date(shift.timeOut), 'HH:mm') : '-'}
                    </TableCell>
                    <TableCell>{getShiftDuration(shift)}</TableCell>
                    <TableCell>{getLunchDuration(shift)}</TableCell>
                    <TableCell>
                      {!shift.timeIn && shift.plannedStart && (
                        <Chip label="Запланирована" size="small" color="info" />
                      )}
                      {shift.timeIn && !shift.timeOut && (
                        <Chip label="В процессе" size="small" color="warning" />
                      )}
                      {shift.timeOut && (
                        <Chip label="Завершена" size="small" color="success" />
                      )}
                      {shift.isLate && (
                        <Chip label="Опоздание" size="small" color="error" sx={{ ml: 1 }} />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={tab} index={2}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Button
              variant="outlined"
              onClick={() => {
                const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
                setCurrentMonth(prevMonth);
              }}
            >
              Предыдущий месяц
            </Button>
            <Typography variant="h6" component="span" sx={{ mx: 2 }}>
              {format(currentMonth, 'MMMM yyyy', { locale: ru })}
            </Typography>
            <Button
              variant="outlined"
              onClick={() => {
                const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
                setCurrentMonth(nextMonth);
              }}
            >
              Следующий месяц
            </Button>
          </Box>
          <Button variant="contained" onClick={() => setPlanShiftDialog(true)}>
            Запланировать смену
          </Button>
        </Box>

        <Grid container spacing={1}>
          {days.map((day) => {
            const dayShifts = getShiftsForDate(day);
            const myShift = dayShifts.find((s) => s.userId === user?.id);
            const isPast = day < new Date() && !isToday(day);
            const isFutureDate = isFuture(day) || isToday(day);

            return (
              <Grid item xs={12/7} sm={12/7} md={12/7} key={day.toISOString()}>
                <Paper
                  sx={{
                    p: 1,
                    textAlign: 'center',
                    minHeight: 100,
                    cursor: isFutureDate && !myShift ? 'pointer' : 'default',
                    bgcolor: isToday(day) ? 'primary.light' : myShift ? 'action.selected' : 'background.paper',
                    '&:hover': isFutureDate && !myShift ? { bgcolor: 'action.hover' } : {},
                  }}
                  onClick={() => {
                    if (isFutureDate && !myShift) {
                      setSelectedDate(day);
                      setPlanShiftDialog(true);
                    }
                  }}
                >
                  <Typography variant="caption" display="block">
                    {format(day, 'EEE', { locale: ru })}
                  </Typography>
                  <Typography variant="h6">{format(day, 'd')}</Typography>
                  {myShift && (
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={myShift.timeIn ? 'На смене' : 'Запланирована'}
                        size="small"
                        color={myShift.timeIn ? 'success' : 'info'}
                      />
                      {!myShift.timeIn && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelShift(myShift.id);
                          }}
                          disabled={cancellingShift === myShift.id}
                          sx={{ ml: 0.5, p: 0.5 }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  )}
                  {isFutureDate && !myShift && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Нажмите для планирования
                    </Typography>
                  )}
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </TabPanel>

      <TabPanel value={tab} index={3}>
        {(() => {
          // Группируем workLogs по датам выполнения
          const groupedByDate: Record<string, WorkLog[]> = {};
          workLogs.forEach((workLog) => {
            const dateKey = format(startOfDay(new Date(workLog.endTime || workLog.startTime)), 'yyyy-MM-dd');
            if (!groupedByDate[dateKey]) {
              groupedByDate[dateKey] = [];
            }
            groupedByDate[dateKey].push(workLog);
          });

          // Сортируем даты по убыванию (новые сначала)
          const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

          if (sortedDates.length === 0) {
            return (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Нет выполненных сессий работы
                </Typography>
              </Paper>
            );
          }

          return (
            <Box>
              {sortedDates.map((dateKey) => {
                const dateWorkLogs = groupedByDate[dateKey];
                const date = new Date(dateKey);
                const totalProduced = dateWorkLogs.reduce((sum, log) => sum + log.quantityProduced, 0);
                const totalDefects = dateWorkLogs.reduce((sum, log) => sum + log.defectQuantity, 0);

                return (
                  <Accordion key={dateKey} sx={{ mb: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mr: 2 }}>
                        <Typography variant="h6">
                          {format(date, 'dd MMMM yyyy', { locale: ru })}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Chip
                            label={`${dateWorkLogs.length} сессий`}
                            size="small"
                            color="primary"
                          />
                          <Chip
                            label={`Выполнено: ${totalProduced} шт`}
                            size="small"
                            color="success"
                          />
                          {totalDefects > 0 && (
                            <Chip
                              label={`Брак: ${totalDefects} шт`}
                              size="small"
                              color="error"
                            />
                          )}
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <TableContainer>
                        <Table size="small">
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
                            {dateWorkLogs.map((workLog) => (
                              <TableRow key={workLog.id}>
                                <TableCell>{workLog.task?.order?.title || '-'}</TableCell>
                                <TableCell>{workLog.task?.operation || '-'}</TableCell>
                                <TableCell>{workLog.task?.machine?.name || '-'}</TableCell>
                                <TableCell>{workLog.task?.totalQuantity || '-'}</TableCell>
                                <TableCell>{workLog.quantityProduced} шт</TableCell>
                                <TableCell>
                                  {format(new Date(workLog.startTime), 'HH:mm', { locale: ru })}
                                </TableCell>
                                <TableCell>
                                  {workLog.endTime
                                    ? format(new Date(workLog.endTime), 'HH:mm', { locale: ru })
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
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Box>
          );
        })()}
      </TabPanel>

      <Dialog open={planShiftDialog} onClose={() => setPlanShiftDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Запланировать смену</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <DatePicker
              label="Дата смены"
              value={selectedDate}
              onChange={(newValue) => setSelectedDate(newValue)}
              minDate={getMinDate()}
              slotProps={{
                textField: {
                  fullWidth: true,
                  margin: 'normal',
                },
              }}
            />
            <TextField
              label="Планируемое время начала (необязательно)"
              type="time"
              fullWidth
              margin="normal"
              value={plannedStart ? format(plannedStart, 'HH:mm') : ''}
              onChange={(e) => {
                if (e.target.value) {
                  const [hours, minutes] = e.target.value.split(':');
                  const time = new Date();
                  time.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
                  setPlannedStart(time);
                } else {
                  setPlannedStart(null);
                }
              }}
              InputLabelProps={{
                shrink: true,
              }}
            />
            {selectedDate && isPastDate(selectedDate) && (
              <Alert severity="error" sx={{ mt: 2 }}>
                Нельзя запланировать смену на прошедшую дату
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPlanShiftDialog(false)}>Отмена</Button>
          <Button
            onClick={handlePlanShift}
            variant="contained"
            disabled={!selectedDate || planningShift || isPastDate(selectedDate)}
          >
            {planningShift ? 'Планирование...' : 'Запланировать'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EmployeeStats;

