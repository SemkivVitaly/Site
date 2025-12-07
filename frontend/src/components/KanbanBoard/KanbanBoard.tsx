import React from 'react';
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
  { id: OrderStatus.NEW, title: 'Новый' },
  { id: OrderStatus.IN_QUEUE, title: 'В очереди' },
  { id: OrderStatus.IN_PROGRESS, title: 'В работе' },
  { id: OrderStatus.PARTIALLY_READY, title: 'Частично готов' },
  { id: OrderStatus.READY, title: 'Готов' },
  { id: OrderStatus.ISSUED, title: 'Выдан' },
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
      <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', p: 2 }}>
        {statusColumns.map((column) => {
          const columnOrders = getOrdersByStatus(column.id);

          return (
            <Box key={column.id} sx={{ minWidth: 300, flex: 1 }}>
              <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                <Typography variant="h6" gutterBottom>
                  {column.title} ({columnOrders.length})
                </Typography>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      sx={{
                        minHeight: 200,
                        bgcolor: snapshot.isDraggingOver ? 'action.hover' : 'background.paper',
                        p: 1,
                        borderRadius: 1,
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
                                mb: 1,
                                opacity: snapshot.isDragging ? 0.8 : 1,
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
    </DragDropContext>
  );
};

export default KanbanBoard;

