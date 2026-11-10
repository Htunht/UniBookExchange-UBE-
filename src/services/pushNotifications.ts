import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

let handlerReady = false;

function isExpoGoAndroid() {
  return (
    Platform.OS === "android" &&
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  );
}

async function prepareLocalNotifications() {
  const Notifications = await import("expo-notifications");
  if (!handlerReady) {
    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      handlerReady = true;
    } catch {
      // Ignore handler error
    }
  }

  if (Platform.OS === "android" && !isExpoGoAndroid()) {
    try {
      await Notifications.setNotificationChannelAsync("appointments", {
        name: "ချိန်းဆိုမှုများ",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#0284C7",
      });
    } catch (channelError) {
      // On some Android environments/devices, ChannelManager can throw NullPointerException.
      // Gracefully continue so permissions and push registration succeed.
      console.warn("Notification channel setup skipped:", channelError);
    }
  }

  try {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.status === "granted") return Notifications;
    const requested = await Notifications.requestPermissionsAsync();
    if (requested.status !== "granted") return null;
    return Notifications;
  } catch (permError) {
    console.warn("Failed to get notification permissions:", permError);
    return null;
  }
}

export async function notifyAppointmentAccepted(bookTitle: string) {
  if (Platform.OS === "web") return;
  const Notifications = await prepareLocalNotifications();
  if (!Notifications) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "တောင်းဆိုမှု လက်ခံပြီးပါပြီ",
      body: `"${bookTitle}" အတွက် တောင်းဆိုမှုကို ရောင်းသူက လက်ခံပါပြီ။`,
    },
    trigger: null,
  });
}

export async function notifyAppointmentRejected(bookTitle: string) {
  if (Platform.OS === "web") return;
  const Notifications = await prepareLocalNotifications();
  if (!Notifications) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "ကမ်းလှမ်းချက် ငြင်းပယ်ခံရပါသည် 😔",
      body: `စိတ်မကောင်းပါဘူး၊ ရောင်းသူက သင့်ရဲ့ "${bookTitle}" ကမ်းလှမ်းချက်ကို ငြင်းပယ်လိုက်ပါတယ်။`,
    },
    trigger: null,
  });
}

export async function registerDeviceForPush(): Promise<string | null> {
  if (Platform.OS === "web" || !Device.isDevice || isExpoGoAndroid()) return null;

  try {
    const Notifications = await prepareLocalNotifications();
    if (!Notifications) return null;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return null;

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch (error) {
    console.warn("Push registration could not be completed on this device:", error);
    return null;
  }
}
