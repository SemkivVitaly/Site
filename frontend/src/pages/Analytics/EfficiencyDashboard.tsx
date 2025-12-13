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
  Card,
  CardContent,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { analyticsApi, EmployeeEfficiency } from '../../api/analytics.api';
import { usersApi, User } from '../../api/users.api';
import { format } from 'date-fns';

const EfficiencyDashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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
    <Container sx={{ px: { xs: 1, sm: 2 } }}>
      <Typography 
        variant="h4" 
        gutterBottom
        sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' }, mb: { xs: 2, sm: 3 } }}
      >
        Аналитика КПД
      </Typography>

      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2, 
            mb: 2 
          }}>
            <DatePicker
              label="Начало периода"
              value={startDate}
              onChange={(date) => date && setStartDate(date)}
              slotProps={{ 
                textField: { 
                  variant: 'outlined',
                  fullWidth: isMobile,
                  sx: { fontSize: { xs: '0.875rem', sm: '1rem' } }
                } 
              }}
            />
            <DatePicker
              label="Конец периода"
              value={endDate}
              onChange={(date) => date && setEndDate(date)}
              slotProps={{ 
                textField: { 
                  variant: 'outlined',
                  fullWidth: isMobile,
                  sx: { fontSize: { xs: '0.875rem', sm: '1rem' } }
                } 
              }}
            />
            <Button 
              variant="contained" 
              onClick={loadData} 
              sx={{ 
                mt: { xs: 0, sm: 1 },
                width: { xs: '100%', sm: 'auto' },
                minWidth: { xs: 'auto', sm: '120px' }
              }}
            >
              Обновить
            </Button>
          </Box>
        </LocalizationProvider>
      </Paper>

      {loading ? (
        <LinearProgress />
      ) : isMobile ? (
        // Мобильный вид: карточки
        <Box>
          {efficiencies.map((eff) => {
            const user = users[eff.userId];
            return (
              <Card key={eff.userId} sx={{ mb: 2 }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Typography 
                    variant="h6"
                    sx={{ 
                      fontSize: { xs: '0.9375rem', sm: '1.125rem' },
                      fontWeight: 600,
                      mb: 1.5
                    }}
                  >
                    {user ? `${user.firstName} ${user.lastName}` : 'Неизвестный пользователь'}
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}
                    >
                      Фактически
                    </Typography>
                    <Typography 
                      variant="body2"
                      sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' }, fontWeight: 500 }}
                    >
                      {eff.totalActual}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}
                    >
                      Ожидалось
                    </Typography>
                    <Typography 
                      variant="body2"
                      sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' }, fontWeight: 500 }}
                    >
                      {Math.round(eff.totalExpected)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}
                    >
                      КПД
                    </Typography>
                    <Chip
                      label={`${eff.efficiency}%`}
                      color={getEfficiencyColor(eff.efficiency) as any}
                      size="small"
                      sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}
                    >
                      Записей
                    </Typography>
                    <Typography 
                      variant="body2"
                      sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' }, fontWeight: 500 }}
                    >
                      {eff.workLogsCount}
                    </Typography>
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
                <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Сотрудник</TableCell>
                <TableCell align="right" sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Фактически</TableCell>
                <TableCell align="right" sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Ожидалось</TableCell>
                <TableCell align="right" sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>КПД (%)</TableCell>
                <TableCell align="right" sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Записей</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {efficiencies.map((eff) => {
                const user = users[eff.userId];
                return (
                  <TableRow key={eff.userId}>
                    <TableCell sx={{ fontSize: { sm: '0.8125rem', md: '0.875rem' } }}>
                      {user ? `${user.firstName} ${user.lastName}` : 'Неизвестный пользователь'}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: { sm: '0.8125rem', md: '0.875rem' } }}>{eff.totalActual}</TableCell>
                    <TableCell align="right" sx={{ fontSize: { sm: '0.8125rem', md: '0.875rem' } }}>
                      {Math.round(eff.totalExpected)}
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${eff.efficiency}%`}
                        color={getEfficiencyColor(eff.efficiency) as any}
                        size="small"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: { sm: '0.8125rem', md: '0.875rem' } }}>{eff.workLogsCount}</TableCell>
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

