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
      elevation={0}
      sx={{
        cursor: (onClick || user?.role === 'MANAGER' || user?.role === 'ADMIN') ? 'pointer' : 'default',
        border: isUrgent ? '2px solid' : '1px solid',
        borderColor: isUrgent ? 'error.main' : 'divider',
        bgcolor: isUrgent ? 'rgba(239, 68, 68, 0.05)' : 'background.paper',
        borderRadius: 3,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'visible',
        '&:hover': (onClick || user?.role === 'MANAGER' || user?.role === 'ADMIN') 
          ? { 
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
              transform: 'translateY(-4px)',
              borderColor: isUrgent ? 'error.main' : 'primary.main',
            } 
          : {},
        animation: daysUntilDeadline < 1 ? 'pulse 2s infinite' : 'none',
        '@keyframes pulse': {
          '0%, 100%': { 
            opacity: 1,
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
          },
          '50%': { 
            opacity: 0.9,
            boxShadow: '0 6px 20px rgba(239, 68, 68, 0.5)',
          },
        },
        '&::before': isUrgent ? {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)',
          borderRadius: '12px 0 0 12px',
        } : {},
      }}
      onClick={handleCardClick}
    >
      <CardContent sx={{ p: { xs: 1.5, sm: 2 }, pl: isUrgent ? { xs: 2, sm: 2.5 } : { xs: 1.5, sm: 2 } }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 2,
          gap: { xs: 1, sm: 0 }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
            <Typography 
              variant="h6" 
              component="div"
              sx={{ 
                fontSize: { xs: '0.9375rem', sm: '1.125rem' },
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                color: 'text.primary',
              }}
            >
              {order.title}
            </Typography>
            {order.isImportant && (
              <Star 
                sx={{ 
                  color: 'warning.main', 
                  fontSize: { xs: 20, sm: 24 }, 
                  flexShrink: 0,
                  filter: 'drop-shadow(0 2px 4px rgba(245, 158, 11, 0.3))',
                }} 
              />
            )}
          </Box>
          <Chip
            label={translatePriority(order.priority)}
            color={getPriorityColor(order.priority) as any}
            size="small"
            sx={{ 
              flexShrink: 0,
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          />
        </Box>

        <Box sx={{ mb: 1.5 }}>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 0.5,
              fontSize: { xs: '0.8125rem', sm: '0.875rem' },
            }}
          >
            Клиент: <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>{order.client}</Box>
          </Typography>

          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              fontSize: { xs: '0.8125rem', sm: '0.875rem' },
            }}
          >
            Тираж: <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>{order.printRun} шт</Box>
          </Typography>
        </Box>

        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            mb: 2,
            flexWrap: 'wrap',
          }}
        >
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              fontSize: { xs: '0.8125rem', sm: '0.875rem' },
            }}
          >
            Дедлайн:
          </Typography>
          <Chip
            label={format(new Date(order.deadline), 'dd MMM yyyy', { locale: ru })}
            color={getDeadlineColor() as any}
            size="small"
            sx={{ 
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          />
          {isUrgent && (
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'error.main',
                fontWeight: 700,
                fontSize: '0.75rem',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                bgcolor: 'error.light',
              }}
            >
              {daysUntilDeadline} дн. до дедлайна!
            </Typography>
          )}
        </Box>

        {order.completionPercentage !== undefined && (
          <Box sx={{ mt: 1.5, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'text.secondary',
                }}
              >
                Выполнение
              </Typography>
              <Typography 
                variant="caption"
                sx={{ 
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'primary.main',
                }}
              >
                {order.completionPercentage}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={order.completionPercentage}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  background: 'linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)',
                },
              }}
            />
          </Box>
        )}

        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          mt: 1,
          pt: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          gap: { xs: 1.5, sm: 1 }
        }}>
          <Chip
            label={translateOrderStatus(order.status)}
            size="small"
            sx={{ 
              alignSelf: { xs: 'flex-start', sm: 'center' },
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          />
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<Build />}
                onClick={handleTechCardClick}
                sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                  fontWeight: 500,
                  borderRadius: 2,
                  borderWidth: 1.5,
                  '&:hover': {
                    borderWidth: 1.5,
                  },
                }}
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
                sx={{
                  '&:hover': {
                    bgcolor: 'error.light',
                  },
                }}
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

