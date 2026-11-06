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

export type NoteViewMode = 'all' | 'pinned' | 'archived';
export type NoteSortOption = 'updatedAt_desc' | 'createdAt_desc' | 'title_asc';

export type NotePatch = Partial<
  Pick<Note, 'title' | 'content' | 'tags' | 'isPinned' | 'isArchived'>
>;
