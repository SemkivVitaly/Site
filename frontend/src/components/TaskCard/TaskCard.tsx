import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Button,
  Divider,
} from '@mui/material';
import { Edit, PersonRemove } from '@mui/icons-material';
import { ProductionTask } from '../../api/production.api';
import { translateTaskStatus, translatePriority, translateMachineStatus } from '../../utils/translations';
import { tasksApi } from '../../api/tasks.api';
import { Priority } from '../../types';

interface TaskCardProps {
  task: ProductionTask;
  onEdit: (task: ProductionTask) => void;
  onUnassign: (taskId: string) => void;
  getPriorityColor: (priority: string) => string;
  showError: (message: string) => void;
  loadData: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onUnassign,
  getPriorityColor,
  showError,
  loadData,
}) => {
  const handleRemoveAssignment = (assignmentId: string) => {
    const newUserIds = task.assignments!
      .filter(a => a.id !== assignmentId)
      .map(a => a.userId);
    tasksApi.assignTask({ taskId: task.id, userIds: newUserIds })
      .then(() => loadData())
      .catch((err) => showError(err.response?.data?.error || 'Ошибка снятия назначения'));
  };

  return (
    <Card 
      elevation={0}
      sx={{ 
        mb: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          transform: 'translateY(-2px)',
          borderColor: 'primary.main',
        },
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
        {/* Заголовок с кнопкой редактирования */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontSize: { xs: '1rem', sm: '1.125rem' },
                fontWeight: 600,
                mb: 0.75,
                wordBreak: 'break-word',
                color: 'text.primary',
              }}
            >
              {task.operation}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                fontWeight: 500,
              }}
            >
              {task.order?.title || `Заказ ${task.orderId}`}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => onEdit(task)}
            sx={{ 
              flexShrink: 0,
              ml: 1,
              '& .MuiSvgIcon-root': { fontSize: { xs: '1.125rem', sm: '1.25rem' } }
            }}
            color="primary"
          >
            <Edit />
          </IconButton>
        </Box>

        <Divider sx={{ my: 2, borderColor: 'divider' }} />

        {/* Станок */}
        <Box sx={{ mb: 1.5 }}>
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' }, display: 'block', mb: 0.5 }}
          >
            Станок
          </Typography>
          <Chip
            label={`${task.machine.name} (${translateMachineStatus(task.machine.status)})`}
            size="small"
            color={task.machine.status === 'WORKING' ? 'success' : 'error'}
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.8125rem' },
              fontWeight: 600,
            }}
          />
        </Box>

        {/* Статус и Приоритет */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
          <Box>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' }, display: 'block', mb: 0.5 }}
            >
              Статус
            </Typography>
            <Chip 
              label={translateTaskStatus(task.status)} 
              size="small"
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                fontWeight: 600,
              }}
            />
          </Box>
          <Box>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' }, display: 'block', mb: 0.5 }}
            >
              Приоритет
            </Typography>
            <Chip
              label={translatePriority(task.priority)}
              size="small"
              color={getPriorityColor(task.priority) as any}
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                fontWeight: 600,
              }}
            />
          </Box>
        </Box>

        {/* Исполнитель */}
        <Box sx={{ mb: 1.5 }}>
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' }, display: 'block', mb: 0.5 }}
          >
            Исполнитель
          </Typography>
          {(task.assignments && task.assignments.length > 0) ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {task.assignments.map((assignment) => (
                <Box 
                  key={assignment.id}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    gap: 1
                  }}
                >
                  <Chip
                    label={`${assignment.user.firstName} ${assignment.user.lastName}`}
                    size="small"
                    onDelete={() => handleRemoveAssignment(assignment.id)}
                    sx={{ 
                      fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                      fontWeight: 500,
                      flex: 1,
                      maxWidth: 'fit-content',
                    }}
                  />
                </Box>
              ))}
              <Button
                size="small"
                variant="outlined"
                startIcon={<PersonRemove />}
                onClick={() => onUnassign(task.id)}
                sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                  fontWeight: 500,
                  alignSelf: 'flex-start',
                  mt: 0.5,
                  borderRadius: 2,
                  borderWidth: 1.5,
                  '&:hover': {
                    borderWidth: 1.5,
                  },
                }}
              >
                Снять все назначения
              </Button>
            </Box>
          ) : task.assignedUser ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
              <Typography 
                variant="body2"
                sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
              >
                {task.assignedUser.firstName} {task.assignedUser.lastName}
              </Typography>
              <IconButton
                size="small"
                onClick={() => onUnassign(task.id)}
                sx={{ '& .MuiSvgIcon-root': { fontSize: { xs: '1rem', sm: '1.125rem' } } }}
              >
                <PersonRemove />
              </IconButton>
            </Box>
          ) : (
            <Chip 
              label="Общая очередь" 
              size="small" 
              color="default"
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                fontWeight: 500,
              }}
            />
          )}
        </Box>

        {/* Прогресс */}
        <Box>
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' }, display: 'block', mb: 0.5 }}
          >
            Прогресс
          </Typography>
          <Typography 
            variant="body2"
            sx={{ 
              fontSize: { xs: '0.875rem', sm: '0.9375rem' },
              fontWeight: 600,
              color: 'primary.main',
            }}
          >
            {task.completedQuantity} / {task.totalQuantity}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TaskCard;

