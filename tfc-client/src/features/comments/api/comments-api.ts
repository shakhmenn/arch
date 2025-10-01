import { http } from '@shared/api/http';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Comment, CreateCommentPayload } from '@entities/comment/model/types';

const commentsKey = (taskId: number) => ['comments', taskId] as const;

export const useCommentsQuery = (taskId: number, enabled = true) => {
  return useQuery({
    queryKey: commentsKey(taskId),
    enabled,
    queryFn: async () => {
      const url = `/comments?taskId=${encodeURIComponent(String(taskId))}`;
      return await http<Comment[]>(url, { method: 'GET' });
    },
  });
};

export const useCreateCommentMutation = (taskId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<CreateCommentPayload, 'taskId'>) => {
      const body: CreateCommentPayload = { taskId, ...payload };
      return await http<Comment>('/comments', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: commentsKey(taskId) });
    },
  });
};
