import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Divider,
} from '@mui/material';
import { Visibility, Delete } from '@mui/icons-material';
import { Incident } from '../../api/incidents.api';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { translateIncidentType } from '../../utils/translations';

interface IncidentCardProps {
  incident: Incident;
  onView: (incidentId: string) => void;
  onDelete: (incident: Incident) => void;
  getTypeIcon: (type: string) => React.ReactNode;
  getStatusLabel: (status: string) => string;
  getStatusColor: (status: string) => string;
}

const IncidentCard: React.FC<IncidentCardProps> = ({
  incident,
  onView,
  onDelete,
  getTypeIcon,
  getStatusLabel,
  getStatusColor,
}) => {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
        {/* Заголовок с типом и статусом */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
            {getTypeIcon(incident.type)}
            <Typography 
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}
            >
              {translateIncidentType(incident.type)}
            </Typography>
          </Box>
          <Chip
            label={getStatusLabel(incident.status)}
            color={getStatusColor(incident.status) as any}
            size="small"
            sx={{ flexShrink: 0, fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}
          />
        </Box>

        <Typography 
          variant="h6"
          sx={{ 
            fontSize: { xs: '0.9375rem', sm: '1.125rem' },
            fontWeight: 600,
            mb: 1.5,
            wordBreak: 'break-word'
          }}
        >
          {incident.title}
        </Typography>

        <Divider sx={{ my: 1.5 }} />

        {/* Создатель */}
        <Box sx={{ mb: 1.5 }}>
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' }, display: 'block', mb: 0.5 }}
          >
            Создатель
          </Typography>
          <Typography 
            variant="body2"
            sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
          >
            {incident.creator.firstName} {incident.creator.lastName}
          </Typography>
        </Box>

        {/* Исполнитель */}
        {incident.resolver && (
          <Box sx={{ mb: 1.5 }}>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' }, display: 'block', mb: 0.5 }}
            >
              Исполнитель
            </Typography>
            <Typography 
              variant="body2"
              sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
            >
              {incident.resolver.firstName} {incident.resolver.lastName}
            </Typography>
          </Box>
        )}

        {/* Станок */}
        {incident.machine && (
          <Box sx={{ mb: 1.5 }}>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' }, display: 'block', mb: 0.5 }}
            >
              Станок
            </Typography>
            <Typography 
              variant="body2"
              sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
            >
              {incident.machine.name}
            </Typography>
          </Box>
        )}

        {/* Дата создания */}
        <Box sx={{ mb: 1.5 }}>
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' }, display: 'block', mb: 0.5 }}
          >
            Дата создания
          </Typography>
          <Typography 
            variant="body2"
            sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
          >
            {format(new Date(incident.createdAt), 'dd MMM yyyy HH:mm', { locale: ru })}
          </Typography>
        </Box>

        {/* Действия */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
          <IconButton
            size="small"
            onClick={() => onView(incident.id)}
            color="primary"
            sx={{ '& .MuiSvgIcon-root': { fontSize: { xs: '1.125rem', sm: '1.25rem' } } }}
          >
            <Visibility />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onDelete(incident)}
            color="error"
            sx={{ '& .MuiSvgIcon-root': { fontSize: { xs: '1.125rem', sm: '1.25rem' } } }}
          >
            <Delete />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
};

export default IncidentCard;

