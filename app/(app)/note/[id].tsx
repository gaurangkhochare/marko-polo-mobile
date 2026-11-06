import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputSelectionChangeEvent,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MarkdownPreview } from '@/lib/MarkdownPreview';
import { useNote, useDeleteNote, useUpdateNote } from '@/lib/notes';
import { useAutosave } from '@/lib/useAutosave';
import type { Note, NoteDraft } from '@/types';

type EditorMode = 'edit' | 'preview';

function NoteEditor({ id, note }: { id: string; note: Note }) {
  const updateNote = useUpdateNote(id);
  const deleteNote = useDeleteNote();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [tagsText, setTagsText] = useState(note.tags.join(', '));
  const [mode, setMode] = useState<EditorMode>('edit');
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  const draft = useMemo<NoteDraft>(() => ({ title, content }), [content, title]);
  const autosave = useAutosave(
    draft,
    (nextDraft) => updateNote.mutateAsync(nextDraft),
  );

  const confirmDelete = () => {
    Alert.alert('Delete note?', 'This note will be permanently deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await autosave.cancel();
            await deleteNote.mutateAsync(id);
            router.replace('/(app)');
          })().catch((error: unknown) => {
            const message = error instanceof Error ? error.message : 'Could not delete the note.';
            Alert.alert('Delete failed', message);
          });
        },
      },
    ]);
  };

  const saveTags = async () => {
    const tags = [...new Set(tagsText.split(',').map((tag) => tag.trim()).filter(Boolean))];
    if (tags.length > 20 || tags.some((tag) => tag.length > 30)) {
      Alert.alert('Invalid tags', 'Use up to 20 tags, each no longer than 30 characters.');
      setTagsText(note.tags.join(', '));
      return;
    }

    if (tags.length === note.tags.length && tags.every((tag, index) => tag === note.tags[index])) {
      return;
    }

    try {
      await updateNote.mutateAsync({ tags });
      setTagsText(tags.join(', '));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save tags.';
      Alert.alert('Tags not saved', message);
      setTagsText(note.tags.join(', '));
    }
  };

  const toggleNoteFlag = async (field: 'isPinned' | 'isArchived') => {
    try {
      await updateNote.mutateAsync({ [field]: !note[field] });
      await Haptics.selectionAsync();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not update this note.';
      Alert.alert('Update failed', message);
    }
  };

  const insertMarkdown = (before: string, after = '', placeholder = 'text') => {
    const start = selection.start;
    const end = selection.end;
    const selectedText = content.slice(start, end);
    const insertedText = selectedText || placeholder;
    const updatedContent =
      content.slice(0, start) +
      before +
      insertedText +
      after +
      content.slice(end);

    setContent(updatedContent);
    const cursor = start + before.length + insertedText.length + (selectedText ? after.length : 0);
    setSelection({ start: cursor, end: cursor });
  };

  const handleSelectionChange = (event: TextInputSelectionChangeEvent) => {
    setSelection(event.nativeEvent.selection);
  };

  const editorTools = [
    { label: 'B', before: '**', after: '**', placeholder: 'bold' },
    { label: 'I', before: '*', after: '*', placeholder: 'italic' },
    { label: 'H', before: '## ', placeholder: 'Heading' },
    { label: '• List', before: '- ', placeholder: 'List item' },
    { label: 'Code', before: '`', after: '`', placeholder: 'code' },
    { label: 'Link', before: '[', after: '](https://example.com)', placeholder: 'link text' },
  ];

  const statusText = {
    saved: 'Saved',
    saving: 'Saving...',
    unsaved: 'Unsaved changes',
    error: 'Could not save. Check connection and edit to retry.',
  }[autosave.status];

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View style={styles.toolbar}>
          <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={10}>
            <Text style={styles.toolbarAction}>Back</Text>
          </Pressable>
          <Text style={[styles.saveStatus, autosave.status === 'error' && styles.errorStatus]}>
            {statusText}
          </Text>
          <Pressable accessibilityRole="button" onPress={confirmDelete} hitSlop={10}>
            <Text style={styles.deleteAction}>Delete</Text>
          </Pressable>
        </View>

        <View style={styles.modeSelector}>
          {([
            { label: 'Edit', value: 'edit' },
            { label: 'Preview', value: 'preview' },
          ] as const).map((option) => (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected: mode === option.value }}
              onPress={() => setMode(option.value)}
              style={[styles.modeButton, mode === option.value && styles.activeModeButton]}
            >
              <Text style={[styles.modeText, mode === option.value && styles.activeModeText]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {mode !== 'preview' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.formatToolbar}
            contentContainerStyle={styles.formatTools}
            keyboardShouldPersistTaps="always"
          >
            {editorTools.map((tool) => (
              <Pressable
                key={tool.label}
                accessibilityRole="button"
                accessibilityLabel={`Insert ${tool.label} Markdown`}
                onPress={() =>
                  insertMarkdown(tool.before, tool.after, tool.placeholder)
                }
                style={styles.formatButton}
              >
                <Text style={styles.formatButtonText}>{tool.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.editorContent}
        >
          <TextInput
            accessibilityLabel="Note title"
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Note title"
            maxLength={200}
            returnKeyType="next"
          />
          {mode !== 'preview' && (
            <TextInput
              accessibilityLabel="Note content"
              style={styles.contentInput}
              value={content}
              onChangeText={setContent}
              onSelectionChange={handleSelectionChange}
              selection={selection}
              placeholder="Start writing..."
              multiline
              textAlignVertical="top"
            />
          )}
          {mode !== 'edit' && (
            <View style={styles.previewPanel}>
              <MarkdownPreview content={content} />
            </View>
          )}
          <View style={styles.organizationSection}>
            <Text style={styles.sectionLabel}>Tags</Text>
            <TextInput
              accessibilityLabel="Note tags"
              style={styles.tagsInput}
              value={tagsText}
              onChangeText={setTagsText}
              onBlur={() => void saveTags()}
              placeholder="Add tags separated by commas"
              autoCapitalize="none"
              returnKeyType="done"
            />
            <Text style={styles.helperText}>Separate tags with commas. Changes save when you leave this field.</Text>
            <View style={styles.flagActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: note.isPinned }}
                onPress={() => void toggleNoteFlag('isPinned')}
                disabled={updateNote.isPending}
                style={[styles.flagButton, note.isPinned && styles.activeFlagButton]}
              >
                <Text style={[styles.flagButtonText, note.isPinned && styles.activeFlagText]}>
                  {note.isPinned ? 'Pinned' : 'Pin note'}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: note.isArchived }}
                onPress={() => void toggleNoteFlag('isArchived')}
                disabled={updateNote.isPending}
                style={[styles.flagButton, note.isArchived && styles.activeArchiveButton]}
              >
                <Text style={[styles.flagButtonText, note.isArchived && styles.activeArchiveText]}>
                  {note.isArchived ? 'Archived' : 'Archive note'}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Changes save automatically</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function NoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id || Array.isArray(id)) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorTitle}>Invalid note</Text>
        <Pressable onPress={() => router.replace('/(app)')}>
          <Text style={styles.link}>Back to notes</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return <NoteRouteContent id={id} />;
}

