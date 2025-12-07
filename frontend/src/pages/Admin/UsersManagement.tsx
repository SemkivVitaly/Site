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
  Box,
  Chip,
  Checkbox,
  FormControlLabel,
  FormGroup,
  CircularProgress,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { usersApi, User, CreateUserDto, UpdateUserDto } from '../../api/users.api';
import { UserRole } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';

const availableTags = ['Настройщик', 'Печатник', 'Резчик', 'Упаковщик', 'Оператор'];

const UsersManagement: React.FC = () => {
  const { showError, showSuccess } = useNotification();
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<CreateUserDto>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: UserRole.EMPLOYEE,
    tags: [],
    salary: undefined,
  });

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await usersApi.getAll();
      setUsers(data);
    } catch (error: any) {
      showError(error.response?.data?.error || 'Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleOpen = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        password: '',
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tags: Array.isArray(user.tags) ? user.tags : [],
        salary: user.salary,
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: UserRole.EMPLOYEE,
        tags: [],
        salary: undefined,
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = useCallback(async () => {
    try {
      if (!formData.email || !formData.firstName || !formData.lastName) {
        showError('Заполните все обязательные поля');
        return;
      }

      if (!editingUser && !formData.password) {
        showError('Пароль обязателен для нового пользователя');
        return;
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        showError('Некорректный email адрес');
        return;
      }

      // Password validation
      if (!editingUser && formData.password && formData.password.length < 6) {
        showError('Пароль должен содержать минимум 6 символов');
        return;
      }

      setSubmitting(true);
      if (editingUser) {
        const updateData: UpdateUserDto = {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          tags: formData.tags,
          salary: formData.salary,
        };
        if (formData.password) {
          if (formData.password.length < 6) {
            showError('Пароль должен содержать минимум 6 символов');
            setSubmitting(false);
            return;
          }
          updateData.password = formData.password;
        }
        await usersApi.update(editingUser.id, updateData);
        showSuccess('Пользователь обновлен');
      } else {
        await usersApi.create(formData);
        showSuccess('Пользователь создан');
      }
      handleClose();
      await loadUsers();
    } catch (error: any) {
      showError(error.response?.data?.error || 'Ошибка сохранения пользователя');
    } finally {
      setSubmitting(false);
    }
  }, [formData, editingUser, showError, showSuccess, loadUsers]);

  const handleDelete = useCallback(async (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      try {
        await usersApi.delete(id);
        showSuccess('Пользователь удален');
        await loadUsers();
      } catch (error: any) {
        showError(error.response?.data?.error || 'Ошибка удаления пользователя');
      }
    }
  }, [showError, showSuccess, loadUsers]);

  const handleTagToggle = (tag: string) => {
    const currentTags = formData.tags || [];
    if (currentTags.includes(tag)) {
      setFormData({ ...formData, tags: currentTags.filter((t) => t !== tag) });
    } else {
      setFormData({ ...formData, tags: [...currentTags, tag] });
    }
  };

  const getRoleLabel = useCallback((role: string) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'Администратор';
      case UserRole.MANAGER:
        return 'Менеджер';
      case UserRole.EMPLOYEE:
        return 'Сотрудник';
      default:
        return role;
    }
  }, []);

  const memoizedUsers = useMemo(() => users, [users]);

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
        <Typography variant="h4">Управление пользователями</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          Добавить пользователя
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ФИО</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Роль</TableCell>
              <TableCell>Теги</TableCell>
              <TableCell>Зарплата</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {memoizedUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  {user.firstName} {user.lastName}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip label={getRoleLabel(user.role)} size="small" />
                </TableCell>
                <TableCell>
                  {Array.isArray(user.tags) && user.tags.length > 0 ? (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {user.tags.map((tag, idx) => (
                        <Chip key={idx} label={tag} size="small" />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Нет тегов
                    </Typography>
                  )}
                </TableCell>
                <TableCell>{user.salary ? `${user.salary} ₽` : '-'}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpen(user)}>
                    <Edit />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(user.id)} color="error">
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? 'Редактировать пользователя' : 'Создать пользователя'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label={editingUser ? 'Новый пароль (оставьте пустым, чтобы не менять)' : 'Пароль'}
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            margin="normal"
            required={!editingUser}
          />
          <TextField
            fullWidth
            label="Имя"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Фамилия"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            margin="normal"
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Роль</InputLabel>
            <Select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <MenuItem value={UserRole.ADMIN}>Администратор</MenuItem>
              <MenuItem value={UserRole.MANAGER}>Менеджер</MenuItem>
              <MenuItem value={UserRole.EMPLOYEE}>Сотрудник</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Зарплата"
            type="number"
            value={formData.salary || ''}
            onChange={(e) =>
              setFormData({ ...formData, salary: e.target.value ? Number(e.target.value) : undefined })
            }
            margin="normal"
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Теги
            </Typography>
            <FormGroup>
              {availableTags.map((tag) => (
                <FormControlLabel
                  key={tag}
                  control={
                    <Checkbox
                      checked={(formData.tags || []).includes(tag)}
                      onChange={() => handleTagToggle(tag)}
                    />
                  }
                  label={tag}
                />
              ))}
            </FormGroup>
          </Box>
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

export default UsersManagement;

