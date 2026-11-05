import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuth } from '@/lib/auth';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState('Ada Lovelace');
  const [email, setEmail] = useState('ada@example.com');
  const [password, setPassword] = useState('Password123!');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Fill in all fields to create your account.');
      return;
    }

    try {
      setSubmitting(true);
      await signUp(name.trim(), email.trim(), password);
      router.replace('/(app)');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create your account.';
      Alert.alert('Registration failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Start organizing notes on the go</Text>

        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Full name" />
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
        />

        <Pressable style={[styles.button, submitting && styles.buttonDisabled]} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.buttonText}>{submitting ? 'Creating account...' : 'Create account'}</Text>
        </Pressable>

        <Link href="/login" asChild>
          <Pressable>
            <Text style={styles.linkText}>Already have an account? Sign in</Text>
          </Pressable>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f4f7fb',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 15,
    color: '#4b5563',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  button: {
    marginTop: 8,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  linkText: {
    textAlign: 'center',
    color: '#2563eb',
    marginTop: 8,
    fontWeight: '600',
  },
});
