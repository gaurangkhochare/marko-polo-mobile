import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { Note, NoteDraft } from '@/types';

export const notesQueryKey = ['notes'] as const;

export function useNotes() {
  return useQuery({
    queryKey: notesQueryKey,
    queryFn: async () => {
      const response = await api<{ notes: Note[] }>('/api/notes?limit=100');
      return response.notes;
    },
  });
}

export function useNote(id: string) {
  return useQuery({
    queryKey: [...notesQueryKey, id],
    queryFn: async () => {
      const response = await api<{ note: Note }>(`/api/notes/${id}`);
      return response.note;
    },
    enabled: Boolean(id),
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (draft: NoteDraft) => {
      const response = await api<{ note: Note }>('/api/notes', {
        method: 'POST',
        body: JSON.stringify(draft),
      });
      return response.note;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notesQueryKey });
    },
  });
}

export function useUpdateNote(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (draft: NoteDraft) => {
      const response = await api<{ note: Note }>(`/api/notes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(draft),
      });
      return response.note;
    },
    onSuccess: async (note) => {
      queryClient.setQueryData([...notesQueryKey, id], note);
      await queryClient.invalidateQueries({ queryKey: notesQueryKey });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api(`/api/notes/${id}`, { method: 'DELETE' });
      return id;
    },
    onSuccess: async (id) => {
      queryClient.removeQueries({ queryKey: [...notesQueryKey, id] });
      await queryClient.invalidateQueries({ queryKey: notesQueryKey });
    },
  });
}
