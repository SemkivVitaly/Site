import React, { useState } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Order } from '../../api/orders.api';
import { OrderStatus } from '../../types';
import OrderCard from '../OrderCard/OrderCard';
import { ordersApi } from '../../api/orders.api';

interface KanbanBoardProps {
  orders: Order[];
  onOrderUpdate: () => void;
  onDeleteOrder?: (orderId: string) => void;
}

const statusColumns = [
  { id: OrderStatus.NEW, title: 'Новый', color: '#3b82f6' },
  { id: OrderStatus.IN_QUEUE, title: 'В очереди', color: '#8b5cf6' },
  { id: OrderStatus.IN_PROGRESS, title: 'В работе', color: '#f59e0b' },
  { id: OrderStatus.PARTIALLY_READY, title: 'Частично готов', color: '#10b981' },
  { id: OrderStatus.READY, title: 'Готов', color: '#06b6d4' },
  { id: OrderStatus.ISSUED, title: 'Выдан', color: '#64748b' },
];

const KanbanBoard: React.FC<KanbanBoardProps> = ({ orders, onOrderUpdate, onDeleteOrder }) => {
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const newStatus = destination.droppableId as OrderStatus;

    try {
      await ordersApi.updateStatus(draggableId, newStatus);
      onOrderUpdate();
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const getOrdersByStatus = (status: OrderStatus) => {
    return orders.filter((order) => order.status === status);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Box 
        sx={{ 
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Визуальный индикатор прокрутки слева */}
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '40px',
            background: 'linear-gradient(to right, rgba(255,255,255,0.9), transparent)',
            pointerEvents: 'none',
            zIndex: 2,
            display: { xs: 'block', md: 'none' }
          }}
        />
        {/* Визуальный индикатор прокрутки справа */}
        <Box
          sx={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '40px',
            background: 'linear-gradient(to left, rgba(255,255,255,0.9), transparent)',
            pointerEvents: 'none',
            zIndex: 2,
            display: { xs: 'block', md: 'none' }
          }}
        />
        <Box 
          className="kanban-scroll-wrapper"
          sx={{ 
            display: 'flex', 
            gap: { xs: 0.75, sm: 1.5, md: 2 }, 
            overflowX: 'auto !important',
            overflowY: 'hidden !important',
            p: { xs: 0.5, sm: 1, md: 2 },
            pb: { xs: 1.5, sm: 2, md: 3 },
            flex: 1,
            minHeight: 0,
            width: '100%',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(0,0,0,0.4) rgba(0,0,0,0.1)',
            WebkitOverflowScrolling: 'touch',
            scrollBehavior: 'smooth',
            touchAction: 'pan-x pan-y',
            '&::-webkit-scrollbar': {
              height: { xs: '14px', sm: '12px', md: '10px' },
              display: 'block',
              WebkitAppearance: 'none',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(0,0,0,0.1)',
              borderRadius: { xs: '7px', sm: '6px', md: '5px' },
              margin: { xs: '2px', sm: '1px', md: '0' },
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(0,0,0,0.4)',
              borderRadius: { xs: '7px', sm: '6px', md: '5px' },
              border: { xs: '3px solid rgba(255,255,255,0.9)', sm: '2px solid rgba(255,255,255,0.8)', md: '2px solid rgba(255,255,255,0.5)' },
              minHeight: { xs: '20px', sm: '16px', md: '12px' },
              '&:hover': {
                background: 'rgba(0,0,0,0.6)',
              },
            },
            // Улучшаем видимость прокрутки на мобильных
            '&::after': {
              content: '""',
              position: 'sticky',
              right: 0,
              top: 0,
              bottom: 0,
              width: '20px',
              background: 'linear-gradient(to left, rgba(255,255,255,0.8), transparent)',
              pointerEvents: 'none',
              display: { xs: 'block', md: 'none' },
            },
          }}
        >
          {statusColumns.map((column) => {
            const columnOrders = getOrdersByStatus(column.id);

            return (
              <Box 
                key={column.id} 
                sx={{ 
                  minWidth: { xs: 160, sm: 200, md: 260, lg: 280 }, 
                  width: { xs: 160, sm: 200, md: 260, lg: 'auto' },
                  maxWidth: { xs: '90vw', sm: 'none' },
                  flexShrink: 0,
                  flex: { xs: '0 0 auto', lg: 1 },
                  height: 'fit-content',
                  maxHeight: { xs: 'calc(100vh - 200px)', sm: 'calc(100vh - 250px)', md: 'none' },
                }}
              >
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: { xs: 1, sm: 1.5, md: 2 }, 
                    bgcolor: 'background.paper',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: { xs: 1, sm: 1.5, md: 2 },
                      pb: { xs: 1, sm: 1.5 },
                      borderBottom: '2px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: column.color,
                          boxShadow: `0 0 8px ${column.color}`,
                        }}
                      />
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' },
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {column.title}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 2,
                        bgcolor: 'primary.light',
                        color: 'white',
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        fontWeight: 600,
                        minWidth: 28,
                        textAlign: 'center',
                      }}
                    >
                      {columnOrders.length}
                    </Box>
                  </Box>

                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <Box
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        sx={{
                          minHeight: { xs: 200, sm: 300, md: 400 },
                          maxHeight: { xs: 'calc(100vh - 350px)', sm: 'calc(100vh - 400px)', md: 'calc(100vh - 250px)' },
                          height: { xs: 'calc(100vh - 350px)', sm: 'calc(100vh - 400px)', md: 'auto' },
                          overflowY: 'auto',
                          overflowX: 'hidden',
                          bgcolor: snapshot.isDraggingOver 
                            ? `rgba(99, 102, 241, 0.08)` 
                            : 'transparent',
                          p: { xs: 0.5, sm: 1 },
                          borderRadius: 2,
                          flex: 1,
                          transition: 'background-color 0.2s ease-in-out',
                          border: snapshot.isDraggingOver ? '2px dashed' : '2px dashed transparent',
                          borderColor: snapshot.isDraggingOver ? 'primary.main' : 'transparent',
                          scrollbarWidth: 'thin',
                          '&::-webkit-scrollbar': {
                            width: '6px',
                          },
                          '&::-webkit-scrollbar-track': {
                            background: 'rgba(0,0,0,0.05)',
                            borderRadius: '3px',
                          },
                          '&::-webkit-scrollbar-thumb': {
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: '3px',
                            '&:hover': {
                              background: 'rgba(0,0,0,0.3)',
                            },
                          },
                          WebkitOverflowScrolling: 'touch',
                        }}
                      >
                      {columnOrders.map((order, index) => (
                        <Draggable key={order.id} draggableId={order.id} index={index}>
                          {(provided, snapshot) => (
                            <Box
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              sx={{
                                mb: 1.5,
                                opacity: snapshot.isDragging ? 0.6 : 1,
                                transform: snapshot.isDragging ? 'rotate(3deg)' : 'none',
                                transition: 'all 0.2s ease-in-out',
                                '&:hover': {
                                  transform: snapshot.isDragging ? 'rotate(3deg) scale(1.02)' : 'translateY(-2px)',
                                },
                              }}
                            >
                              <OrderCard order={order} onDelete={onDeleteOrder} />
                            </Box>
                          )}
                        </Draggable>
                      ))}
                        {provided.placeholder}
                      </Box>
                    )}
                  </Droppable>
                </Paper>
              </Box>
            );
          })}
        </Box>
      </Box>
    </DragDropContext>
  );
};

export default KanbanBoard;

