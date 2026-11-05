import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/lib/auth';

export default function NotesHomeScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Phase 1</Text>
      <Text style={styles.title}>Marko Polo mobile</Text>
      <Text style={styles.subtitle}>Welcome back, {user?.name ?? 'friend'}.</Text>
      <Text style={styles.body}>This is the mobile app shell for the next note-taking workflow. The auth guard and secure token flow are live, and the note list will be implemented in the next phase.</Text>

      <Pressable style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#eff6ff',
  },
  eyebrow: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: '#2563eb',
    fontWeight: '700',
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#1f2937',
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4b5563',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
