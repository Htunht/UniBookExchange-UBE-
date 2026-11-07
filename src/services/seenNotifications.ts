import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const seenKey = (userId: string) => `ube.seenNotifications.${userId}`;
const legacySeenKey = (userId: string) => `ube.seenAccepted.${userId}`;

async function getStorageItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(key);
  }
  return await SecureStore.getItemAsync(key);
}

async function setStorageItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function loadSeenNotificationIds(userId: string): Promise<string[]> {
  // Load unified seen notifications
  const value = await getStorageItem(seenKey(userId));
  let ids: string[] = [];

  if (value) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        ids = parsed.filter((id): id is string => typeof id === "string");
      }
    } catch {
      ids = [];
    }
  }

  // Also check legacy key and merge if available
  const legacyValue = await getStorageItem(legacySeenKey(userId));
  if (legacyValue) {
    try {
      const legacyParsed = JSON.parse(legacyValue) as unknown;
      if (Array.isArray(legacyParsed)) {
        const legacyIds = legacyParsed.filter((id): id is string => typeof id === "string");
        ids = Array.from(new Set([...ids, ...legacyIds]));
      }
    } catch {
      // Ignore legacy parse error
    }
  }

  return ids;
}

export async function saveSeenNotificationIds(
  userId: string,
  ids: string[],
): Promise<void> {
  const value = JSON.stringify(ids.slice(-500));
  await setStorageItem(seenKey(userId), value);
}

// Backward-compatible helpers
export const loadSeenAcceptedIds = loadSeenNotificationIds;
export const saveSeenAcceptedIds = saveSeenNotificationIds;
