import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { UserProfile } from "./api";

const SESSION_KEY = "ube.session";

export interface StoredSession {
  token: string;
  user: UserProfile;
}

export async function saveSession(
  token: string,
  user: UserProfile,
): Promise<void> {
  const value = JSON.stringify({ token, user } satisfies StoredSession);
  if (Platform.OS === "web") {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(SESSION_KEY, value);
    return;
  }

  await SecureStore.setItemAsync(SESSION_KEY, value);
}

export async function loadSession(): Promise<StoredSession | null> {
  const value =
    Platform.OS === "web"
      ? typeof localStorage === "undefined"
        ? null
        : localStorage.getItem(SESSION_KEY)
      : await SecureStore.getItemAsync(SESSION_KEY);

  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as StoredSession;
    if (!parsed.token || !parsed.user?.id || !parsed.user.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof localStorage === "undefined") return;
    localStorage.removeItem(SESSION_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(SESSION_KEY);
}
