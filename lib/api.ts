import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
export const TOKEN_KEY = 'auth_token';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const headers = new Headers(init.headers ?? {});

  headers.set('Content-Type', 'application/json');
  headers.set('X-Client', 'mobile');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok || data.success === false) {
    throw new ApiError((typeof data.error === 'string' ? data.error : 'Request failed') || 'Request failed', response.status);
  }

  return data as T;
}
