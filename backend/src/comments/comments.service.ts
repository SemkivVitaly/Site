import prisma from '../config/database';

export interface CreateCommentDto {
  taskId: string;
  userId: string;
  content: string;
}

export class CommentsService {
  async createComment(data: CreateCommentDto) {
    return prisma.taskComment.create({
      data: {
        taskId: data.taskId,
        userId: data.userId,
        content: data.content,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  }

  async getCommentsByTask(taskId: string) {
    return prisma.taskComment.findMany({
      where: { taskId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateComment(commentId: string, content: string, userId: string) {
    // Check if user owns the comment
    const comment = await prisma.taskComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new Error('Not authorized to update this comment');
    }

    return prisma.taskComment.update({
      where: { id: commentId },
      data: { content },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  }

  async deleteComment(commentId: string, userId: string) {
    // Check if user owns the comment or is admin
    const comment = await prisma.taskComment.findUnique({
      where: { id: commentId },
      include: { user: true },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (comment.userId !== userId && user?.role !== 'ADMIN') {
      throw new Error('Not authorized to delete this comment');
    }

    return prisma.taskComment.delete({
      where: { id: commentId },
    });
  }
}

