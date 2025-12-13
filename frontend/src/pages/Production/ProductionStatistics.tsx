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
  Grid,
  Button,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, startOfMonth, endOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { analyticsApi, type ProductionStatistics as ProductionStatisticsType } from '../../api/analytics.api';
import { useNotification } from '../../contexts/NotificationContext';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const ProductionStatistics: React.FC = () => {
  const { showError } = useNotification();
  const [statistics, setStatistics] = useState<ProductionStatisticsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | null>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | null>(endOfDay(new Date()));

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const start = startDate ? format(startDate, 'yyyy-MM-dd') : undefined;
      const end = endDate ? format(endDate, 'yyyy-MM-dd') : undefined;
      const data = await analyticsApi.getProductionStatistics(start, end);
      setStatistics(data);
    } catch (error: any) {
      console.error('Failed to load statistics:', error);
      showError(error.response?.data?.error || 'Ошибка загрузки статистики');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = () => {
    loadStatistics();
  };

  if (loading && !statistics) {
    return (
      <Container sx={{ px: { xs: 1, sm: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!statistics) {
    return (
      <Container sx={{ px: { xs: 1, sm: 2 } }}>
        <Alert severity="error">Не удалось загрузить статистику</Alert>
      </Container>
    );
  }

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 100) return 'success.main';
    if (efficiency >= 80) return 'info.main';
    if (efficiency >= 60) return 'warning.main';
    return 'error.main';
  };

  // Форматируем данные для графиков
  const dailyChartData = statistics.daily.map((day) => ({
    date: format(new Date(day.date), 'dd.MM'),
    actual: day.actualQuantity,
    expected: day.expectedQuantity,
    efficiency: day.efficiency,
  }));

  return (
    <Container maxWidth={false} sx={{ px: { xs: 0.5, sm: 2 }, overflowX: 'visible' }}>
        <Box sx={{ mb: 3, mt: { xs: 1, sm: 2 } }}>
          <Typography 
            variant="h4" 
            gutterBottom
            sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
          >
            Статистика производительности производства
          </Typography>
        </Box>

        {/* Фильтры */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <DatePicker
                label="Дата начала"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <DatePicker
                label="Дата окончания"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button variant="contained" onClick={handleApplyFilter} fullWidth>
                Применить фильтр
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Общая статистика */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Произведено (факт)
                </Typography>
                <Typography variant="h4">
                  {statistics.overall.totalActualQuantity.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Ожидалось
                </Typography>
                <Typography variant="h4">
                  {statistics.overall.totalExpectedQuantity.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Эффективность
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ color: getEfficiencyColor(statistics.overall.efficiency) }}
                >
                  {statistics.overall.efficiency.toFixed(1)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Процент брака
                </Typography>
                <Typography variant="h4" color={statistics.overall.defectRate > 5 ? 'error.main' : 'text.primary'}>
                  {statistics.overall.defectRate.toFixed(2)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Графики */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Производительность по дням
              </Typography>
              <ResponsiveContainer width="100%" height={window.innerWidth <= 600 ? 250 : 300}>
                <BarChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="actual" fill="#8884d8" name="Факт (шт)" />
                  <Bar dataKey="expected" fill="#82ca9d" name="Ожидалось (шт)" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Эффективность по дням (%)
              </Typography>
              <ResponsiveContainer width="100%" height={window.innerWidth <= 600 ? 250 : 300}>
                <LineChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 120]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="efficiency"
                    stroke="#8884d8"
                    name="Эффективность (%)"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey={() => 100}
                    stroke="#82ca9d"
                    name="Норма (100%)"
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* Статистика по станкам */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Производительность по станкам
          </Typography>
          <TableContainer
            sx={{
              overflowX: 'auto !important',
              overflowY: 'visible !important',
              WebkitOverflowScrolling: 'touch !important',
              touchAction: 'pan-x pan-y !important',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(0,0,0,0.4) rgba(0,0,0,0.1)',
              position: 'relative',
              width: '100%',
              '&::-webkit-scrollbar': {
                height: '14px !important',
                display: 'block !important',
                WebkitAppearance: 'none !important',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(0,0,0,0.1) !important',
                borderRadius: '7px !important',
                margin: '2px !important',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(0,0,0,0.4) !important',
                borderRadius: '7px !important',
                border: '3px solid rgba(255,255,255,0.9) !important',
                minHeight: '20px !important',
                '&:hover': {
                  background: 'rgba(0,0,0,0.6) !important',
                },
              },
            }}
          >
            <Table sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Станок</TableCell>
                  <TableCell align="right">Произведено (факт)</TableCell>
                  <TableCell align="right">Ожидалось</TableCell>
                  <TableCell align="right">Часов работы</TableCell>
                  <TableCell align="right">Эффективность (%)</TableCell>
                  <TableCell align="right">Брак (шт)</TableCell>
                  <TableCell align="right">% брака</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {statistics.byMachine.map((machine) => (
                  <TableRow key={machine.machineId}>
                    <TableCell>{machine.machineName}</TableCell>
                    <TableCell align="right">{machine.actualQuantity.toLocaleString()}</TableCell>
                    <TableCell align="right">{machine.expectedQuantity.toLocaleString()}</TableCell>
                    <TableCell align="right">{machine.hours.toFixed(1)}</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${machine.efficiency.toFixed(1)}%`}
                        color={
                          machine.efficiency >= 100
                            ? 'success'
                            : machine.efficiency >= 80
                            ? 'info'
                            : machine.efficiency >= 60
                            ? 'warning'
                            : 'error'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">{machine.defects}</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${machine.defectRate.toFixed(2)}%`}
                        color={machine.defectRate > 5 ? 'error' : 'default'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Статистика по дням */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Детальная статистика по дням
          </Typography>
          <TableContainer
            sx={{
              overflowX: 'auto !important',
              overflowY: 'visible !important',
              WebkitOverflowScrolling: 'touch !important',
              touchAction: 'pan-x pan-y !important',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(0,0,0,0.4) rgba(0,0,0,0.1)',
              position: 'relative',
              width: '100%',
              '&::-webkit-scrollbar': {
                height: '14px !important',
                display: 'block !important',
                WebkitAppearance: 'none !important',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(0,0,0,0.1) !important',
                borderRadius: '7px !important',
                margin: '2px !important',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(0,0,0,0.4) !important',
                borderRadius: '7px !important',
                border: '3px solid rgba(255,255,255,0.9) !important',
                minHeight: '20px !important',
                '&:hover': {
                  background: 'rgba(0,0,0,0.6) !important',
                },
              },
            }}
          >
            <Table size="small" sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.9375rem' } }}>Дата</TableCell>
                  <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.9375rem' } }}>Произведено (факт)</TableCell>
                  <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.9375rem' } }}>Ожидалось</TableCell>
                  <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.9375rem' } }}>Часов работы</TableCell>
                  <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.9375rem' } }}>Эффективность (%)</TableCell>
                  <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.9375rem' } }}>Брак (шт)</TableCell>
                  <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.9375rem' } }}>% брака</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {statistics.daily.map((day) => (
                  <TableRow key={day.date}>
                    <TableCell sx={{ fontSize: { xs: '0.6875rem', sm: '0.8125rem', md: '0.875rem' } }}>
                      {format(new Date(day.date), 'dd MMM yyyy', { locale: ru })}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: { xs: '0.6875rem', sm: '0.8125rem', md: '0.875rem' } }}>
                      {day.actualQuantity.toLocaleString()}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: { xs: '0.6875rem', sm: '0.8125rem', md: '0.875rem' } }}>
                      {day.expectedQuantity.toLocaleString()}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: { xs: '0.6875rem', sm: '0.8125rem', md: '0.875rem' } }}>
                      {day.hours.toFixed(1)}
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${day.efficiency.toFixed(1)}%`}
                        color={
                          day.efficiency >= 100
                            ? 'success'
                            : day.efficiency >= 80
                            ? 'info'
                            : day.efficiency >= 60
                            ? 'warning'
                            : 'error'
                        }
                        size="small"
                        sx={{ fontSize: { xs: '0.625rem', sm: '0.6875rem' } }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: { xs: '0.6875rem', sm: '0.8125rem', md: '0.875rem' } }}>
                      {day.defects}
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${day.defectRate.toFixed(2)}%`}
                        color={day.defectRate > 5 ? 'error' : 'default'}
                        size="small"
                        sx={{ fontSize: { xs: '0.625rem', sm: '0.6875rem' } }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
    </Container>
  );
};

export default ProductionStatistics;

