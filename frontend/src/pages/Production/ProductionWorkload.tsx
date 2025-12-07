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
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Alert,
} from '@mui/material';
import { ExpandMore, Build, Warning } from '@mui/icons-material';
import { analyticsApi, type ProductionWorkload as ProductionWorkloadType } from '../../api/analytics.api';
import { useNotification } from '../../contexts/NotificationContext';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const ProductionWorkload: React.FC = () => {
  const { showError } = useNotification();
  const [workload, setWorkload] = useState<ProductionWorkloadType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkload();
  }, []);

  const loadWorkload = async () => {
    try {
      setLoading(true);
      const data = await analyticsApi.getProductionWorkload();
      setWorkload(data);
    } catch (error: any) {
      console.error('Failed to load workload:', error);
      showError(error.response?.data?.error || 'Ошибка загрузки нагрузки на производство');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WORKING':
        return 'success';
      case 'REQUIRES_ATTENTION':
        return 'warning';
      case 'REPAIR':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'WORKING':
        return 'Работает';
      case 'REQUIRES_ATTENTION':
        return 'Требует внимания';
      case 'REPAIR':
        return 'На ремонте';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'error';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'info';
      case 'LOW':
        return 'default';
      default:
        return 'default';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'Критический';
      case 'HIGH':
        return 'Высокий';
      case 'MEDIUM':
        return 'Средний';
      case 'LOW':
        return 'Низкий';
      default:
        return priority;
    }
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

  if (!workload) {
    return (
      <Container>
        <Alert severity="error">Не удалось загрузить данные о нагрузке</Alert>
      </Container>
    );
  }

  return (
    <Container>
      <Box sx={{ mb: 3, mt: 2 }}>
        <Typography variant="h4" gutterBottom>
          Нагрузка на производство
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Текущая нагрузка на станки с учетом всех активных заказов и производительности оборудования
        </Typography>
      </Box>

      {/* Общая статистика */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Общая статистика
        </Typography>
        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', mt: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Всего станков
            </Typography>
            <Typography variant="h5">{workload.summary.totalMachines}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Работающих станков
            </Typography>
            <Typography variant="h5" color="success.main">
              {workload.summary.activeMachines}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Станков с проблемами
            </Typography>
            <Typography variant="h5" color="error.main">
              {workload.summary.machinesWithIssues}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Осталось выполнить (шт)
            </Typography>
            <Typography variant="h5">{workload.summary.totalRemainingQuantity.toLocaleString()}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Всего станков (шт)
            </Typography>
            <Typography variant="h5">{workload.summary.totalMachinesCount}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Доступных работников
            </Typography>
            <Typography variant="h5">{workload.summary.availableWorkersCount}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Время (1 станок, 1 чел)
            </Typography>
            <Typography variant="h5">{workload.summary.totalEstimatedHours.toFixed(1)} ч</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Время (все станки)
            </Typography>
            <Typography variant="h5" color="primary.main">
              {workload.summary.totalEstimatedHoursWithMachines.toFixed(1)} ч
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Время (станки + работники)
            </Typography>
            <Typography variant="h5" color="info.main" fontWeight="bold">
              {workload.summary.totalEstimatedHoursWithMachinesAndWorkers.toFixed(1)} ч
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Нагрузка по станкам */}
      {workload.machines.length === 0 ? (
        <Alert severity="info">Нет активных задач на производстве</Alert>
      ) : (
        <Box>
          {workload.machines.map((machine) => (
            <Accordion key={machine.machineId} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Build sx={{ color: machine.machineStatus === 'WORKING' ? 'success.main' : 'error.main' }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6">{machine.machineName}</Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      <Chip
                        label={getStatusLabel(machine.machineStatus)}
                        color={getStatusColor(machine.machineStatus) as any}
                        size="small"
                      />
                      <Typography variant="body2" color="text.secondary">
                        Производительность: {machine.efficiencyNorm} шт/час на один станок
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Количество станков: {machine.quantity}
                      </Typography>
                      <Typography variant="body2" color="primary.main" fontWeight="bold">
                        Общая производительность: {machine.totalEfficiencyNorm.toFixed(1)} шт/час
                      </Typography>
                      <Typography variant="body2" color="info.main">
                        Доступно работников: {machine.availableWorkersCount}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right', mr: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Осталось: {machine.totalRemainingQuantity.toLocaleString()} шт
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Время (1 станок, 1 чел): {machine.estimatedHours.toFixed(1)} ч
                    </Typography>
                    <Typography variant="body2" color="primary.main">
                      Время ({machine.quantity} станков): {machine.estimatedHoursWithMachines.toFixed(1)} ч
                    </Typography>
                    <Typography variant="body2" color="info.main" fontWeight="bold">
                      Время ({machine.quantity} станков, {machine.availableWorkersCount} чел): {machine.estimatedHoursWithMachinesAndWorkers.toFixed(1)} ч
                    </Typography>
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
                        <TableCell>Приоритет</TableCell>
                        <TableCell>Дедлайн</TableCell>
                        <TableCell>Осталось (шт)</TableCell>
                        <TableCell>Время (1 станок, 1 чел, ч)</TableCell>
                        <TableCell>Время (все станки, ч)</TableCell>
                        <TableCell>Время (станки + работники, ч)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {machine.tasks.map((task) => (
                        <TableRow key={task.taskId}>
                          <TableCell>{task.orderTitle}</TableCell>
                          <TableCell>{task.operation}</TableCell>
                          <TableCell>
                            <Chip
                              label={getPriorityLabel(task.priority)}
                              color={getPriorityColor(task.priority) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {format(new Date(task.deadline), 'dd MMM yyyy', { locale: ru })}
                          </TableCell>
                          <TableCell>{task.remainingQuantity.toLocaleString()}</TableCell>
                          <TableCell>{task.estimatedHours.toFixed(1)}</TableCell>
                          <TableCell>
                            <Typography color="primary.main">
                              {task.estimatedHoursWithMachines.toFixed(1)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography color="info.main" fontWeight="bold">
                              {task.estimatedHoursWithMachinesAndWorkers.toFixed(1)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Container>
  );
};

export default ProductionWorkload;

