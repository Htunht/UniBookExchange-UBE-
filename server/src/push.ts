import { prisma } from "./prisma.js";

const expoPushUrl = "https://exp.host/--/api/v2/push/send";

type PushMessage = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

type ExpoPushTicket = {
  status: "ok" | "error";
  details?: { error?: string };
};

export async function notifyUser(userId: string, message: PushMessage): Promise<void> {
  const registrations = await prisma.pushToken.findMany({
    where: { userId },
    select: { token: true },
  });
  if (registrations.length === 0) return;

  try {
    const response = await fetch(expoPushUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        registrations.map((registration) => ({
          to: registration.token,
          title: message.title,
          body: message.body,
          sound: "default",
          channelId: "appointments",
          data: message.data ?? {},
        })),
      ),
    });

    if (!response.ok) {
      console.error("Expo push request failed:", response.status);
      return;
    }

    const result = (await response.json()) as { data?: ExpoPushTicket[] };
    const expired = registrations.filter((_, index) => {
      const ticket = result.data?.[index];
      return ticket?.status === "error" && ticket.details?.error === "DeviceNotRegistered";
    });
    if (expired.length > 0) {
      await prisma.pushToken.deleteMany({
        where: { token: { in: expired.map((registration) => registration.token) } },
      });
    }
  } catch (error) {
    console.error("Push notification failed:", error);
  }
}
