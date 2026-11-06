import * as Linking from 'expo-linking';

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

export async function openSafeLink(url: string): Promise<boolean> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return false;
  }

  if (!ALLOWED_PROTOCOLS.has(parsedUrl.protocol)) {
    return false;
  }

  await Linking.openURL(parsedUrl.toString());
  return true;
}
