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
  Card,
  CardContent,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { usersApi, User, CreateUserDto, UpdateUserDto } from '../../api/users.api';
import { UserRole } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';

const availableTags = ['Настройщик', 'Печатник', 'Резчик', 'Упаковщик', 'Оператор'];

const UsersManagement: React.FC = () => {
  const { showError, showSuccess } = useNotification();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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

  useEffect(() => {
    loadUsers();
  }, []);

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
          Управление пользователями
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={() => handleOpen()}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Добавить пользователя
        </Button>
      </Box>

      {isMobile ? (
        // Мобильный вид: карточки
        <Box>
          {memoizedUsers.map((user) => (
            <Card key={user.id} sx={{ mb: 2 }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Typography 
                  variant="h6"
                  sx={{ 
                    fontSize: { xs: '0.9375rem', sm: '1.125rem' },
                    fontWeight: 600,
                    mb: 1.5
                  }}
                >
                  {user.firstName} {user.lastName}
                </Typography>

                <Divider sx={{ my: 1.5 }} />

                <Box sx={{ mb: 1.5 }}>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' }, display: 'block', mb: 0.5 }}
                  >
                    Email
                  </Typography>
                  <Typography 
                    variant="body2"
                    sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
                  >
                    {user.email}
                  </Typography>
                </Box>

                <Box sx={{ mb: 1.5 }}>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' }, display: 'block', mb: 0.5 }}
                  >
                    Роль
                  </Typography>
                  <Chip 
                    label={getRoleLabel(user.role)} 
                    size="small"
                    sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}
                  />
                </Box>

                {Array.isArray(user.tags) && user.tags.length > 0 && (
                  <Box sx={{ mb: 1.5 }}>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' }, display: 'block', mb: 0.5 }}
                    >
                      Теги
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {user.tags.map((tag, idx) => (
                        <Chip 
                          key={idx} 
                          label={tag} 
                          size="small"
                          sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                <Box sx={{ mb: 1.5 }}>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' }, display: 'block', mb: 0.5 }}
                  >
                    Зарплата
                  </Typography>
                  <Typography 
                    variant="body2"
                    sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
                  >
                    {user.salary ? `${user.salary} ₽` : '-'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                  <IconButton 
                    size="small" 
                    onClick={() => handleOpen(user)}
                    sx={{ '& .MuiSvgIcon-root': { fontSize: { xs: '1.125rem', sm: '1.25rem' } } }}
                    color="primary"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => handleDelete(user.id)} 
                    color="error"
                    sx={{ '& .MuiSvgIcon-root': { fontSize: { xs: '1.125rem', sm: '1.25rem' } } }}
                  >
                    <Delete />
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
                <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>ФИО</TableCell>
                <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Email</TableCell>
                <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Роль</TableCell>
                <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Теги</TableCell>
                <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Зарплата</TableCell>
                <TableCell sx={{ fontSize: { sm: '0.875rem', md: '0.9375rem' } }}>Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {memoizedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell sx={{ fontSize: { sm: '0.8125rem', md: '0.875rem' } }}>
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell sx={{ fontSize: { sm: '0.8125rem', md: '0.875rem' } }}>{user.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={getRoleLabel(user.role)} 
                      size="small"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  </TableCell>
                  <TableCell>
                    {Array.isArray(user.tags) && user.tags.length > 0 ? (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {user.tags.map((tag, idx) => (
                          <Chip key={idx} label={tag} size="small" sx={{ fontSize: '0.75rem' }} />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: { sm: '0.8125rem', md: '0.875rem' } }}>
                        Нет тегов
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontSize: { sm: '0.8125rem', md: '0.875rem' } }}>
                    {user.salary ? `${user.salary} ₽` : '-'}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpen(user)}
                        sx={{ '& .MuiSvgIcon-root': { fontSize: '1.125rem' } }}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDelete(user.id)} 
                        color="error"
                        sx={{ '& .MuiSvgIcon-root': { fontSize: '1.125rem' } }}
                      >
                        <Delete />
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
          {editingUser ? 'Редактировать пользователя' : 'Создать пользователя'}
        </DialogTitle>
        <DialogContent sx={{ pt: { xs: 2, sm: 3 } }}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            margin="normal"
            required
            sx={{
              '& .MuiInputBase-root': { fontSize: { xs: '1rem', sm: '1rem' } },
              '& .MuiInputLabel-root': { fontSize: { xs: '0.875rem', sm: '1rem' } }
            }}
          />
          <TextField
            fullWidth
            label={editingUser ? 'Новый пароль (оставьте пустым, чтобы не менять)' : 'Пароль'}
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            margin="normal"
            required={!editingUser}
            sx={{
              '& .MuiInputBase-root': { fontSize: { xs: '1rem', sm: '1rem' } },
              '& .MuiInputLabel-root': { fontSize: { xs: '0.875rem', sm: '1rem' } }
            }}
          />
          <TextField
            fullWidth
            label="Имя"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            margin="normal"
            required
            sx={{
              '& .MuiInputBase-root': { fontSize: { xs: '1rem', sm: '1rem' } },
              '& .MuiInputLabel-root': { fontSize: { xs: '0.875rem', sm: '1rem' } }
            }}
          />
          <TextField
            fullWidth
            label="Фамилия"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            margin="normal"
            required
            sx={{
              '& .MuiInputBase-root': { fontSize: { xs: '1rem', sm: '1rem' } },
              '& .MuiInputLabel-root': { fontSize: { xs: '0.875rem', sm: '1rem' } }
            }}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Роль</InputLabel>
            <Select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              sx={{
                fontSize: { xs: '0.875rem', sm: '1rem' },
                '& .MuiSelect-select': {
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  py: { xs: 1, sm: 1.25 }
                }
              }}
            >
              <MenuItem value={UserRole.ADMIN} sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Администратор</MenuItem>
              <MenuItem value={UserRole.MANAGER} sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Менеджер</MenuItem>
              <MenuItem value={UserRole.EMPLOYEE} sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Сотрудник</MenuItem>
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
            sx={{
              '& .MuiInputBase-root': { fontSize: { xs: '1rem', sm: '1rem' } },
              '& .MuiInputLabel-root': { fontSize: { xs: '0.875rem', sm: '1rem' } }
            }}
          />
          <Box sx={{ mt: 2 }}>
            <Typography 
              variant="subtitle2" 
              gutterBottom
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
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
                      size="small"
                    />
                  }
                  label={tag}
                  sx={{
                    '& .MuiFormControlLabel-label': { fontSize: { xs: '0.875rem', sm: '1rem' } }
                  }}
                />
              ))}
            </FormGroup>
          </Box>
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

export default UsersManagement;

