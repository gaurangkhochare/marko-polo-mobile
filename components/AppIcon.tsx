import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';

const icons = {
  add: { ios: 'plus', android: 'add', web: 'add' },
  archive: { ios: 'archivebox', android: 'archive', web: 'archive' },
  back: { ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' },
  bold: { ios: 'bold', android: 'format_bold', web: 'format_bold' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  code: { ios: 'chevron.left.forwardslash.chevron.right', android: 'code', web: 'code' },
  delete: { ios: 'trash', android: 'delete', web: 'delete' },
  email: { ios: 'envelope', android: 'email', web: 'email' },
  edit: { ios: 'pencil', android: 'edit', web: 'edit' },
  heading: { ios: 'textformat.size', android: 'text_fields', web: 'text_fields' },
  italic: { ios: 'italic', android: 'format_italic', web: 'format_italic' },
  link: { ios: 'link', android: 'link', web: 'link' },
  list: { ios: 'list.bullet', android: 'format_list_bulleted', web: 'format_list_bulleted' },
  logout: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' },
  pin: { ios: 'pin.fill', android: 'push_pin', web: 'push_pin' },
  preview: { ios: 'eye', android: 'visibility', web: 'visibility' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  settings: { ios: 'gearshape', android: 'settings', web: 'settings' },
  themeDark: { ios: 'moon', android: 'dark_mode', web: 'dark_mode' },
  themeLight: { ios: 'sun.max', android: 'light_mode', web: 'light_mode' },
  themeSystem: { ios: 'circle.lefthalf.filled', android: 'settings', web: 'settings' },
  unarchive: { ios: 'tray.and.arrow.up', android: 'unarchive', web: 'unarchive' },
  unpin: { ios: 'pin.slash', android: 'push_pin', web: 'push_pin' },
  password: { ios: 'lock', android: 'lock', web: 'lock' },
  person: { ios: 'person', android: 'person', web: 'person' },
  refresh: { ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' },
} as const satisfies Record<string, { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol }>;

export type AppIconName = keyof typeof icons;

export function AppIcon({
  name,
  size = 20,
  color = '#475569',
}: {
  name: AppIconName;
  size?: number;
  color?: string;
}) {
  return <SymbolView name={icons[name]} size={size} tintColor={color} />;
}
