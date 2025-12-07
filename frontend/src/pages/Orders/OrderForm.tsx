import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  MenuItem,
  Grid,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { ordersApi, CreateOrderDto, UpdateOrderDto } from '../../api/orders.api';
import { Priority } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';

const OrderForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { showError, showSuccess } = useNotification();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateOrderDto>({
    title: '',
    client: '',
    clientContacts: '',
    description: '',
    referencePhotos: [],
    printRun: 0,
    deadline: '',
    budget: 0,
    priority: Priority.MEDIUM,
    isImportant: false,
  });

  useEffect(() => {
    if (id) {
      loadOrder();
    }
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const order = await ordersApi.getById(id!);
      setFormData({
        title: order.title,
        client: order.client,
        clientContacts: order.clientContacts,
        description: order.description || '',
        referencePhotos: order.referencePhotos || [],
        printRun: order.printRun,
        deadline: order.deadline.split('T')[0],
        budget: order.budget || 0,
        priority: order.priority,
        isImportant: order.isImportant || false,
      });
    } catch (error: any) {
      console.error('Failed to load order:', error);
      showError(error.response?.data?.error || 'Ошибка загрузки заказа');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (id) {
        await ordersApi.update(id, formData);
        showSuccess('Заказ успешно обновлен');
      } else {
        await ordersApi.create(formData);
        showSuccess('Заказ успешно создан');
      }
      navigate('/orders');
    } catch (error: any) {
      console.error('Failed to save order:', error);
      showError(error.response?.data?.error || 'Ошибка сохранения заказа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          {id ? 'Редактировать заказ' : 'Создать заказ'}
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Название заказа"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Клиент"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Контакты"
                value={formData.clientContacts}
                onChange={(e) => setFormData({ ...formData, clientContacts: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Описание"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={4}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Тираж (шт)"
                type="number"
                value={formData.printRun}
                onChange={(e) => setFormData({ ...formData, printRun: Number(e.target.value) })}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Дедлайн"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Бюджет"
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Приоритет"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <MenuItem value={Priority.LOW}>Низкий</MenuItem>
                <MenuItem value={Priority.MEDIUM}>Средний</MenuItem>
                <MenuItem value={Priority.HIGH}>Высокий</MenuItem>
                <MenuItem value={Priority.CRITICAL}>Критический</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isImportant || false}
                    onChange={(e) => setFormData({ ...formData, isImportant: e.target.checked })}
                  />
                }
                label="Важный заказ"
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button onClick={() => navigate('/orders')}>Отмена</Button>
                <Button type="submit" variant="contained" disabled={loading}>
                  {loading ? 'Сохранение...' : 'Сохранить'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default OrderForm;

