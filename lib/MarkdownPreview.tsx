import { useMemo } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Markdown, { MarkdownIt, type RenderRules } from 'react-native-markdown-display';
import taskLists from 'markdown-it-task-lists';

import { openSafeLink } from '@/lib/markdown';
import { useTheme } from '@/lib/theme';

const markdownIt = MarkdownIt({ html: false, typographer: true }).use(taskLists);

const renderRules: RenderRules = {
  html_inline: (node) => {
    if (!node.content.startsWith('<input class="task-list-item-checkbox"')) {
      return null;
    }

    const checked = node.content.includes('checked=""');
    return (
      <Text key={node.key} style={styles.taskCheckbox}>
        {checked ? '☑ ' : '☐ '}
      </Text>
    );
  },
};

const markdownStyles = StyleSheet.create({
  body: {
    color: '#334155',
    fontSize: 16,
    lineHeight: 24,
  },
  heading1: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  heading2: {
    color: '#111827',
    fontSize: 23,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 7,
  },
  heading3: {
    color: '#111827',
    fontSize: 19,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 12,
  },
  bullet_list: {
    marginBottom: 12,
  },
  ordered_list: {
    marginBottom: 12,
  },
  list_item: {
    marginVertical: 3,
  },
  blockquote: {
    borderLeftColor: '#93c5fd',
    borderLeftWidth: 3,
    paddingLeft: 12,
    marginVertical: 8,
    backgroundColor: '#f8fafc',
  },
  code_inline: {
    fontFamily: 'monospace',
    backgroundColor: '#f1f5f9',
    color: '#7c3aed',
    paddingHorizontal: 3,
    borderRadius: 3,
  },
  code_block: {
    fontFamily: 'monospace',
    color: '#e2e8f0',
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  fence: {
    fontFamily: 'monospace',
    color: '#e2e8f0',
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  table: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#cbd5e1',
    marginVertical: 10,
  },
  th: {
    padding: 6,
    backgroundColor: '#e2e8f0',
  },
  td: {
    padding: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#cbd5e1',
  },
  link: {
    color: '#2563eb',
    textDecorationLine: 'underline',
  },
  strong: {
    fontWeight: '700',
  },
  em: {
    fontStyle: 'italic',
  },
  s: {
    textDecorationLine: 'line-through',
  },
  hr: {
    backgroundColor: '#cbd5e1',
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
});

const onLinkPress = (url: string) => {
  void openSafeLink(url).catch(() => {
    Alert.alert('Could not open link', 'Check that your device has an app available to open this link.');
  });
  return false;
};

export function MarkdownPreview({ content }: { content: string }) {
  const { colors } = useTheme();
  const source = useMemo(() => content || '_Nothing to preview yet._', [content]);
  const themedMarkdownStyles = useMemo(
    () => ({
      ...markdownStyles,
      body: { ...markdownStyles.body, color: colors.secondaryText },
      heading1: { ...markdownStyles.heading1, color: colors.text },
      heading2: { ...markdownStyles.heading2, color: colors.text },
      heading3: { ...markdownStyles.heading3, color: colors.text },
      blockquote: {
        ...markdownStyles.blockquote,
        borderLeftColor: colors.accent,
        backgroundColor: colors.field,
      },
      code_inline: {
        ...markdownStyles.code_inline,
        backgroundColor: colors.chip,
        color: colors.accent,
      },
      table: { ...markdownStyles.table, borderColor: colors.border },
      th: { ...markdownStyles.th, backgroundColor: colors.chip },
      td: { ...markdownStyles.td, borderColor: colors.border },
      link: { ...markdownStyles.link, color: colors.accent },
      hr: { ...markdownStyles.hr, backgroundColor: colors.border },
    }),
    [colors],
  );

  return (
    <View style={styles.container}>
      <Markdown
        markdownit={markdownIt}
        rules={renderRules}
        style={themedMarkdownStyles}
        onLinkPress={onLinkPress}
      >
        {source}
      </Markdown>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  taskCheckbox: {
    color: '#2563eb',
    fontSize: 17,
  },
});