function NoteRouteContent({ id }: { id: string }) {
  const noteQuery = useNote(id);

  if (noteQuery.isPending) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Opening note...</Text>
      </SafeAreaView>
    );
  }

  if (noteQuery.isError) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorTitle}>Could not open this note</Text>
        <Text style={styles.errorText}>
          {noteQuery.error instanceof Error ? noteQuery.error.message : 'Try again.'}
        </Text>
        <Pressable onPress={() => void noteQuery.refetch()}>
          <Text style={styles.link}>Try again</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return <NoteEditor id={id} note={noteQuery.data} />;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
    gap: 12,
  },
  loadingText: {
    color: '#64748b',
  },
  toolbar: {
    minHeight: 54,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  toolbarAction: {
    color: '#2563eb',
    fontSize: 15,
    fontWeight: '600',
  },
  modeSelector: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginVertical: 10,
    padding: 3,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  modeButton: {
    minWidth: 76,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 9,
  },
  activeModeButton: {
    backgroundColor: '#2563eb',
  },
  modeText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  activeModeText: {
    color: '#fff',
  },
  formatToolbar: {
    maxHeight: 44,
    flexGrow: 0,
    flexShrink: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  formatTools: {
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  formatButton: {
    minWidth: 38,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
  },
  formatButtonText: {
    color: '#1d4ed8',
    fontSize: 13,
    fontWeight: '700',
  },
  saveStatus: {
    color: '#64748b',
    fontSize: 12,
  },
  errorStatus: {
    color: '#b91c1c',
  },
  deleteAction: {
    color: '#b91c1c',
    fontSize: 15,
    fontWeight: '600',
  },
  editorContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 30,
  },
  titleInput: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '700',
    paddingVertical: 8,
  },
  contentInput: {
    minHeight: 280,
    flex: 1,
    marginTop: 14,
    color: '#334155',
    fontSize: 16,
    lineHeight: 25,
    paddingVertical: 8,
  },
  previewPanel: {
    marginTop: 14,
    minHeight: 280,
  },
  organizationSection: {
    marginTop: 24,
    paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e8f0',
    gap: 10,
  },
  sectionLabel: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
  },
  tagsInput: {
    borderWidth: 1,
    borderColor: '#dbe2ea',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#334155',
    fontSize: 14,
  },
  helperText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  flagActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 3,
  },
  flagButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  activeFlagButton: {
    borderColor: '#facc15',
    backgroundColor: '#fef9c3',
  },
  activeArchiveButton: {
    borderColor: '#93c5fd',
    backgroundColor: '#dbeafe',
  },
  flagButtonText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  activeFlagText: {
    color: '#854d0e',
  },
  activeArchiveText: {
    color: '#1d4ed8',
  },
  footer: {
    padding: 12,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e8f0',
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  errorTitle: {
    color: '#991b1b',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorText: {
    color: '#64748b',
    textAlign: 'center',
  },
  link: {
    color: '#2563eb',
    fontWeight: '700',
  },
});
