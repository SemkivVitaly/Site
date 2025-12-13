import React, { useState, useEffect } from 'react';
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
  Card,
  CardContent,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Visibility, Build, Delete } from '@mui/icons-material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { incidentsApi, Incident } from '../../api/incidents.api';
import { useNotification } from '../../contexts/NotificationContext';
import { IncidentStatus, IncidentType } from '../../types';
import IncidentDialog from '../../components/IncidentDialog/IncidentDialog';
import { translateIncidentType } from '../../utils/translations';
import IncidentCard from '../../components/IncidentCard/IncidentCard';

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [incidentToDelete, setIncidentToDelete] = useState<Incident | null>(null);

  useEffect(() => {
    loadIncidents();
  }, [tabValue]);

  const loadIncidents = async () => {
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
  };

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

  const renderIncidentsList = (filteredIncidents: Incident[]) => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
          <Typography>Загрузка...</Typography>
        </Box>
      );
    }

    if (filteredIncidents.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
          <Typography color="text.secondary">Нет обращений</Typography>
        </Box>
      );
    }

    if (isMobile) {
      return (
        <Box>
          {filteredIncidents.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              onView={handleViewIncident}
              onDelete={handleDeleteClick}
              getTypeIcon={getTypeIcon}
              getStatusLabel={getStatusLabel}
              getStatusColor={getStatusColor}
            />
          ))}
        </Box>
      );
    }

    return (
      <TableContainer
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
              <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Тип</TableCell>
              <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Заголовок</TableCell>
              <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Создатель</TableCell>
              <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Исполнитель</TableCell>
              <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Станок</TableCell>
              <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Статус</TableCell>
              <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Дата создания</TableCell>
              {(tabValue === 2) && (
                <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Дата завершения</TableCell>
              )}
              <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredIncidents.map((incident) => (
              <TableRow key={incident.id} hover>
                <TableCell sx={{ fontSize: { sm: '0.8125rem', md: '0.875rem' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getTypeIcon(incident.type)}
                    {translateIncidentType(incident.type)}
                  </Box>
                </TableCell>
                <TableCell sx={{ fontSize: { sm: '0.8125rem', md: '0.875rem' } }}>{incident.title}</TableCell>
                <TableCell sx={{ fontSize: { sm: '0.8125rem', md: '0.875rem' } }}>
                  {incident.creator.firstName} {incident.creator.lastName}
                </TableCell>
                <TableCell sx={{ fontSize: { sm: '0.8125rem', md: '0.875rem' } }}>
                  {incident.resolver
                    ? `${incident.resolver.firstName} ${incident.resolver.lastName}`
                    : '-'}
                </TableCell>
                <TableCell sx={{ fontSize: { sm: '0.8125rem', md: '0.875rem' } }}>
                  {incident.machine ? incident.machine.name : '-'}
                </TableCell>
                {tabValue !== 2 && (
                  <TableCell>
                    <Chip
                      label={getStatusLabel(incident.status)}
                      color={getStatusColor(incident.status) as any}
                      size="small"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  </TableCell>
                )}
                <TableCell sx={{ fontSize: { sm: '0.8125rem', md: '0.875rem' } }}>
                  {format(new Date(incident.createdAt), 'dd MMM yyyy HH:mm', { locale: ru })}
                </TableCell>
                {tabValue === 2 && (
                  <TableCell sx={{ fontSize: { sm: '0.8125rem', md: '0.875rem' } }}>
                    {incident.resolvedAt
                      ? format(new Date(incident.resolvedAt), 'dd MMM yyyy HH:mm', { locale: ru })
                      : '-'}
                  </TableCell>
                )}
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleViewIncident(incident.id)}
                      color="primary"
                      sx={{ '& .MuiSvgIcon-root': { fontSize: '1.125rem' } }}
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(incident)}
                      color="error"
                      sx={{ '& .MuiSvgIcon-root': { fontSize: '1.125rem' } }}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Container sx={{ px: { xs: 1, sm: 2 } }}>
      <Box sx={{ mb: 3, mt: { xs: 1, sm: 2 } }}>
        <Typography 
          variant="h4" 
          gutterBottom
          sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
        >
          Обращения
        </Typography>
      </Box>

      <Paper>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            <Tab 
              label="Активные"
              sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' }, minWidth: { xs: 80, sm: 120 } }}
            />
            <Tab 
              label="В обработке"
              sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' }, minWidth: { xs: 100, sm: 140 } }}
            />
            <Tab 
              label="Завершенные"
              sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' }, minWidth: { xs: 100, sm: 140 } }}
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {renderIncidentsList(
            incidents.filter(i => i.status === IncidentStatus.OPEN || i.status === IncidentStatus.IN_PROGRESS)
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {renderIncidentsList(
            incidents.filter(i => i.status === IncidentStatus.IN_PROGRESS)
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {renderIncidentsList(
            incidents.filter(i => i.status === IncidentStatus.RESOLVED)
          )}
        </TabPanel>
      </Paper>

      <IncidentDialog
        open={dialogOpen}
        incidentId={selectedIncident}
        onClose={handleCloseDialog}
        onIncidentUpdated={loadIncidents}
      />

      <Dialog 
        open={deleteDialogOpen} 
        onClose={handleDeleteCancel}
        fullScreen={isMobile}
        sx={{
          '& .MuiDialog-paper': {
            m: { xs: 0, sm: 2 },
            maxHeight: { xs: '100%', sm: '90vh' },
          }
        }}
      >
        <DialogTitle sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
          Удалить обращение?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            Вы уверены, что хотите удалить обращение "{incidentToDelete?.title}"?
            Это действие нельзя отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 }, gap: { xs: 1, sm: 2 } }}>
          <Button 
            onClick={handleDeleteCancel}
            sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
          >
            Отмена
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            variant="contained" 
            color="error"
            sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default IncidentsList;

