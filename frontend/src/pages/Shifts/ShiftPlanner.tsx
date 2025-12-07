import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Chip,
  Button,
} from '@mui/material';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { shiftsApi, Shift } from '../../api/shifts.api';
import { usersApi, User } from '../../api/users.api';
import ShiftDetails from './ShiftDetails';

const ShiftPlanner: React.FC = () => {
  const [calendar, setCalendar] = useState<Record<string, Shift[]>>({});
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [users, setUsers] = useState<User[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const loadData = useCallback(async () => {
    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      // Используем формат YYYY-MM-DD для избежания проблем с часовыми поясами
      const startStr = format(start, 'yyyy-MM-dd');
      const endStr = format(end, 'yyyy-MM-dd');
      const [calendarData, usersData] = await Promise.all([
        shiftsApi.getShiftCalendar(startStr, endStr),
        usersApi.getAll(),
      ]);
      setCalendar(calendarData);
      setUsers(usersData.filter((u) => u.role === 'EMPLOYEE'));
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, [currentMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getShiftsForDate = (date: Date): Shift[] => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return calendar[dateKey] || [];
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getShiftCount = (date: Date): number => {
    return getShiftsForDate(date).length;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  return (
    <Container>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Планировщик смен</Typography>
        <Box>
          <Button onClick={handlePrevMonth}>←</Button>
          <Typography variant="h6" component="span" sx={{ mx: 2 }}>
            {format(currentMonth, 'MMMM yyyy', { locale: ru })}
          </Typography>
          <Button onClick={handleNextMonth}>→</Button>
        </Box>
      </Box>

      <Grid container spacing={1}>
        {days.map((day) => {
          const shifts = getShiftsForDate(day);
          const isToday = isSameDay(day, new Date());

          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={day.toISOString()}>
              <Paper
                sx={{
                  p: 2,
                  border: isToday ? '2px solid' : '1px solid',
                  borderColor: isToday ? 'primary.main' : 'divider',
                  bgcolor: isToday ? 'action.hover' : 'background.paper',
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 4 },
                }}
                onClick={() => setSelectedDate(day)}
              >
                <Typography variant="subtitle2" gutterBottom>
                  {format(day, 'd MMM', { locale: ru })}
                </Typography>
                <Chip
                  label={`${shifts.length} чел.`}
                  size="small"
                  color={shifts.length > 0 ? 'primary' : 'default'}
                  sx={{ mb: 1 }}
                />
                {shifts.length > 0 && (
                  <Box>
                    {shifts.slice(0, 3).map((shift) => (
                      <Typography key={shift.id} variant="caption" display="block">
                        {shift.user.firstName} {shift.user.lastName}
                        {shift.isLate && (
                          <Chip label="Опоздание" size="small" color="error" sx={{ ml: 1 }} />
                        )}
                      </Typography>
                    ))}
                    {shifts.length > 3 && (
                      <Typography variant="caption" color="text.secondary">
                        и еще {shifts.length - 3}...
                      </Typography>
                    )}
                  </Box>
                )}
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {selectedDate && (
        <ShiftDetails
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </Container>
  );
};

export default ShiftPlanner;

