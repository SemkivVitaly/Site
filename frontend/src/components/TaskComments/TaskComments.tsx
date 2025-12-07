import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
  IconButton,
} from '@mui/material';
import { Send, Delete } from '@mui/icons-material';
import { commentsApi, TaskComment } from '../../api/comments.api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { io } from 'socket.io-client';

interface TaskCommentsProps {
  taskId: string;
}

const TaskComments: React.FC<TaskCommentsProps> = ({ taskId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadComments();

    // Subscribe to real-time updates
    const token = localStorage.getItem('token');
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: { token },
    });

    socket.on(`task:${taskId}:comment`, (comment: TaskComment) => {
      setComments((prev) => [...prev, comment]);
    });

    return () => {
      socket.disconnect();
    };
  }, [taskId]);

  const loadComments = async () => {
    try {
      const data = await commentsApi.getCommentsByTask(taskId);
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setLoading(true);
      const comment = await commentsApi.createComment({
        taskId,
        content: newComment,
      });
      setNewComment('');
      setComments((prev) => [...prev, comment]);
    } catch (error) {
      console.error('Failed to create comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await commentsApi.deleteComment(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Комментарии
      </Typography>

      <List>
        {comments.map((comment) => (
          <ListItem
            key={comment.id}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              mb: 1,
            }}
          >
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle2">
                    {comment.user.firstName} {comment.user.lastName}
                    {comment.user.role === 'ADMIN' && (
                      <span style={{ color: 'blue', marginLeft: 8 }}>(НП)</span>
                    )}
                  </Typography>
                  {(user?.id === comment.userId || user?.role === 'ADMIN') && (
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(comment.id)}
                    >
                      <Delete />
                    </IconButton>
                  )}
                </Box>
              }
              secondary={
                <>
                  <Typography variant="body2">{comment.content}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(comment.createdAt).toLocaleString('ru-RU')}
                  </Typography>
                </>
              }
            />
          </ListItem>
        ))}
      </List>

      <Paper sx={{ p: 2, mt: 2 }}>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Написать комментарий..."
            margin="normal"
          />
          <Button
            type="submit"
            variant="contained"
            startIcon={<Send />}
            disabled={loading || !newComment.trim()}
            sx={{ mt: 1 }}
          >
            Отправить
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default TaskComments;

