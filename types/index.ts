export type Note = {
  _id: string;
  title: string;
  content: string;
  userId: string;
  isPinned: boolean;
  isArchived: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type NoteDraft = Pick<Note, 'title' | 'content'>;
