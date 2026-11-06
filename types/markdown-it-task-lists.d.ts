declare module 'markdown-it-task-lists' {
  import type { MarkdownIt } from 'react-native-markdown-display';

  type TaskListOptions = {
    enabled?: boolean;
    label?: boolean;
    labelAfter?: boolean;
  };

  const taskLists: (markdown: MarkdownIt, options?: TaskListOptions) => void;
  export default taskLists;
}
