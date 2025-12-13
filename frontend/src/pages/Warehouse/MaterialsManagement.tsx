import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Alert,
  Box,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
  Divider,
} from '@mui/material';
import { Add, Edit, Delete, Warning } from '@mui/icons-material';
import { materialsApi, Material, CreateMaterialDto, UpdateMaterialDto } from '../../api/materials.api';
import { useNotification } from '../../contexts/NotificationContext';

const MaterialsManagement: React.FC = () => {
  const { showError, showSuccess } = useNotification();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [materials, setMaterials] = useState<Material[]>([]);
  const [lowStockMaterials, setLowStockMaterials] = useState<Material[]>([]);
  const [open, setOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [formData, setFormData] = useState<CreateMaterialDto>({
    name: '',
    unit: 'шт',
    currentStock: 0,
    minStock: 0,
  });

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const [allMaterials, lowStock] = await Promise.all([
        materialsApi.getAll(),
        materialsApi.getLowStockMaterials(),
      ]);
      setMaterials(allMaterials);
      setLowStockMaterials(lowStock);
    } catch (error: any) {
      console.error('Failed to load materials:', error);
      showError(error.response?.data?.error || 'Ошибка загрузки материалов');
    }
  };

  const handleOpen = (material?: Material) => {
    if (material) {
      setEditingMaterial(material);
      setFormData({
        name: material.name,
        unit: material.unit,
        currentStock: material.currentStock,
        minStock: material.minStock,
      });
    } else {
      setEditingMaterial(null);
      setFormData({
        name: '',
        unit: 'шт',
        currentStock: 0,
        minStock: 0,
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingMaterial(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingMaterial) {
        await materialsApi.update(editingMaterial.id, formData);
        showSuccess('Материал успешно обновлен');
      } else {
        await materialsApi.create(formData);
        showSuccess('Материал успешно создан');
      }
      handleClose();
      loadMaterials();
    } catch (error: any) {
      console.error('Failed to save material:', error);
      showError(error.response?.data?.error || 'Ошибка сохранения материала');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот материал?')) {
      try {
        await materialsApi.delete(id);
        showSuccess('Материал успешно удален');
        loadMaterials();
      } catch (error: any) {
        console.error('Failed to delete material:', error);
        showError(error.response?.data?.error || 'Ошибка удаления материала');
      }
    }
  };

  return (
    <Container sx={{ px: { xs: 1, sm: 2 } }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' }, 
        mb: 3,
        gap: { xs: 2, sm: 0 }
      }}>
        <Typography 
          variant="h4"
          sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
        >
          Управление материалами
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={() => handleOpen()}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Добавить материал
        </Button>
      </Box>

      {lowStockMaterials.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography 
            variant="subtitle2" 
            gutterBottom
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Материалы с низким остатком:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {lowStockMaterials.map((material) => (
              <Chip
                key={material.id}
                label={`${material.name}: ${material.currentStock} ${material.unit}`}
                color="warning"
                size="small"
                sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}
              />
            ))}
          </Box>
        </Alert>
      )}

      {isMobile ? (
        // Мобильный вид: карточки
        <Box>
          {materials.map((material) => {
            const isLowStock = material.currentStock <= material.minStock;
            return (
              <Card key={material.id} sx={{ mb: 2 }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Typography 
                      variant="h6"
                      sx={{ 
                        fontSize: { xs: '0.9375rem', sm: '1.125rem' },
                        fontWeight: 600,
                        flex: 1
                      }}
                    >
                      {material.name}
                    </Typography>
                    {isLowStock ? (
                      <Chip
                        icon={<Warning />}
                        label="Низкий остаток"
                        color="warning"
                        size="small"
                        sx={{ ml: 1, flexShrink: 0, fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}
                      />
                    ) : (
                      <Chip 
                        label="В наличии" 
                        color="success" 
                        size="small"
                        sx={{ ml: 1, flexShrink: 0, fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}
                      />
                    )}
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  <Box sx={{ mb: 1.5 }}>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' }, display: 'block', mb: 0.5 }}
                    >
                      Единица измерения
                    </Typography>
                    <Typography 
                      variant="body2"
                      sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
                    >
                      {material.unit}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' }, display: 'block', mb: 0.5 }}
                      >
                        Текущий остаток
                      </Typography>
                      <Typography 
                        variant="body2"
                        sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' }, fontWeight: 500 }}
                      >
                        {material.currentStock}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' }, display: 'block', mb: 0.5 }}
                      >
                        Минимальный остаток
                      </Typography>
                      <Typography 
                        variant="body2"
                        sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' }, fontWeight: 500 }}
                      >
                        {material.minStock}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpen(material)}
                      sx={{ '& .MuiSvgIcon-root': { fontSize: { xs: '1.125rem', sm: '1.25rem' } } }}
                      color="primary"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDelete(material.id)}
                      sx={{ '& .MuiSvgIcon-root': { fontSize: { xs: '1.125rem', sm: '1.25rem' } } }}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      ) : (
        // Десктопный вид: таблица
        <TableContainer 
          component={Paper}
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
                <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Название</TableCell>
                <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Единица</TableCell>
                <TableCell align="right" sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Текущий остаток</TableCell>
                <TableCell align="right" sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Минимальный остаток</TableCell>
                <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Статус</TableCell>
                <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {materials.map((material) => {
                const isLowStock = material.currentStock <= material.minStock;
                return (
                  <TableRow key={material.id}>
                    <TableCell sx={{ fontSize: { sm: '0.8125rem', md: '0.875rem' } }}>{material.name}</TableCell>
                    <TableCell sx={{ fontSize: { sm: '0.8125rem', md: '0.875rem' } }}>{material.unit}</TableCell>
                    <TableCell align="right" sx={{ fontSize: { sm: '0.8125rem', md: '0.875rem' } }}>{material.currentStock}</TableCell>
                    <TableCell align="right" sx={{ fontSize: { sm: '0.8125rem', md: '0.875rem' } }}>{material.minStock}</TableCell>
                    <TableCell>
                      {isLowStock ? (
                        <Chip
                          icon={<Warning />}
                          label="Низкий остаток"
                          color="warning"
                          size="small"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      ) : (
                        <Chip label="В наличии" color="success" size="small" sx={{ fontSize: '0.75rem' }} />
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpen(material)}
                          sx={{ '& .MuiSvgIcon-root': { fontSize: '1.125rem' } }}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDelete(material.id)}
                          sx={{ '& .MuiSvgIcon-root': { fontSize: '1.125rem' } }}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
        sx={{
          '& .MuiDialog-paper': {
            m: { xs: 0, sm: 2 },
            maxHeight: { xs: '100%', sm: '90vh' },
          }
        }}
      >
        <DialogTitle sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' }, pb: { xs: 1, sm: 2 } }}>
          {editingMaterial ? 'Редактировать материал' : 'Добавить материал'}
        </DialogTitle>
        <DialogContent sx={{ pt: { xs: 2, sm: 3 } }}>
          <TextField
            fullWidth
            label="Название"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
            sx={{
              '& .MuiInputBase-root': { fontSize: { xs: '1rem', sm: '1rem' } },
              '& .MuiInputLabel-root': { fontSize: { xs: '0.875rem', sm: '1rem' } }
            }}
          />
          <TextField
            fullWidth
            label="Единица измерения"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            margin="normal"
            required
            placeholder="шт, лист, кг"
            sx={{
              '& .MuiInputBase-root': { fontSize: { xs: '1rem', sm: '1rem' } },
              '& .MuiInputLabel-root': { fontSize: { xs: '0.875rem', sm: '1rem' } }
            }}
          />
          <TextField
            fullWidth
            label="Текущий остаток"
            type="number"
            value={formData.currentStock}
            onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
            margin="normal"
            required
            sx={{
              '& .MuiInputBase-root': { fontSize: { xs: '1rem', sm: '1rem' } },
              '& .MuiInputLabel-root': { fontSize: { xs: '0.875rem', sm: '1rem' } }
            }}
          />
          <TextField
            fullWidth
            label="Минимальный остаток"
            type="number"
            value={formData.minStock}
            onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
            margin="normal"
            required
            sx={{
              '& .MuiInputBase-root': { fontSize: { xs: '1rem', sm: '1rem' } },
              '& .MuiInputLabel-root': { fontSize: { xs: '0.875rem', sm: '1rem' } }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 }, gap: { xs: 1, sm: 2 } }}>
          <Button 
            onClick={handleClose}
            sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
          >
            Отмена
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
          >
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MaterialsManagement;

