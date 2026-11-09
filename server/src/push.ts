import { prisma } from "./prisma.js";

const expoPushUrl = "https://exp.host/--/api/v2/push/send";

type PushMessage = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

type ExpoPushTicket = {
  status: "ok" | "error";
  message?: string;
  details?: { error?: string };
};

export async function notifyUser(userId: string, message: PushMessage): Promise<void> {
  const registrations = await prisma.pushToken.findMany({
    where: { userId },
    select: { token: true },
  });
  if (registrations.length === 0) {
    console.info("Push skipped: recipient has no registered devices.");
    return;
  }

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
      console.error("Expo push request failed:", response.status, await response.text());
      return;
    }

    const result = (await response.json()) as {
      data?: ExpoPushTicket[] | ExpoPushTicket;
      errors?: unknown;
    };
    const tickets = Array.isArray(result.data)
      ? result.data
      : result.data
        ? [result.data]
        : [];
    const failed = tickets
      .map((ticket, index) => ({ ticket, index }))
      .filter(({ ticket }) => ticket.status === "error");
    if (failed.length > 0 || result.errors) {
      console.error("Expo rejected push notification:", {
        errors: result.errors,
        tickets: failed.map(({ ticket, index }) => ({
          device: index + 1,
          message: ticket.message,
          error: ticket.details?.error,
        })),
      });
    }
    const expired = registrations.filter((_, index) => {
      const ticket = tickets[index];
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
