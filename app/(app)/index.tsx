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

import { AppIcon } from '@/components/AppIcon';
import { useAuth } from '@/lib/auth';
import { selectionHaptic, successHaptic } from '@/lib/haptics';
import { ApiError } from '@/lib/api';
import {
  useCreateNote,
  useDeleteNote,
  useNoteTags,
  useNotes,
  useUpdateNote,
} from '@/lib/notes';
import { nextThemePreference, useTheme } from '@/lib/theme';
import type { Note, NoteSortOption, NoteViewMode } from '@/types';

function NoteCard({ note }: { note: Note }) {
  const { colors } = useTheme();
  const updateNote = useUpdateNote(note._id);
  const deleteNote = useDeleteNote();

  const updateFlag = async (field: 'isPinned' | 'isArchived') => {
    try {
      await updateNote.mutateAsync({ [field]: !note[field] });
      await selectionHaptic();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not update this note.';
      Alert.alert('Update failed', message);
    }
  };

  const confirmDelete = () => {
    Alert.alert('Delete note?', 'This note will be permanently deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void deleteNote.mutateAsync(note._id)
            .then(() => successHaptic())
            .catch((error: unknown) => {
              const message = error instanceof Error ? error.message : 'Could not delete the note.';
              Alert.alert('Delete failed', message);
            });
        },
      },
    ]);
  };

  return (
    <View style={[styles.noteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push({ pathname: '/(app)/note/[id]', params: { id: note._id } })}
        style={({ pressed }) => [styles.noteBody, pressed && styles.pressed]}
      >
        <View style={styles.noteTitleRow}>
          <Text numberOfLines={1} style={[styles.noteTitle, { color: colors.text }]}>
            {note.title}
          </Text>
          {note.isPinned && <AppIcon name="pin" size={20} color={colors.pinText} />}
        </View>
        <Text numberOfLines={3} style={[styles.noteExcerpt, { color: colors.secondaryText }]}>
          {note.content.trim() || 'No content yet'}
        </Text>
        {note.tags.length > 0 && (
          <View style={styles.noteTags}>
            {note.tags.map((tag) => (
              <Text key={tag} style={[styles.noteTag, { backgroundColor: colors.tagBackground, color: colors.tagText }]}>
                {tag}
              </Text>
            ))}
          </View>
        )}
        <Text style={[styles.noteDate, { color: colors.muted }]}>
          Updated {new Date(note.updatedAt).toLocaleDateString()}
        </Text>
      </Pressable>
      <View style={[styles.noteActions, { borderTopColor: colors.border }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={note.isPinned ? 'Unpin note' : 'Pin note'}
          onPress={() => void updateFlag('isPinned')}
          disabled={updateNote.isPending}
          hitSlop={8}
          style={styles.inlineAction}
        >
          <AppIcon name={note.isPinned ? 'unpin' : 'pin'} size={20} color={note.isPinned ? colors.pinText : colors.secondaryText} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={note.isArchived ? 'Unarchive note' : 'Archive note'}
          onPress={() => void updateFlag('isArchived')}
          disabled={updateNote.isPending}
          hitSlop={8}
          style={styles.inlineAction}
        >
          <AppIcon name={note.isArchived ? 'unarchive' : 'archive'} size={20} color={colors.secondaryText} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Delete note"
          onPress={confirmDelete}
          disabled={updateNote.isPending || deleteNote.isPending}
          hitSlop={8}
          style={styles.inlineAction}
        >
          <AppIcon name="delete" size={20} color={colors.danger} />
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
  const { colors, preference, setPreference } = useTheme();
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

  const handleThemeToggle = async () => {
    try {
      await setPreference(nextThemePreference(preference));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save your theme preference.';
      Alert.alert('Theme not saved', message);
    }
  };

  const themeIcon = preference === 'system'
    ? 'themeSystem'
    : preference === 'light'
      ? 'themeLight'
      : 'themeDark';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>MARKO POLO</Text>
          <Text style={[styles.heading, { color: colors.text }]}>Your notes</Text>
          <Text style={[styles.welcome, { color: colors.muted }]}>Welcome, {user?.name ?? 'friend'}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Theme: ${preference}. Change theme`}
            onPress={() => void handleThemeToggle()}
            hitSlop={10}
            style={styles.headerIconButton}
          >
            <AppIcon name={themeIcon} color={colors.secondaryText} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            onPress={handleSignOut}
            hitSlop={10}
            style={styles.headerIconButton}
          >
            <AppIcon name="logout" color={colors.secondaryText} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.searchBox, { backgroundColor: colors.field, borderColor: colors.border }]}>
        <AppIcon name="search" color={colors.muted} size={19} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          value={search}
          onChangeText={setSearch}
          placeholder="Search notes"
          placeholderTextColor={colors.muted}
          accessibilityLabel="Search notes"
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

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
            style={[
              styles.filterChip,
              { backgroundColor: view === item.value ? colors.accent : colors.chip },
            ]}
          >
            <Text style={[styles.filterChipText, { color: view === item.value ? colors.accentText : colors.secondaryText }]}>
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
              style={[styles.tagChip, { backgroundColor: !selectedTag ? colors.tagText : colors.chip }]}
            >
              <Text style={[styles.tagChipText, { color: !selectedTag ? colors.accentText : colors.secondaryText }]}>All tags</Text>
            </Pressable>
            {tagsQuery.data?.map((tag) => (
              <Pressable
                key={tag}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedTag === tag }}
                onPress={() => setSelectedTag(selectedTag === tag ? undefined : tag)}
                style={[styles.tagChip, { backgroundColor: selectedTag === tag ? colors.tagText : colors.chip }]}
              >
                <Text style={[styles.tagChipText, { color: selectedTag === tag ? colors.accentText : colors.secondaryText }]}>
                  {tag}
                </Text>
              </Pressable>
            ))}
            {tagsQuery.isError && <Text style={[styles.inlineError, { color: colors.danger }]}>Tags unavailable</Text>}
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
            <Text style={[styles.sortOption, { color: sort === item.value ? colors.accent : colors.muted }, sort === item.value && styles.activeSortOption]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {notesQuery.isPending && !notesQuery.data ? (
        <View style={styles.listMessage}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Loading notes...</Text>
        </View>
      ) : notesQuery.isError && !notesQuery.data ? (
        <View style={[styles.messageCard, { backgroundColor: colors.surface }]}>
          <AppIcon name="refresh" color={colors.danger} size={28} />
          <Text style={[styles.errorTitle, { color: colors.danger }]}>
            {notesQuery.error instanceof ApiError && notesQuery.error.status === 0
              ? 'You appear to be offline'
              : 'Could not load notes'}
          </Text>
          <Text style={styles.errorText}>
            {notesQuery.error instanceof Error
              ? notesQuery.error.message
              : 'Check your connection and try again.'}
          </Text>
          <Pressable style={styles.secondaryButton} onPress={() => void notesQuery.refetch()}>
            <Text style={[styles.secondaryButtonText, { color: colors.accent }]}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          style={styles.notesList}
          data={notesQuery.data ?? []}
          keyExtractor={(note) => note._id}
          renderItem={({ item }) => <NoteCard note={item} />}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            notesQuery.isError ? (
              <View style={[styles.offlineBanner, { backgroundColor: colors.chip }]}>
                <AppIcon name="refresh" color={colors.danger} size={18} />
                <Text style={[styles.offlineBannerText, { color: colors.secondaryText }]}>
                  {notesQuery.error instanceof ApiError && notesQuery.error.status === 0
                    ? 'Offline — showing your last loaded notes.'
                    : 'Could not refresh notes. Showing the last loaded results.'}
                </Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Retry loading notes" onPress={() => void notesQuery.refetch()}>
                  <AppIcon name="refresh" color={colors.accent} size={18} />
                </Pressable>
              </View>
            ) : undefined
          }
          refreshControl={
            <RefreshControl
              refreshing={notesQuery.isRefetching}
              onRefresh={() => void notesQuery.refetch()}
              tintColor={colors.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {search || selectedTag ? 'No matching notes' : 'No notes here'}
              </Text>
              <Text style={[styles.emptyText, { color: colors.muted }]}>
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
        accessibilityLabel="Create a new note"
        style={[styles.createButton, { backgroundColor: colors.accent }, createNote.isPending && styles.disabledButton]}
        onPress={handleCreate}
        disabled={createNote.isPending}
      >
        <AppIcon name="add" color={colors.accentText} />
        <Text style={[styles.createButtonText, { color: colors.accentText }]}>
          {createNote.isPending ? 'Creating...' : 'New note'}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconButton: {
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
  searchBox: {
    height: 52,
    marginHorizontal: 18,
    marginBottom: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    paddingVertical: 11,
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
    fontSize: 20,
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
    fontSize: 12,
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
  inlineAction: {
    width: 36,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
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
  offlineBanner: {
    marginBottom: 2,
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offlineBannerText: {
    flex: 1,
    fontSize: 12,
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
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
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
