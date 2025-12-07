import { Request, Response } from 'express';
import { CommentsService, CreateCommentDto } from './comments.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { io } from '../index';

const commentsService = new CommentsService();

export class CommentsController {
  async createComment(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { taskId, content } = req.body;

      if (!taskId || !content) {
        return res.status(400).json({ error: 'Task ID and content are required' });
      }

      const comment = await commentsService.createComment({
        taskId,
        userId,
        content,
      });

      // Emit real-time update
      io.emit(`task:${taskId}:comment`, comment);

      res.status(201).json(comment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getCommentsByTask(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      const comments = await commentsService.getCommentsByTask(taskId);
      res.json(comments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateComment(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const { content } = req.body;

      const comment = await commentsService.updateComment(id, content, userId!);
      res.json(comment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteComment(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      await commentsService.deleteComment(id, userId!);
      res.json({ message: 'Comment deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

