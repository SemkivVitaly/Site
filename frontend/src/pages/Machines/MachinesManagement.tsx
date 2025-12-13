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
  Card,
  CardContent,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Add, Edit, Delete, History, PhotoCamera, Delete as DeleteIcon } from '@mui/icons-material';
import { machinesApi, Machine, CreateMachineDto, UpdateMachineDto } from '../../api/machines.api';
import { MachineStatus } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';
import { translateMachineStatus } from '../../utils/translations';

const MachinesManagement: React.FC = () => {
  const { showError, showSuccess } = useNotification();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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

  useEffect(() => {
    loadMachines();
  }, []);

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
      <Container sx={{ px: { xs: 1, sm: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

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
          Управление станками
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={() => handleOpen()}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Добавить станок
        </Button>
      </Box>

      {isMobile ? (
        // Мобильный вид: карточки
        <Box>
          {memoizedMachines.map((machine) => (
            <Card key={machine.id} sx={{ mb: 2 }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                  <Avatar
                    src={machine.photoUrl ? `http://localhost:5000${machine.photoUrl}` : undefined}
                    alt={machine.name}
                    sx={{ width: { xs: 48, sm: 56 }, height: { xs: 48, sm: 56 } }}
                  >
                    {machine.name.charAt(0)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography 
                      variant="h6"
                      sx={{ 
                        fontSize: { xs: '0.9375rem', sm: '1.125rem' },
                        fontWeight: 600,
                        mb: 0.5,
                        wordBreak: 'break-word'
                      }}
                    >
                      {machine.name}
                    </Typography>
                    <Chip
                      label={translateMachineStatus(machine.status)}
                      color={getStatusColor(machine.status) as any}
                      size="small"
                      sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}
                    />
                  </Box>
                </Box>

                <Divider sx={{ my: 1.5 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}
                  >
                    Количество
                  </Typography>
                  <Typography 
                    variant="body2"
                    sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' }, fontWeight: 500 }}
                  >
                    {machine.quantity || 1}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}
                  >
                    Норматив (шт/час)
                  </Typography>
                  <Typography 
                    variant="body2"
                    sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' }, fontWeight: 500 }}
                  >
                    {machine.efficiencyNorm}
                  </Typography>
                </Box>

                {machine.capabilities.length > 0 && (
                  <Box sx={{ mb: 1.5 }}>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' }, display: 'block', mb: 0.5 }}
                    >
                      Операции
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {machine.capabilities.map((cap, idx) => (
                        <Chip 
                          key={idx} 
                          label={cap} 
                          size="small" 
                          sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                  <IconButton 
                    size="small" 
                    onClick={() => handleOpen(machine)}
                    sx={{ '& .MuiSvgIcon-root': { fontSize: { xs: '1.125rem', sm: '1.25rem' } } }}
                    color="primary"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => handleDelete(machine.id)}
                    sx={{ '& .MuiSvgIcon-root': { fontSize: { xs: '1.125rem', sm: '1.25rem' } } }}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                  <IconButton 
                    size="small"
                    sx={{ '& .MuiSvgIcon-root': { fontSize: { xs: '1.125rem', sm: '1.25rem' } } }}
                  >
                    <History />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
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
                <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Фото</TableCell>
                <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Название</TableCell>
                <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Статус</TableCell>
                <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Количество</TableCell>
                <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Норматив (шт/час)</TableCell>
                <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Операции</TableCell>
                <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Действия</TableCell>
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
                  <TableCell sx={{ fontSize: { sm: '0.8125rem', md: '0.875rem' } }}>{machine.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={translateMachineStatus(machine.status)}
                      color={getStatusColor(machine.status) as any}
                      size="small"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: { sm: '0.8125rem', md: '0.875rem' } }}>{machine.quantity || 1}</TableCell>
                  <TableCell sx={{ fontSize: { sm: '0.8125rem', md: '0.875rem' } }}>{machine.efficiencyNorm}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {machine.capabilities.map((cap, idx) => (
                        <Chip key={idx} label={cap} size="small" sx={{ fontSize: '0.75rem' }} />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpen(machine)}
                        sx={{ '& .MuiSvgIcon-root': { fontSize: '1.125rem' } }}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDelete(machine.id)}
                        sx={{ '& .MuiSvgIcon-root': { fontSize: '1.125rem' } }}
                      >
                        <Delete />
                      </IconButton>
                      <IconButton 
                        size="small"
                        sx={{ '& .MuiSvgIcon-root': { fontSize: '1.125rem' } }}
                      >
                        <History />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
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
          {editingMachine ? 'Редактировать станок' : 'Добавить станок'}
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
          <Box sx={{ mb: 2 }}>
            <Typography 
              variant="subtitle2" 
              gutterBottom
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              Фото станка
            </Typography>
            {photoPreview && (
              <Box sx={{ mb: 2, position: 'relative', display: 'inline-block' }}>
                <Avatar
                  src={photoPreview}
                  alt="Preview"
                  sx={{ width: { xs: 100, sm: 120 }, height: { xs: 100, sm: 120 } }}
                />
                {editingMachine && (
                  <IconButton
                    size="small"
                    onClick={handleDeletePhoto}
                    sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'error.main', color: 'white' }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            )}
            <Button
              variant="outlined"
              component="label"
              startIcon={<PhotoCamera />}
              fullWidth
              sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
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
            <InputLabel sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Статус</InputLabel>
            <Select
              value={formData.status || MachineStatus.WORKING}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              sx={{
                fontSize: { xs: '0.875rem', sm: '1rem' },
                '& .MuiSelect-select': {
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  py: { xs: 1, sm: 1.25 }
                }
              }}
            >
              <MenuItem value={MachineStatus.WORKING} sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Рабочий</MenuItem>
              <MenuItem value={MachineStatus.REPAIR} sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Ремонт</MenuItem>
              <MenuItem value={MachineStatus.MAINTENANCE} sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Обслуживание</MenuItem>
              <MenuItem value={MachineStatus.REQUIRES_ATTENTION} sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Требует внимания</MenuItem>
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
            sx={{
              '& .MuiInputBase-root': { fontSize: { xs: '1rem', sm: '1rem' } },
              '& .MuiInputLabel-root': { fontSize: { xs: '0.875rem', sm: '1rem' } },
              '& .MuiFormHelperText-root': { fontSize: { xs: '0.75rem', sm: '0.8125rem' } }
            }}
          />
          <TextField
            fullWidth
            label="Норматив выработки (шт/час на один станок)"
            type="number"
            value={formData.efficiencyNorm}
            onChange={(e) => setFormData({ ...formData, efficiencyNorm: Number(e.target.value) })}
            margin="normal"
            required
            sx={{
              '& .MuiInputBase-root': { fontSize: { xs: '1rem', sm: '1rem' } },
              '& .MuiInputLabel-root': { fontSize: { xs: '0.875rem', sm: '1rem' } }
            }}
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
            sx={{
              '& .MuiInputBase-root': { fontSize: { xs: '1rem', sm: '1rem' } },
              '& .MuiInputLabel-root': { fontSize: { xs: '0.875rem', sm: '1rem' } }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 }, gap: { xs: 1, sm: 2 } }}>
          <Button 
            onClick={handleClose} 
            disabled={submitting}
            sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
          >
            Отмена
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={submitting}
            sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
          >
            {submitting ? <CircularProgress size={20} /> : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MachinesManagement;

