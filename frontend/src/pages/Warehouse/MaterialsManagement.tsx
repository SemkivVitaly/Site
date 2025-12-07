import React, { useState, useEffect, useCallback } from 'react';
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
} from '@mui/material';
import { Add, Edit, Delete, Warning } from '@mui/icons-material';
import { materialsApi, Material, CreateMaterialDto } from '../../api/materials.api';
import { useNotification } from '../../contexts/NotificationContext';

const MaterialsManagement: React.FC = () => {
  const { showError, showSuccess } = useNotification();
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

  const loadMaterials = useCallback(async () => {
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
  }, [showError]);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

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
    <Container>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Управление материалами</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          Добавить материал
        </Button>
      </Box>

      {lowStockMaterials.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Материалы с низким остатком:
          </Typography>
          {lowStockMaterials.map((material) => (
            <Chip
              key={material.id}
              label={`${material.name}: ${material.currentStock} ${material.unit}`}
              color="warning"
              size="small"
              sx={{ mr: 1, mb: 1 }}
            />
          ))}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Название</TableCell>
              <TableCell>Единица</TableCell>
              <TableCell align="right">Текущий остаток</TableCell>
              <TableCell align="right">Минимальный остаток</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {materials.map((material) => {
              const isLowStock = material.currentStock <= material.minStock;
              return (
                <TableRow key={material.id}>
                  <TableCell>{material.name}</TableCell>
                  <TableCell>{material.unit}</TableCell>
                  <TableCell align="right">{material.currentStock}</TableCell>
                  <TableCell align="right">{material.minStock}</TableCell>
                  <TableCell>
                    {isLowStock ? (
                      <Chip
                        icon={<Warning />}
                        label="Низкий остаток"
                        color="warning"
                        size="small"
                      />
                    ) : (
                      <Chip label="В наличии" color="success" size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpen(material)}>
                      <Edit />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(material.id)}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingMaterial ? 'Редактировать материал' : 'Добавить материал'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Название"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Единица измерения"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            margin="normal"
            required
            placeholder="шт, лист, кг"
          />
          <TextField
            fullWidth
            label="Текущий остаток"
            type="number"
            value={formData.currentStock}
            onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Минимальный остаток"
            type="number"
            value={formData.minStock}
            onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
            margin="normal"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Отмена</Button>
          <Button onClick={handleSubmit} variant="contained">
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MaterialsManagement;

