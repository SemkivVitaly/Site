import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Avatar,
  CircularProgress,
} from '@mui/material';
import { Add, Edit, Delete, History, PhotoCamera, Delete as DeleteIcon } from '@mui/icons-material';
import { machinesApi, Machine, CreateMachineDto, UpdateMachineDto } from '../../api/machines.api';
import { MachineStatus } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';
import { translateMachineStatus } from '../../utils/translations';

const MachinesManagement: React.FC = () => {
  const { showError, showSuccess } = useNotification();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [formData, setFormData] = useState<CreateMachineDto>({
    name: '',
    efficiencyNorm: 0,
    quantity: 1,
    capabilities: [],
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const loadMachines = useCallback(async () => {
    try {
      setLoading(true);
      const data = await machinesApi.getAll();
      setMachines(data);
    } catch (error: any) {
      console.error('Failed to load machines:', error);
      showError(error.response?.data?.error || 'Ошибка загрузки станков');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadMachines();
  }, [loadMachines]);

  const handleOpen = (machine?: Machine) => {
    if (machine) {
      setEditingMachine(machine);
      setFormData({
        name: machine.name,
        photoUrl: machine.photoUrl,
        status: machine.status,
        efficiencyNorm: machine.efficiencyNorm,
        quantity: machine.quantity || 1,
        capabilities: machine.capabilities,
      });
      setPhotoPreview(machine.photoUrl ? `http://localhost:5000${machine.photoUrl}` : null);
    } else {
      setEditingMachine(null);
      setFormData({
        name: '',
        efficiencyNorm: 0,
        quantity: 1,
        capabilities: [],
      });
      setPhotoPreview(null);
    }
    setPhotoFile(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingMachine(null);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = useCallback(async () => {
    try {
      setSubmitting(true);
      if (editingMachine) {
        // Update machine first
        await machinesApi.update(editingMachine.id, formData);
        // If photo file is selected, upload it
        if (photoFile) {
          await machinesApi.uploadPhoto(editingMachine.id, photoFile);
        }
        showSuccess('Станок обновлен');
      } else {
        // Create machine first (without photoUrl if file is selected)
        const createData = { ...formData };
        if (photoFile) {
          delete createData.photoUrl; // Don't set photoUrl if we're uploading a file
        }
        const newMachine = await machinesApi.create(createData);
        // If photo file is selected, upload it
        if (photoFile) {
          await machinesApi.uploadPhoto(newMachine.id, photoFile);
        }
        showSuccess('Станок создан');
      }
      handleClose();
      await loadMachines();
    } catch (error: any) {
      console.error('Failed to save machine:', error);
      showError(error.response?.data?.error || 'Ошибка сохранения станка');
    } finally {
      setSubmitting(false);
    }
  }, [editingMachine, formData, photoFile, showError, showSuccess, loadMachines]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeletePhoto = async () => {
    if (editingMachine) {
      try {
        await machinesApi.deletePhoto(editingMachine.id);
        setPhotoPreview(null);
        setPhotoFile(null);
        loadMachines();
      } catch (error) {
        console.error('Failed to delete photo:', error);
      }
    }
  };

  const handleDelete = useCallback(async (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот станок?')) {
      try {
        await machinesApi.delete(id);
        showSuccess('Станок удален');
        await loadMachines();
      } catch (error: any) {
        console.error('Failed to delete machine:', error);
        showError(error.response?.data?.error || 'Ошибка удаления станка');
      }
    }
  }, [showError, showSuccess, loadMachines]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case MachineStatus.WORKING:
        return 'success';
      case MachineStatus.REPAIR:
        return 'error';
      case MachineStatus.MAINTENANCE:
        return 'warning';
      case MachineStatus.REQUIRES_ATTENTION:
        return 'error';
      default:
        return 'default';
    }
  }, []);

  const memoizedMachines = useMemo(() => machines, [machines]);

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Управление станками</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          Добавить станок
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Фото</TableCell>
              <TableCell>Название</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Количество</TableCell>
              <TableCell>Норматив (шт/час)</TableCell>
              <TableCell>Операции</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {memoizedMachines.map((machine) => (
              <TableRow key={machine.id}>
                <TableCell>
                  <Avatar
                    src={machine.photoUrl ? `http://localhost:5000${machine.photoUrl}` : undefined}
                    alt={machine.name}
                    sx={{ width: 56, height: 56 }}
                  >
                    {machine.name.charAt(0)}
                  </Avatar>
                </TableCell>
                <TableCell>{machine.name}</TableCell>
                <TableCell>
                  <Chip
                    label={translateMachineStatus(machine.status)}
                    color={getStatusColor(machine.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>{machine.quantity || 1}</TableCell>
                <TableCell>{machine.efficiencyNorm}</TableCell>
                <TableCell>
                  {machine.capabilities.map((cap, idx) => (
                    <Chip key={idx} label={cap} size="small" sx={{ mr: 0.5 }} />
                  ))}
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpen(machine)}>
                    <Edit />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(machine.id)}>
                    <Delete />
                  </IconButton>
                  <IconButton size="small">
                    <History />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingMachine ? 'Редактировать станок' : 'Добавить станок'}
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
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Фото станка
            </Typography>
            {photoPreview && (
              <Box sx={{ mb: 2, position: 'relative', display: 'inline-block' }}>
                <Avatar
                  src={photoPreview}
                  alt="Preview"
                  sx={{ width: 120, height: 120 }}
                />
                {editingMachine && (
                  <IconButton
                    size="small"
                    onClick={handleDeletePhoto}
                    sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'error.main', color: 'white' }}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            )}
            <Button
              variant="outlined"
              component="label"
              startIcon={<PhotoCamera />}
              fullWidth
            >
              {photoPreview ? 'Изменить фото' : 'Загрузить фото'}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handlePhotoChange}
              />
            </Button>
          </Box>
          <FormControl fullWidth margin="normal">
            <InputLabel>Статус</InputLabel>
            <Select
              value={formData.status || MachineStatus.WORKING}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <MenuItem value={MachineStatus.WORKING}>Рабочий</MenuItem>
              <MenuItem value={MachineStatus.REPAIR}>Ремонт</MenuItem>
              <MenuItem value={MachineStatus.MAINTENANCE}>Обслуживание</MenuItem>
              <MenuItem value={MachineStatus.REQUIRES_ATTENTION}>Требует внимания</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Количество станков"
            type="number"
            value={formData.quantity || 1}
            onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
            margin="normal"
            required
            inputProps={{ min: 1 }}
            helperText="Количество станков данного типа на производстве"
          />
          <TextField
            fullWidth
            label="Норматив выработки (шт/час на один станок)"
            type="number"
            value={formData.efficiencyNorm}
            onChange={(e) => setFormData({ ...formData, efficiencyNorm: Number(e.target.value) })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Операции (через запятую)"
            value={formData.capabilities.join(', ')}
            onChange={(e) =>
              setFormData({
                ...formData,
                capabilities: e.target.value.split(',').map((s) => s.trim()),
              })
            }
            margin="normal"
            placeholder="Печать, Ламинация, Резка"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={submitting}>Отмена</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
            {submitting ? <CircularProgress size={20} /> : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MachinesManagement;

