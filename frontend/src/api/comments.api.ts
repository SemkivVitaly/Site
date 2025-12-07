import client from './client';

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentDto {
  taskId: string;
  content: string;
}

export const commentsApi = {
  createComment: async (data: CreateCommentDto): Promise<TaskComment> => {
    const response = await client.post<TaskComment>('/comments', data);
    return response.data;
  },

  getCommentsByTask: async (taskId: string): Promise<TaskComment[]> => {
    const response = await client.get<TaskComment[]>(`/comments/task/${taskId}`);
    return response.data;
  },

  updateComment: async (id: string, content: string): Promise<TaskComment> => {
    const response = await client.put<TaskComment>(`/comments/${id}`, { content });
    return response.data;
  },

  deleteComment: async (id: string): Promise<void> => {
    await client.delete(`/comments/${id}`);
  },
};

