import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import { Visibility, Build, Delete } from '@mui/icons-material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { incidentsApi, Incident } from '../../api/incidents.api';
import { useNotification } from '../../contexts/NotificationContext';
import { IncidentStatus, IncidentType } from '../../types';
import IncidentDialog from '../../components/IncidentDialog/IncidentDialog';
import { translateIncidentType } from '../../utils/translations';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`incidents-tabpanel-${index}`}
      aria-labelledby={`incidents-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const IncidentsList: React.FC = () => {
  const { showError, showSuccess } = useNotification();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [incidentToDelete, setIncidentToDelete] = useState<Incident | null>(null);

  const loadIncidents = useCallback(async () => {
    try {
      setLoading(true);
      let statusFilter: string | undefined;

      // Определяем фильтр по статусу в зависимости от выбранной вкладки
      if (tabValue === 0) {
        // Все активные (не завершенные)
        const activeIncidents = await incidentsApi.getIncidents({ status: IncidentStatus.OPEN });
        const inProgressIncidents = await incidentsApi.getIncidents({ status: IncidentStatus.IN_PROGRESS });
        setIncidents([...activeIncidents, ...inProgressIncidents]);
      } else if (tabValue === 1) {
        // В обработке
        statusFilter = IncidentStatus.IN_PROGRESS;
        const data = await incidentsApi.getIncidents({ status: statusFilter });
        setIncidents(data);
      } else if (tabValue === 2) {
        // Завершенные
        statusFilter = IncidentStatus.RESOLVED;
        const data = await incidentsApi.getIncidents({ status: statusFilter });
        setIncidents(data);
      } else {
        // Все
        const data = await incidentsApi.getIncidents();
        setIncidents(data);
      }
    } catch (error: any) {
      console.error('Failed to load incidents:', error);
      showError(error.response?.data?.error || 'Ошибка загрузки обращений');
    } finally {
      setLoading(false);
    }
  }, [tabValue, showError]);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleViewIncident = (incidentId: string) => {
    setSelectedIncident(incidentId);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedIncident(null);
    loadIncidents(); // Перезагружаем список после закрытия диалога
  };

  const handleDeleteClick = (incident: Incident) => {
    setIncidentToDelete(incident);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!incidentToDelete) return;

    try {
      await incidentsApi.deleteIncident(incidentToDelete.id);
      showSuccess('Обращение успешно удалено');
      setDeleteDialogOpen(false);
      setIncidentToDelete(null);
      loadIncidents();
    } catch (error: any) {
      showError(error.response?.data?.error || 'Ошибка удаления обращения');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setIncidentToDelete(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case IncidentStatus.OPEN:
        return 'error';
      case IncidentStatus.IN_PROGRESS:
        return 'warning';
      case IncidentStatus.RESOLVED:
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case IncidentStatus.OPEN:
        return 'Открыт';
      case IncidentStatus.IN_PROGRESS:
        return 'В работе';
      case IncidentStatus.RESOLVED:
        return 'Завершен';
      default:
        return status;
    }
  };

  const getTypeIcon = (type: string) => {
    if (type === IncidentType.MACHINE_BREAKDOWN) {
      return <Build />;
    }
    return null;
  };

  return (
    <Container>
      <Box sx={{ mb: 3, mt: 2 }}>
        <Typography variant="h4" gutterBottom>
          Обращения
        </Typography>
      </Box>

      <Paper>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Активные" />
            <Tab label="В обработке" />
            <Tab label="Завершенные" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Тип</TableCell>
                  <TableCell>Заголовок</TableCell>
                  <TableCell>Создатель</TableCell>
                  <TableCell>Исполнитель</TableCell>
                  <TableCell>Станок</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell>Дата создания</TableCell>
                  <TableCell>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Загрузка...
                    </TableCell>
                  </TableRow>
                ) : incidents.filter(i => i.status === IncidentStatus.OPEN || i.status === IncidentStatus.IN_PROGRESS).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Нет активных обращений
                    </TableCell>
                  </TableRow>
                ) : (
                  incidents
                    .filter(i => i.status === IncidentStatus.OPEN || i.status === IncidentStatus.IN_PROGRESS)
                    .map((incident) => (
                      <TableRow key={incident.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getTypeIcon(incident.type)}
                            {translateIncidentType(incident.type)}
                          </Box>
                        </TableCell>
                        <TableCell>{incident.title}</TableCell>
                        <TableCell>
                          {incident.creator.firstName} {incident.creator.lastName}
                        </TableCell>
                        <TableCell>
                          {incident.resolver
                            ? `${incident.resolver.firstName} ${incident.resolver.lastName}`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {incident.machine ? incident.machine.name : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(incident.status)}
                            color={getStatusColor(incident.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {format(new Date(incident.createdAt), 'dd MMM yyyy HH:mm', { locale: ru })}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleViewIncident(incident.id)}
                              color="primary"
                            >
                              <Visibility />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteClick(incident)}
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Тип</TableCell>
                  <TableCell>Заголовок</TableCell>
                  <TableCell>Создатель</TableCell>
                  <TableCell>Исполнитель</TableCell>
                  <TableCell>Станок</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell>Дата создания</TableCell>
                  <TableCell>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Загрузка...
                    </TableCell>
                  </TableRow>
                ) : incidents.filter(i => i.status === IncidentStatus.IN_PROGRESS).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Нет обращений в обработке
                    </TableCell>
                  </TableRow>
                ) : (
                  incidents
                    .filter(i => i.status === IncidentStatus.IN_PROGRESS)
                    .map((incident) => (
                      <TableRow key={incident.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getTypeIcon(incident.type)}
                            {translateIncidentType(incident.type)}
                          </Box>
                        </TableCell>
                        <TableCell>{incident.title}</TableCell>
                        <TableCell>
                          {incident.creator.firstName} {incident.creator.lastName}
                        </TableCell>
                        <TableCell>
                          {incident.resolver
                            ? `${incident.resolver.firstName} ${incident.resolver.lastName}`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {incident.machine ? incident.machine.name : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(incident.status)}
                            color={getStatusColor(incident.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {format(new Date(incident.createdAt), 'dd MMM yyyy HH:mm', { locale: ru })}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleViewIncident(incident.id)}
                              color="primary"
                            >
                              <Visibility />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteClick(incident)}
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Тип</TableCell>
                  <TableCell>Заголовок</TableCell>
                  <TableCell>Создатель</TableCell>
                  <TableCell>Исполнитель</TableCell>
                  <TableCell>Станок</TableCell>
                  <TableCell>Дата создания</TableCell>
                  <TableCell>Дата завершения</TableCell>
                  <TableCell>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Загрузка...
                    </TableCell>
                  </TableRow>
                ) : incidents.filter(i => i.status === IncidentStatus.RESOLVED).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Нет завершенных обращений
                    </TableCell>
                  </TableRow>
                ) : (
                  incidents
                    .filter(i => i.status === IncidentStatus.RESOLVED)
                    .map((incident) => (
                      <TableRow key={incident.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getTypeIcon(incident.type)}
                            {translateIncidentType(incident.type)}
                          </Box>
                        </TableCell>
                        <TableCell>{incident.title}</TableCell>
                        <TableCell>
                          {incident.creator.firstName} {incident.creator.lastName}
                        </TableCell>
                        <TableCell>
                          {incident.resolver
                            ? `${incident.resolver.firstName} ${incident.resolver.lastName}`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {incident.machine ? incident.machine.name : '-'}
                        </TableCell>
                        <TableCell>
                          {format(new Date(incident.createdAt), 'dd MMM yyyy HH:mm', { locale: ru })}
                        </TableCell>
                        <TableCell>
                          {incident.resolvedAt
                            ? format(new Date(incident.resolvedAt), 'dd MMM yyyy HH:mm', { locale: ru })
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleViewIncident(incident.id)}
                              color="primary"
                            >
                              <Visibility />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteClick(incident)}
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      <IncidentDialog
        open={dialogOpen}
        incidentId={selectedIncident}
        onClose={handleCloseDialog}
        onIncidentUpdated={loadIncidents}
      />

      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Удалить обращение?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы уверены, что хотите удалить обращение "{incidentToDelete?.title}"?
            Это действие нельзя отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Отмена</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default IncidentsList;

