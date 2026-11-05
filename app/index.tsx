import { Redirect } from 'expo-router';

import { useAuth } from '@/lib/auth';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return user ? <Redirect href="/(app)" /> : <Redirect href="/login" />;
}
