import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Box,
} from '@mui/material';
import { machinesApi } from '../../api/machines.api';
import { incidentsApi, Incident } from '../../api/incidents.api';
import { IncidentStatus } from '../../types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { translateIncidentStatus } from '../../utils/translations';

const MachineHistory: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [machineName, setMachineName] = useState('');

  useEffect(() => {
    if (id) {
      loadHistory();
    }
  }, [id]);

  const loadHistory = async () => {
    try {
      const [machine, incidentsData] = await Promise.all([
        machinesApi.getById(id!),
        incidentsApi.getIncidents({ machineId: id, type: 'MACHINE_BREAKDOWN' }),
      ]);
      setMachineName(machine.name);
      setIncidents(incidentsData);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case IncidentStatus.RESOLVED:
        return 'success';
      case IncidentStatus.IN_PROGRESS:
        return 'info';
      case IncidentStatus.OPEN:
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        История обслуживания: {machineName}
      </Typography>

      {incidents.length === 0 ? (
        <Paper sx={{ p: 3, mt: 2 }}>
          <Typography color="text.secondary">
            История поломок отсутствует
          </Typography>
        </Paper>
      ) : (
        <List>
          {incidents.map((incident) => (
            <ListItem
              key={incident.id}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1,
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="subtitle1">{incident.title}</Typography>
                    <Chip
                      label={translateIncidentStatus(incident.status)}
                      color={getStatusColor(incident.status) as any}
                      size="small"
                    />
                  </Box>
                }
                secondary={
                  <>
                    <Typography variant="body2" gutterBottom>
                      {incident.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Создал: {incident.creator.firstName} {incident.creator.lastName} •{' '}
                      {format(new Date(incident.createdAt), 'dd MMM yyyy HH:mm', { locale: ru })}
                    </Typography>
                    {incident.resolver && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Исправил: {incident.resolver.firstName} {incident.resolver.lastName}
                        {incident.resolvedAt &&
                          ` • ${format(new Date(incident.resolvedAt), 'dd MMM yyyy HH:mm', { locale: ru })}`}
                      </Typography>
                    )}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Container>
  );
};

export default MachineHistory;

