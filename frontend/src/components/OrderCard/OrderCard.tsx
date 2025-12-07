import React from 'react';
import { Card, CardContent, Typography, Box, Chip, LinearProgress, Button, IconButton } from '@mui/material';
import { Star, Build, Delete } from '@mui/icons-material';
import { Order } from '../../api/orders.api';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { translateOrderStatus, translatePriority } from '../../utils/translations';

interface OrderCardProps {
  order: Order;
  onClick?: () => void;
  onDelete?: (orderId: string) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onClick, onDelete }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const daysUntilDeadline = Math.ceil(
    (new Date(order.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const handleTechCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/orders/${order.id}/tech-card`);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(order.id);
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else if (user?.role === 'MANAGER' || user?.role === 'ADMIN') {
      // Если нет обработчика onClick, открываем техкарту для менеджеров и админов
      navigate(`/orders/${order.id}/tech-card`);
    }
  };

  const canDelete = (user?.role === 'ADMIN' || user?.role === 'MANAGER') && 
                    (order.status === 'READY' || order.status === 'ISSUED');

  const getDeadlineColor = () => {
    if (daysUntilDeadline < 1) return 'error';
    if (daysUntilDeadline < 3) return 'warning';
    return 'default';
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

  const isUrgent = daysUntilDeadline < 7; // Less than a week

  return (
    <Card
      sx={{
        cursor: (onClick || user?.role === 'MANAGER' || user?.role === 'ADMIN') ? 'pointer' : 'default',
        '&:hover': (onClick || user?.role === 'MANAGER' || user?.role === 'ADMIN') ? { boxShadow: 4 } : {},
        borderLeft: isUrgent ? '4px solid red' : 'none',
        bgcolor: isUrgent ? 'error.light' : 'background.paper',
        animation: daysUntilDeadline < 1 ? 'pulse 2s infinite' : 'none',
        '@keyframes pulse': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
      }}
      onClick={handleCardClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" component="div">
              {order.title}
            </Typography>
            {order.isImportant && (
              <Star sx={{ color: 'warning.main', fontSize: 20 }} />
            )}
          </Box>
          <Chip
            label={translatePriority(order.priority)}
            color={getPriorityColor(order.priority) as any}
            size="small"
          />
        </Box>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          Клиент: {order.client}
        </Typography>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          Тираж: {order.printRun} шт
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Дедлайн:
          </Typography>
          <Chip
            label={format(new Date(order.deadline), 'dd MMM yyyy', { locale: ru })}
            color={getDeadlineColor() as any}
            size="small"
          />
          {isUrgent && (
            <Typography variant="caption" color="error" fontWeight="bold">
              ({daysUntilDeadline} дн. до дедлайна!)
            </Typography>
          )}
        </Box>

        {order.completionPercentage !== undefined && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption">Выполнение</Typography>
              <Typography variant="caption">{order.completionPercentage}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={order.completionPercentage} />
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Chip
            label={translateOrderStatus(order.status)}
            size="small"
          />
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<Build />}
                onClick={handleTechCardClick}
              >
                Техкарта
              </Button>
            )}
            {canDelete && (
              <IconButton
                size="small"
                onClick={handleDeleteClick}
                color="error"
                title="Удалить заказ"
              >
                <Delete />
              </IconButton>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default OrderCard;

