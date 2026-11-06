import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth';
import {
  useCreateNote,
  useNoteTags,
  useNotes,
  useUpdateNote,
} from '@/lib/notes';
import type { Note, NoteSortOption, NoteViewMode } from '@/types';

function NoteCard({ note }: { note: Note }) {
  const updateNote = useUpdateNote(note._id);

  const updateFlag = async (field: 'isPinned' | 'isArchived') => {
    try {
      await updateNote.mutateAsync({ [field]: !note[field] });
      await Haptics.selectionAsync();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not update this note.';
      Alert.alert('Update failed', message);
    }
  };

  return (
    <View style={styles.noteCard}>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push({ pathname: '/(app)/note/[id]', params: { id: note._id } })}
        style={({ pressed }) => [styles.noteBody, pressed && styles.pressed]}
      >
        <View style={styles.noteTitleRow}>
          <Text numberOfLines={1} style={styles.noteTitle}>
            {note.title}
          </Text>
          {note.isPinned && <Text style={styles.pinIndicator}>PINNED</Text>}
        </View>
        <Text numberOfLines={3} style={styles.noteExcerpt}>
          {note.content.trim() || 'No content yet'}
        </Text>
        {note.tags.length > 0 && (
          <View style={styles.noteTags}>
            {note.tags.map((tag) => (
              <Text key={tag} style={styles.noteTag}>
                {tag}
              </Text>
            ))}
          </View>
        )}
        <Text style={styles.noteDate}>
          Updated {new Date(note.updatedAt).toLocaleDateString()}
        </Text>
      </Pressable>
      <View style={styles.noteActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={note.isPinned ? 'Unpin note' : 'Pin note'}
          onPress={() => void updateFlag('isPinned')}
          disabled={updateNote.isPending}
          hitSlop={8}
        >
          <Text style={[styles.noteAction, note.isPinned && styles.activeAction]}>
            {note.isPinned ? 'Unpin' : 'Pin'}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={note.isArchived ? 'Unarchive note' : 'Archive note'}
          onPress={() => void updateFlag('isArchived')}
          disabled={updateNote.isPending}
          hitSlop={8}
        >
          <Text style={styles.noteAction}>{note.isArchived ? 'Unarchive' : 'Archive'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const views: { label: string; value: NoteViewMode }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pinned', value: 'pinned' },
  { label: 'Archived', value: 'archived' },
];

const sortOptions: { label: string; value: NoteSortOption }[] = [
  { label: 'Recently updated', value: 'updatedAt_desc' },
  { label: 'Recently created', value: 'createdAt_desc' },
  { label: 'Title', value: 'title_asc' },
];

export default function NotesHomeScreen() {
  const { user, signOut } = useAuth();
  const [view, setView] = useState<NoteViewMode>('all');
  const [sort, setSort] = useState<NoteSortOption>('updatedAt_desc');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>();
  const notesQuery = useNotes({
    view,
    query: debouncedSearch,
    tag: selectedTag,
    sort,
  });
  const tagsQuery = useNoteTags();
  const createNote = useCreateNote();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleCreate = async () => {
    try {
      const note = await createNote.mutateAsync({
        title: 'Untitled note',
        content: '',
      });
      router.push({ pathname: '/(app)/note/[id]', params: { id: note._id } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not create the note.';
      Alert.alert('Could not create note', message);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>MARKO POLO</Text>
          <Text style={styles.heading}>Your notes</Text>
          <Text style={styles.welcome}>Welcome, {user?.name ?? 'friend'}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={handleSignOut} hitSlop={10}>
          <Text style={styles.signOut}>Sign out</Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.searchInput}
        value={search}
        onChangeText={setSearch}
        placeholder="Search notes"
        accessibilityLabel="Search notes"
        returnKeyType="search"
        clearButtonMode="while-editing"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.chipRow}
      >
        {views.map((item) => (
          <Pressable
            key={item.value}
            accessibilityRole="button"
            accessibilityState={{ selected: view === item.value }}
            onPress={() => {
              setView(item.value);
              if (item.value === 'archived') setSelectedTag(undefined);
            }}
            style={[styles.filterChip, view === item.value && styles.selectedFilterChip]}
          >
            <Text style={[styles.filterChipText, view === item.value && styles.selectedFilterText]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.chipRow}
      >
        {view !== 'archived' && (
          <>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: !selectedTag }}
            onPress={() => setSelectedTag(undefined)}
            style={[styles.tagChip, !selectedTag && styles.selectedTagChip]}
          >
            <Text style={[styles.tagChipText, !selectedTag && styles.selectedFilterText]}>All tags</Text>
          </Pressable>
          {tagsQuery.data?.map((tag) => (
            <Pressable
              key={tag}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedTag === tag }}
              onPress={() => setSelectedTag(selectedTag === tag ? undefined : tag)}
              style={[styles.tagChip, selectedTag === tag && styles.selectedTagChip]}
            >
              <Text style={[styles.tagChipText, selectedTag === tag && styles.selectedFilterText]}>
                {tag}
              </Text>
            </Pressable>
          ))}
          {tagsQuery.isError && <Text style={styles.inlineError}>Tags unavailable</Text>}
          </>
        )}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.sortScroll}
        contentContainerStyle={styles.sortRow}
      >
        {sortOptions.map((item) => (
          <Pressable key={item.value} onPress={() => setSort(item.value)} hitSlop={6}>
            <Text style={[styles.sortOption, sort === item.value && styles.activeSortOption]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {notesQuery.isPending ? (
        <View style={styles.listMessage}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading notes...</Text>
        </View>
      ) : notesQuery.isError ? (
        <View style={styles.messageCard}>
          <Text style={styles.errorTitle}>Could not load notes</Text>
          <Text style={styles.errorText}>
            {notesQuery.error instanceof Error
              ? notesQuery.error.message
              : 'Check your connection and try again.'}
          </Text>
          <Pressable style={styles.secondaryButton} onPress={() => void notesQuery.refetch()}>
            <Text style={styles.secondaryButtonText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          style={styles.notesList}
          data={notesQuery.data ?? []}
          keyExtractor={(note) => note._id}
          renderItem={({ item }) => <NoteCard note={item} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={notesQuery.isRefetching}
              onRefresh={() => void notesQuery.refetch()}
              tintColor="#2563eb"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                {search || selectedTag ? 'No matching notes' : 'No notes here'}
              </Text>
              <Text style={styles.emptyText}>
                {search || selectedTag
                  ? 'Try a different search or tag.'
                  : view === 'archived'
                    ? 'Archived notes will appear here.'
                    : 'Create a note to get started.'}
              </Text>
            </View>
          }
        />
      )}

      <Pressable
        accessibilityRole="button"
        style={[styles.createButton, createNote.isPending && styles.disabledButton]}
        onPress={handleCreate}
        disabled={createNote.isPending}
      >
        <Text style={styles.createButtonText}>
          {createNote.isPending ? 'Creating...' : '＋  New note'}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4f7fb',
    gap: 12,
  },
  loadingText: {
    color: '#64748b',
  },
  header: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: '#2563eb',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  heading: {
    marginTop: 5,
    color: '#111827',
    fontSize: 30,
    fontWeight: '700',
  },
  welcome: {
    marginTop: 3,
    color: '#64748b',
    fontSize: 14,
  },
  signOut: {
    color: '#475569',
    fontWeight: '600',
  },
  searchInput: {
    height: 52,
    marginHorizontal: 18,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5eaf1',
    color: '#111827',
    fontSize: 15,
  },
  filterScroll: {
    height: 48,
    flexGrow: 0,
    flexShrink: 0,
  },
  chipRow: {
    height: 48,
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e8edf5',
  },
  selectedFilterChip: {
    backgroundColor: '#2563eb',
  },
  filterChipText: {
    color: '#475569',
    fontWeight: '600',
  },
  selectedFilterText: {
    color: '#fff',
  },
  tagChip: {
    borderRadius: 16,
    backgroundColor: '#e8edf5',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectedTagChip: {
    backgroundColor: '#0f766e',
  },
  tagChipText: {
    color: '#475569',
    fontSize: 13,
  },
  inlineError: {
    color: '#b91c1c',
    fontSize: 12,
    alignSelf: 'center',
  },
  sortScroll: {
    height: 40,
    flexGrow: 0,
    flexShrink: 0,
  },
  sortRow: {
    height: 40,
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 18,
  },
  sortOption: {
    color: '#64748b',
    fontSize: 12,
  },
  activeSortOption: {
    color: '#1d4ed8',
    fontWeight: '700',
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingBottom: 100,
    gap: 12,
  },
  notesList: {
    flex: 1,
  },
  listMessage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  noteCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5eaf1',
  },
  noteBody: {
    gap: 7,
  },
  pressed: {
    opacity: 0.75,
  },
  noteTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noteTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  pinIndicator: {
    color: '#a16207',
    fontSize: 9,
    fontWeight: '700',
  },
  noteExcerpt: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
  },
  noteTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  noteTag: {
    color: '#0f766e',
    backgroundColor: '#ccfbf1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    fontSize: 11,
  },
  noteDate: {
    color: '#94a3b8',
    fontSize: 12,
  },
  noteActions: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 20,
  },
  noteAction: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  activeAction: {
    color: '#a16207',
  },
  emptyState: {
    alignItems: 'center',
    padding: 28,
  },
  emptyTitle: {
    color: '#111827',
    fontSize: 19,
    fontWeight: '700',
  },
  emptyText: {
    marginTop: 7,
    color: '#64748b',
    textAlign: 'center',
  },
  messageCard: {
    marginHorizontal: 18,
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#fff',
    gap: 8,
  },
  errorTitle: {
    color: '#991b1b',
    fontSize: 17,
    fontWeight: '700',
  },
  errorText: {
    color: '#64748b',
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  secondaryButtonText: {
    color: '#2563eb',
    fontWeight: '700',
  },
  createButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    left: 20,
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 15,
    backgroundColor: '#2563eb',
  },
  disabledButton: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
