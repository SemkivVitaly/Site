import { Router } from 'express';
import { CommentsController } from '../comments/comments.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const commentsController = new CommentsController();

router.post('/', authMiddleware, commentsController.createComment.bind(commentsController));
router.get('/task/:taskId', authMiddleware, commentsController.getCommentsByTask.bind(commentsController));
router.put('/:id', authMiddleware, commentsController.updateComment.bind(commentsController));
router.delete('/:id', authMiddleware, commentsController.deleteComment.bind(commentsController));

export default router;

