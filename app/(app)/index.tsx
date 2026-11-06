import { router } from 'expo-router';
import { useCallback } from 'react';
import {
  Alert,
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth';
import { useCreateNote, useNotes } from '@/lib/notes';
import type { Note } from '@/types';

function NoteCard({ note }: { note: Note }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/(app)/note/[id]', params: { id: note._id } })}
      style={({ pressed }) => [styles.noteCard, pressed && styles.pressed]}
    >
      <Text numberOfLines={1} style={styles.noteTitle}>
        {note.title}
      </Text>
      <Text numberOfLines={3} style={styles.noteExcerpt}>
        {note.content.trim() || 'No content yet'}
      </Text>
      <Text style={styles.noteDate}>
        Updated {new Date(note.updatedAt).toLocaleDateString()}
      </Text>
    </Pressable>
  );
}

export default function NotesHomeScreen() {
  const { user, signOut } = useAuth();
  const notesQuery = useNotes();
  const createNote = useCreateNote();

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

  const renderNote = useCallback(
    ({ item }: { item: Note }) => <NoteCard note={item} />,
    [],
  );

  if (notesQuery.isPending) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading your notes...</Text>
      </SafeAreaView>
    );
  }

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

      {notesQuery.isError ? (
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
          data={notesQuery.data ?? []}
          keyExtractor={(note) => note._id}
          renderItem={renderNote}
          contentContainerStyle={[
            styles.listContent,
            !notesQuery.data?.length && styles.emptyList,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={notesQuery.isRefetching}
              onRefresh={() => void notesQuery.refetch()}
              tintColor="#2563eb"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No notes yet</Text>
              <Text style={styles.emptyText}>Create a note to get started.</Text>
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
    paddingBottom: 18,
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
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 100,
    gap: 12,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  noteCard: {
    padding: 17,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5eaf1',
  },
  pressed: {
    opacity: 0.75,
  },
  noteTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  noteExcerpt: {
    marginTop: 8,
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
  },
  noteDate: {
    marginTop: 12,
    color: '#94a3b8',
    fontSize: 12,
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
