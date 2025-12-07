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
  TextField,
  Button,
  LinearProgress,
  Chip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { analyticsApi, EmployeeEfficiency } from '../../api/analytics.api';
import { usersApi, User } from '../../api/users.api';
import { format } from 'date-fns';

const EfficiencyDashboard: React.FC = () => {
  const [startDate, setStartDate] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [efficiencies, setEfficiencies] = useState<EmployeeEfficiency[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [efficienciesData, usersData] = await Promise.all([
        analyticsApi.getEmployeesEfficiency(
          startDate.toISOString(),
          endDate.toISOString()
        ),
        usersApi.getAll(),
      ]);

      const usersMap: Record<string, User> = {};
      usersData.forEach((user) => {
        usersMap[user.id] = user;
      });

      setEfficiencies(efficienciesData);
      setUsers(usersMap);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 100) return 'success';
    if (efficiency >= 80) return 'info';
    if (efficiency >= 60) return 'warning';
    return 'error';
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Аналитика КПД
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <DatePicker
              label="Начало периода"
              value={startDate}
              onChange={(date) => date && setStartDate(date)}
              slotProps={{ textField: { variant: 'outlined' } }}
            />
            <DatePicker
              label="Конец периода"
              value={endDate}
              onChange={(date) => date && setEndDate(date)}
              slotProps={{ textField: { variant: 'outlined' } }}
            />
            <Button variant="contained" onClick={loadData} sx={{ mt: 1 }}>
              Обновить
            </Button>
          </Box>
        </LocalizationProvider>
      </Paper>

      {loading ? (
        <LinearProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Сотрудник</TableCell>
                <TableCell align="right">Фактически</TableCell>
                <TableCell align="right">Ожидалось</TableCell>
                <TableCell align="right">КПД (%)</TableCell>
                <TableCell align="right">Записей</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {efficiencies.map((eff) => {
                const user = users[eff.userId];
                return (
                  <TableRow key={eff.userId}>
                    <TableCell>
                      {user ? `${user.firstName} ${user.lastName}` : 'Неизвестный пользователь'}
                    </TableCell>
                    <TableCell align="right">{eff.totalActual}</TableCell>
                    <TableCell align="right">
                      {Math.round(eff.totalExpected)}
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${eff.efficiency}%`}
                        color={getEfficiencyColor(eff.efficiency) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">{eff.workLogsCount}</TableCell>
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

export default EfficiencyDashboard;

