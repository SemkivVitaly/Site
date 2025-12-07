import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { incidentsApi, Incident } from '../../api/incidents.api';
import { machinesApi, Machine } from '../../api/machines.api';
import { useNotification } from '../../contexts/NotificationContext';
import { MachineStatus, IncidentStatus } from '../../types';
import { translateMachineStatus } from '../../utils/translations';

interface IncidentDialogProps {
  open: boolean;
  incidentId: string | null;
  onClose: () => void;
  onIncidentUpdated?: () => void;
}

const IncidentDialog: React.FC<IncidentDialogProps> = ({
  open,
  incidentId,
  onClose,
  onIncidentUpdated,
}) => {
  const { showError, showSuccess } = useNotification();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(false);
  const [machineStatus, setMachineStatus] = useState<string>('');
  const [assigning, setAssigning] = useState(false);

  const loadIncident = useCallback(async () => {
    if (!incidentId) return;

    try {
      setLoading(true);
      const incidentData = await incidentsApi.getIncidentById(incidentId);
      setIncident(incidentData);

      if (incidentData.machineId) {
        // Если статус станка уже есть в инциденте, используем его
        if (incidentData.machine?.status) {
          setMachineStatus(incidentData.machine.status);
        }
        
        // Загружаем полную информацию о станке
        const machineData = await machinesApi.getById(incidentData.machineId);
        setMachine(machineData);
        setMachineStatus(machineData.status);
      }
    } catch (error: any) {
      console.error('Failed to load incident:', error);
      showError(error.response?.data?.error || 'Ошибка загрузки инцидента');
    } finally {
      setLoading(false);
    }
  }, [incidentId, showError]);

  useEffect(() => {
    if (open && incidentId) {
      loadIncident();
    }
  }, [open, incidentId, loadIncident]);

  const handleAssignIncident = async () => {
    if (!incidentId) return;

    try {
      setAssigning(true);
      await incidentsApi.assignIncident(incidentId);
      showSuccess('Инцидент взят в работу');
      await loadIncident();
      if (onIncidentUpdated) {
        onIncidentUpdated();
      }
    } catch (error: any) {
      showError(error.response?.data?.error || 'Ошибка при взятии инцидента в работу');
    } finally {
      setAssigning(false);
    }
  };

  const handleUpdateMachineStatus = async () => {
    if (!incident?.machineId || !machine) return;

    try {
      setLoading(true);
      const updatedMachine = await machinesApi.update(incident.machineId, { status: machineStatus });
      setMachine(updatedMachine);
      // Обновляем статус в инциденте, если он есть
      if (incident.machine) {
        setIncident({
          ...incident,
          machine: {
            ...incident.machine,
            status: machineStatus,
          },
        });
      }
      showSuccess('Статус станка обновлен');
      if (onIncidentUpdated) {
        onIncidentUpdated();
      }
    } catch (error: any) {
      showError(error.response?.data?.error || 'Ошибка обновления статуса станка');
      // Восстанавливаем предыдущий статус при ошибке
      if (machine) {
        setMachineStatus(machine.status);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResolveIncident = async () => {
    if (!incidentId) return;

    try {
      setLoading(true);
      await incidentsApi.resolveIncident(incidentId);
      showSuccess('Инцидент разрешен');
      await loadIncident();
      if (onIncidentUpdated) {
        onIncidentUpdated();
      }
    } catch (error: any) {
      showError(error.response?.data?.error || 'Ошибка при разрешении инцидента');
    } finally {
      setLoading(false);
    }
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

  const getIncidentTypeLabel = (type: string) => {
    switch (type) {
      case 'MACHINE_BREAKDOWN':
        return 'Поломка станка';
      case 'TASK_QUESTION':
        return 'Вопрос по задаче';
      default:
        return type;
    }
  };

  if (!incident) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Информация об обращении</Typography>
          <Chip
            label={incident.status === 'OPEN' ? 'Открыт' : incident.status === 'IN_PROGRESS' ? 'В работе' : 'Разрешен'}
            color={getStatusColor(incident.status) as any}
            size="small"
          />
        </Box>
      </DialogTitle>
      <DialogContent>
        {loading && !incident && (
          <Typography>Загрузка...</Typography>
        )}
        
        {incident && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Тип обращения
              </Typography>
              <Chip label={getIncidentTypeLabel(incident.type)} size="small" sx={{ mt: 0.5 }} />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Заголовок
              </Typography>
              <Typography variant="body1">{incident.title}</Typography>
            </Box>

            {incident.description && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Описание
                </Typography>
                <Typography variant="body1">{incident.description}</Typography>
              </Box>
            )}

            {incident.machine && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Станок
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    {incident.machine.name}
                  </Typography>
                  
                  <FormControl fullWidth sx={{ mt: 1 }}>
                    <InputLabel>Статус станка</InputLabel>
                    <Select
                      value={machineStatus}
                      onChange={(e) => setMachineStatus(e.target.value)}
                      label="Статус станка"
                    >
                      <MenuItem value={MachineStatus.WORKING}>
                        {translateMachineStatus(MachineStatus.WORKING)}
                      </MenuItem>
                      <MenuItem value={MachineStatus.REPAIR}>
                        {translateMachineStatus(MachineStatus.REPAIR)}
                      </MenuItem>
                      <MenuItem value={MachineStatus.MAINTENANCE}>
                        {translateMachineStatus(MachineStatus.MAINTENANCE)}
                      </MenuItem>
                      <MenuItem value={MachineStatus.REQUIRES_ATTENTION}>
                        {translateMachineStatus(MachineStatus.REQUIRES_ATTENTION)}
                      </MenuItem>
                    </Select>
                  </FormControl>
                  
                  {machine && machineStatus !== machine.status && (
                    <Button
                      variant="outlined"
                      onClick={handleUpdateMachineStatus}
                      sx={{ mt: 1 }}
                      disabled={loading}
                    >
                      Сохранить статус станка
                    </Button>
                  )}
                </Box>
              </>
            )}

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Создатель
              </Typography>
              <Typography variant="body1">
                {incident.creator.firstName} {incident.creator.lastName}
              </Typography>
            </Box>

            {incident.resolver && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Исполнитель
                </Typography>
                <Typography variant="body1">
                  {incident.resolver.firstName} {incident.resolver.lastName}
                </Typography>
              </Box>
            )}

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Дата создания
              </Typography>
              <Typography variant="body1">
                {format(new Date(incident.createdAt), 'dd MMM yyyy HH:mm', { locale: ru })}
              </Typography>
            </Box>

            {incident.resolvedAt && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Дата разрешения
                </Typography>
                <Typography variant="body1">
                  {format(new Date(incident.resolvedAt), 'dd MMM yyyy HH:mm', { locale: ru })}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
        {incident && incident.status === 'OPEN' && (
          <Button
            onClick={handleAssignIncident}
            variant="contained"
            disabled={assigning}
          >
            Взять в работу
          </Button>
        )}
        {incident && incident.status === 'IN_PROGRESS' && (
          <Button
            onClick={handleResolveIncident}
            variant="contained"
            color="success"
            disabled={loading}
          >
            Разрешить
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default IncidentDialog;

