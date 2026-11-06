import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

let handlerReady = false;

export async function registerDeviceForPush(): Promise<string | null> {
  if (Platform.OS === "web" || !Device.isDevice) return null;

  const Notifications = await import("expo-notifications");
  if (!handlerReady) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    handlerReady = true;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("appointments", {
      name: "ချိန်းဆိုမှုများ",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== "granted") return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return null;

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}
