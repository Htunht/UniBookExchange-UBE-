import { createHmac, randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import rateLimitModule from "express-rate-limit";
import helmetModule from "helmet";

function unwrapDefault<T>(
  imported: T,
): T extends (...args: never[]) => unknown
  ? T
  : T extends { default: infer Exported }
    ? Exported
    : T {
  if (typeof imported === "function") return imported as never;
  return (imported as { default: never }).default;
}

const helmet = unwrapDefault(helmetModule);
const rateLimit = unwrapDefault(rateLimitModule);
import { Resend } from "resend";
import { z } from "zod";
import { prisma } from "./prisma.js";
import { canRequestBook } from "./book-status.js";
import { shouldLogDevelopmentOtp } from "./dev-otp.js";
import { ALL_MAJORS_VALUE, validateCommonCourseListing } from "./course-rules.js";
import { notifyUser } from "./push.js";

const requiredEnvironment = [
  "DATABASE_URL",
  "RESEND_API_KEY",
  "RESEND_TEST_RECIPIENT",
  "OTP_SECRET",
] as const;

for (const key of requiredEnvironment) {
  if (!process.env[key]) {
    throw new Error(`${key} environment variable မသတ်မှတ်ရသေးပါ။`);
  }
}

const otpSecret = process.env.OTP_SECRET!;
if (Buffer.byteLength(otpSecret) < 32) {
  throw new Error("OTP_SECRET သည် အနည်းဆုံး 32 bytes ရှိရပါမည်။");
}

const allowedTestRecipient = process.env.RESEND_TEST_RECIPIENT!.trim().toLowerCase();
const logNonTestOtp = shouldLogDevelopmentOtp(
  process.env.NODE_ENV,
  process.env.DEV_OTP_LOGGING,
);
if (logNonTestOtp) {
  console.warn("DEV_OTP_LOGGING is enabled: non-test OTPs will be written to this terminal.");
}
const resend = new Resend(process.env.RESEND_API_KEY);
const app = express();
const port = Number(process.env.PORT ?? 4000);
const otpLifetimeMs = 10 * 60 * 1000;
const sessionLifetimeMs = 30 * 24 * 60 * 60 * 1000;
const maxOtpAttempts = 5;

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "16kb" }));
app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_request, response) => {
    response.status(429).json({ error: "တောင်းဆိုမှုများလွန်းပါသည်။ ခဏစောင့်ပြီး ပြန်စမ်းပါ။" });
  },
});
app.use("/auth", authRateLimit);

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;
  const derivedKey = scryptSync(password, salt, 64);
  const keyBuffer = Buffer.from(key, "hex");
  return timingSafeEqual(derivedKey, keyBuffer);
}

const registerSchema = z.object({
  name: z.string().trim().min(1, "အမည် ထည့်ပေးပါ။").max(100, "အမည်သည် စာလုံး ၁၀၀ ထက် မကျော်ရပါ။"),
  email: z.string().trim().email("မှန်ကန်သော အီးမေးလ် ထည့်ပါ။").max(254, "အီးမေးလ်သည် စာလုံး ၂၅၄ ထက် မကျော်ရပါ။"),
  password: z.string().min(6, "စကားဝှက် အနည်းဆုံး ၆ လုံး ရှိရပါမည်။").max(100, "စကားဝှက်သည် စာလုံး ၁၀၀ ထက် မကျော်ရပါ။"),
  year: z.string().trim().min(1, "သင်တန်းနှစ် ရွေးပေးပါ။"),
  major: z.string().trim().min(1, "မေဂျာ ရွေးပေးပါ။"),
  phone: z.string().trim().min(1, "ဖုန်းနံပါတ် ထည့်ပေးပါ။"),
  telegram: z.string().trim().min(1, "Telegram username ထည့်ပေးပါ။"),
});

app.post("/auth/register", async (request, response) => {
  const parsed = registerSchema.safeParse(request.body);
  if (!parsed.success) {
    throw new HttpError(
      400,
      parsed.error.issues[0]?.message ?? "အချက်အလက်များကို မှန်ကန်စွာ ဖြည့်ပါ။",
    );
  }

  const email = parsed.data.email.toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser && existingUser.isVerified) {
    throw new HttpError(400, "ဤအီးမေးလ်ဖြင့် အကောင့်ဖွင့်ပြီးသား ဖြစ်ပါသည်။ အကောင့်ဝင်ပါ။");
  }

  const passwordHash = hashPassword(parsed.data.password);

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      name: parsed.data.name,
      year: parsed.data.year,
      major: parsed.data.major,
      phone: parsed.data.phone,
      telegram: parsed.data.telegram,
      isVerified: true,
    },
    update: {
      passwordHash,
      name: parsed.data.name,
      year: parsed.data.year,
      major: parsed.data.major,
      phone: parsed.data.phone,
      telegram: parsed.data.telegram,
      isVerified: true,
    },
  });

  const sessionToken = randomBytes(32).toString("base64url");
  const sessionHash = createHmac("sha256", otpSecret)
    .update(sessionToken)
    .digest("hex");
  const expiresAt = new Date(Date.now() + sessionLifetimeMs);

  await prisma.session.create({
    data: { tokenHash: sessionHash, userId: user.id, expiresAt },
  });

  response.json({
    sessionToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      year: user.year,
      major: user.major,
      phone: user.phone,
      telegram: user.telegram,
      createdAt: user.createdAt,
    },
  });
});

const verifyRegistrationSchema = z.object({
  email: z.string().trim().email(),
  otp: z.string().regex(/^\d{6}$/, "၆ လုံးပါ အတည်ပြုကုဒ် ထည့်ပါ။"),
});

app.post("/auth/verify-registration-otp", async (request, response) => {
  const parsed = verifyRegistrationSchema.safeParse(request.body);
  if (!parsed.success) {
    throw new HttpError(400, "အီးမေးလ်လိပ်စာနှင့် ၆ လုံးပါ အတည်ပြုကုဒ်ကို မှန်ကန်စွာ ထည့်ပါ။");
  }

  const email = parsed.data.email.toLowerCase();
  const challenge = await prisma.emailOtp.findUnique({ where: { email } });
  if (!challenge || challenge.expiresAt <= new Date()) {
    if (challenge) {
      await prisma.emailOtp.deleteMany({ where: { email, tokenHash: challenge.tokenHash } });
    }
    throw new HttpError(400, "အတည်ပြုကုဒ် သက်တမ်းကုန်သွားပါပြီ။ အသစ်ပြန်တောင်းပါ။");
  }

  if (challenge.attempts >= maxOtpAttempts) {
    await prisma.emailOtp.deleteMany({ where: { email } });
    throw new HttpError(429, "အတည်ပြုကုဒ်ကို အကြိမ်များစွာ မှားယွင်းထည့်ထားပါသည်။ အသစ်ပြန်တောင်းပါ။");
  }

  const suppliedHash = createHmac("sha256", otpSecret)
    .update(`${email}:${parsed.data.otp}`)
    .digest();
  const storedHash = Buffer.from(challenge.tokenHash, "hex");
  if (storedHash.length !== suppliedHash.length || !timingSafeEqual(storedHash, suppliedHash)) {
    await prisma.emailOtp.updateMany({
      where: { email, tokenHash: challenge.tokenHash },
      data: { attempts: { increment: 1 } },
    });
    throw new HttpError(400, "အတည်ပြုကုဒ် မမှန်ပါ။");
  }

  await prisma.emailOtp.deleteMany({ where: { email } });

  const user = await prisma.user.update({
    where: { email },
    data: { isVerified: true },
  });

  const sessionToken = randomBytes(32).toString("base64url");
  const sessionHash = createHmac("sha256", otpSecret)
    .update(sessionToken)
    .digest("hex");
  const expiresAt = new Date(Date.now() + sessionLifetimeMs);

  await prisma.session.create({
    data: { tokenHash: sessionHash, userId: user.id, expiresAt },
  });

  response.json({
    sessionToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      year: user.year,
      major: user.major,
      phone: user.phone,
      telegram: user.telegram,
    },
  });
});

const loginSchema = z.object({
  email: z.string().trim().email("မှန်ကန်သော အီးမေးလ် ထည့်ပါ။"),
  password: z.string().min(1, "စကားဝှက် ထည့်ပေးပါ။"),
});

app.post("/auth/login", async (request, response) => {
  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "အချက်အလက် မှန်ကန်စွာ ဖြည့်ပါ။");
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    throw new HttpError(400, "အီးမေးလ် သို့မဟုတ် စကားဝှက် မှားယွင်းနေပါသည်။");
  }

  const isMatch = verifyPassword(parsed.data.password, user.passwordHash);
  if (!isMatch) {
    throw new HttpError(400, "အီးမေးလ် သို့မဟုတ် စကားဝှက် မှားယွင်းနေပါသည်။");
  }

  if (!user.isVerified) {
    throw new HttpError(403, "အီးမေးလ်မှ အတည်ပြုကုဒ်ကို အတည်ပြုရန် လိုအပ်ပါသည်။");
  }

  const sessionToken = randomBytes(32).toString("base64url");
  const sessionHash = createHmac("sha256", otpSecret)
    .update(sessionToken)
    .digest("hex");
  const expiresAt = new Date(Date.now() + sessionLifetimeMs);

  await prisma.session.create({
    data: { tokenHash: sessionHash, userId: user.id, expiresAt },
  });

  response.json({
    sessionToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      year: user.year,
      major: user.major,
      phone: user.phone,
      telegram: user.telegram,
    },
  });
});

const passwordResetRequestSchema = z.object({
  email: z.string().trim().email("မှန်ကန်သော အီးမေးလ် ထည့်ပါ။").max(254),
});

app.post("/auth/forgot-password/request", async (request, response) => {
  const parsed = passwordResetRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "အီးမေးလ် မှန်ကန်စွာ ထည့်ပါ။");
  }

  const email = parsed.data.email.toLowerCase();
  const isTestRecipient = email === allowedTestRecipient;
  if (!isTestRecipient && !logNonTestOtp) {
    throw new HttpError(503, "လက်ရှိတွင် စမ်းသပ်အီးမေးလ်လိပ်စာတစ်ခုတည်းကိုသာ အသုံးပြုနိုင်ပါသည်။");
  }

  const message = "အကောင့်ရှိပါက အတည်ပြုကုဒ်ကို အီးမေးလ်သို့ ပို့လိုက်ပါပြီ။";
  const user = await prisma.user.findUnique({
    where: { email },
    select: { isVerified: true, passwordHash: true },
  });

  if (user?.isVerified && user.passwordHash) {
    const now = new Date();
    const previous = await prisma.passwordResetOtp.findUnique({ where: { email } });

    if (!previous || now.getTime() - previous.lastSentAt.getTime() >= 60_000) {
      const otp = randomInt(100_000, 1_000_000).toString();
      const tokenHash = createHmac("sha256", otpSecret)
        .update(`${email}:password-reset:${otp}`)
        .digest("hex");

      await prisma.passwordResetOtp.upsert({
        where: { email },
        create: {
          email,
          tokenHash,
          expiresAt: new Date(now.getTime() + otpLifetimeMs),
          attempts: 0,
          lastSentAt: now,
        },
        update: {
          tokenHash,
          expiresAt: new Date(now.getTime() + otpLifetimeMs),
          attempts: 0,
          lastSentAt: now,
          resetTokenHash: null,
          resetTokenExpiresAt: null,
        },
      });

      if (isTestRecipient) {
        try {
          const { error } = await resend.emails.send({
            from: "UniBookExchange <onboarding@resend.dev>",
            to: [email],
            subject: "UniBookExchange စကားဝှက်ပြန်လည်သတ်မှတ်ရန် အတည်ပြုကုဒ်",
            text: `သင့်အတည်ပြုကုဒ်မှာ ${otp} ဖြစ်ပါသည်။ ၁၀ မိနစ်အတွင်း အသုံးပြုပါ။`,
            html: `<p>သင့်အတည်ပြုကုဒ်မှာ</p><p style="font-size:28px;font-weight:bold;letter-spacing:8px">${otp}</p><p>၁၀ မိနစ်အတွင်း အသုံးပြုပါ။</p>`,
          });
          if (error) {
            await prisma.passwordResetOtp.deleteMany({ where: { email, tokenHash } });
            console.error("Resend password reset email failed:", error.message);
            throw new HttpError(502, "OTP အီးမေးလ် ပို့မရပါ။ ဆာဗာမှတ်တမ်းကို စစ်ဆေးပါ။");
          }
        } catch (error) {
          if (error instanceof HttpError) throw error;
          await prisma.passwordResetOtp.deleteMany({ where: { email, tokenHash } });
          console.error("Resend password reset request failed:", error);
          throw new HttpError(502, "OTP အီးမေးလ် ပို့မရပါ။ ဆာဗာမှတ်တမ်းကို စစ်ဆေးပါ။");
        }
      } else {
        console.warn(`[DEV OTP - password reset] ${email}: ${otp}`);
      }
    }
  }

  response.json({ message });
});

const passwordResetVerifySchema = z.object({
  email: z.string().trim().email().max(254),
  otp: z.string().regex(/^\d{6}$/, "၆ လုံးပါ အတည်ပြုကုဒ် ထည့်ပါ။"),
});

app.post("/auth/forgot-password/verify", async (request, response) => {
  const parsed = passwordResetVerifySchema.safeParse(request.body);
  if (!parsed.success) {
    throw new HttpError(400, "အီးမေးလ်လိပ်စာနှင့် ၆ လုံးပါ အတည်ပြုကုဒ်ကို မှန်ကန်စွာ ထည့်ပါ။");
  }

  const email = parsed.data.email.toLowerCase();
  const now = new Date();
  const challenge = await prisma.passwordResetOtp.findUnique({ where: { email } });

  if (!challenge || challenge.expiresAt <= now || challenge.resetTokenHash) {
    if (challenge && challenge.expiresAt <= now) {
      await prisma.passwordResetOtp.deleteMany({
        where: { email, tokenHash: challenge.tokenHash },
      });
    }
    throw new HttpError(400, "အတည်ပြုကုဒ် မမှန်ပါ သို့မဟုတ် သက်တမ်းကုန်သွားပါပြီ။ အသစ်ပြန်တောင်းပါ။");
  }

  const suppliedHash = createHmac("sha256", otpSecret)
    .update(`${email}:password-reset:${parsed.data.otp}`)
    .digest();
  const storedHash = Buffer.from(challenge.tokenHash, "hex");
  const isMatch =
    storedHash.length === suppliedHash.length &&
    timingSafeEqual(storedHash, suppliedHash);

  if (!isMatch) {
    const attemptUpdate = await prisma.passwordResetOtp.updateMany({
      where: {
        email,
        tokenHash: challenge.tokenHash,
        expiresAt: { gt: now },
        attempts: { lt: maxOtpAttempts },
        resetTokenHash: null,
      },
      data: { attempts: { increment: 1 } },
    });
    if (attemptUpdate.count === 0) {
      throw new HttpError(429, "အတည်ပြုကုဒ်ကို အကြိမ်များစွာ မှားယွင်းထည့်ထားပါသည်။ အသစ်ပြန်တောင်းပါ။");
    }
    throw new HttpError(400, "အတည်ပြုကုဒ် မမှန်ပါ။");
  }

  const resetToken = randomBytes(32).toString("base64url");
  const resetTokenHash = createHmac("sha256", otpSecret)
    .update(`${email}:password-reset-grant:${resetToken}`)
    .digest("hex");
  const consumed = await prisma.passwordResetOtp.updateMany({
    where: {
      email,
      tokenHash: challenge.tokenHash,
      expiresAt: { gt: now },
      attempts: { lt: maxOtpAttempts },
      resetTokenHash: null,
    },
    data: {
      tokenHash: randomBytes(32).toString("hex"),
      resetTokenHash,
      resetTokenExpiresAt: new Date(now.getTime() + otpLifetimeMs),
    },
  });
  if (consumed.count !== 1) {
    throw new HttpError(400, "အတည်ပြုကုဒ် မမှန်ပါ သို့မဟုတ် သက်တမ်းကုန်သွားပါပြီ။ အသစ်ပြန်တောင်းပါ။");
  }

  response.json({ resetToken });
});

const passwordResetSchema = z.object({
  email: z.string().trim().email().max(254),
  resetToken: z.string().min(20).max(100),
  password: z.string().min(6, "စကားဝှက် အနည်းဆုံး ၆ လုံး ရှိရပါမည်။").max(100),
});

app.post("/auth/forgot-password/reset", async (request, response) => {
  const parsed = passwordResetSchema.safeParse(request.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "အချက်အလက်များကို မှန်ကန်စွာ ဖြည့်ပါ။");
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, isVerified: true },
  });
  if (!user?.isVerified) {
    throw new HttpError(400, "အတည်ပြုမှု သက်တမ်းကုန်သွားပါပြီ။ အတည်ပြုကုဒ်အသစ် တောင်းပါ။");
  }

  const resetTokenHash = createHmac("sha256", otpSecret)
    .update(`${email}:password-reset-grant:${parsed.data.resetToken}`)
    .digest("hex");
  const passwordHash = hashPassword(parsed.data.password);
  const now = new Date();

  await prisma.$transaction(async (transaction) => {
    const consumed = await transaction.passwordResetOtp.deleteMany({
      where: {
        email,
        resetTokenHash,
        resetTokenExpiresAt: { gt: now },
      },
    });
    if (consumed.count !== 1) {
      throw new HttpError(400, "အတည်ပြုမှု သက်တမ်းကုန်သွားပါပြီ။ အတည်ပြုကုဒ်အသစ် တောင်းပါ။");
    }

    await transaction.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });
    await transaction.session.deleteMany({ where: { userId: user.id } });
  });

  response.json({ message: "စကားဝှက် ပြောင်းပြီးပါပြီ။ အကောင့်ဝင်ပါ။" });
});

// ─── RESEND REGISTRATION OTP ───────────────────────────────────────────────
const resendOtpSchema = z.object({
  email: z.string().trim().email("မှန်ကန်သော အီးမေးလ် ထည့်ပါ။").max(254),
});

app.post("/auth/resend-otp", async (request, response) => {
  const parsed = resendOtpSchema.safeParse(request.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "အီးမေးလ် မှန်ကန်စွာ ထည့်ပါ။");
  }

  const email = parsed.data.email.toLowerCase();
  const isTestRecipient = email === allowedTestRecipient;
  if (!isTestRecipient && !logNonTestOtp) {
    throw new HttpError(503, "လက်ရှိတွင် စမ်းသပ်အီးမေးလ်လိပ်စာတစ်ခုတည်းကိုသာ အသုံးပြုနိုင်ပါသည်။");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new HttpError(400, "ဤအီးမေးလ်ဖြင့် အကောင့်မရှိပါ။ ဦးစွာ အကောင့်ဖွင့်ပါ။");
  }
  if (user.isVerified) {
    throw new HttpError(400, "အကောင့်အတည်ပြုပြီးသား ဖြစ်ပါသည်။ အကောင့်ဝင်ပါ။");
  }

  const now = new Date();
  const otp = randomInt(100_000, 1_000_000).toString();
  const tokenHash = createHmac("sha256", otpSecret)
    .update(`${email}:${otp}`)
    .digest("hex");

  await prisma.emailOtp.upsert({
    where: { email },
    create: {
      email,
      tokenHash,
      expiresAt: new Date(now.getTime() + otpLifetimeMs),
      attempts: 0,
      lastSentAt: now,
    },
    update: {
      tokenHash,
      expiresAt: new Date(now.getTime() + otpLifetimeMs),
      attempts: 0,
      lastSentAt: now,
    },
  });

  if (isTestRecipient) {
    try {
      const { error } = await resend.emails.send({
        from: "UniBookExchange <onboarding@resend.dev>",
        to: [email],
        subject: "UniBookExchange အတည်ပြုကုဒ်",
        text: `သင့်အတည်ပြုကုဒ်မှာ ${otp} ဖြစ်ပါသည်။ ၁၀ မိနစ်အတွင်း အသုံးပြုပါ။`,
        html: `<p>သင့်အတည်ပြုကုဒ်မှာ</p><p style="font-size:28px;font-weight:bold;letter-spacing:8px">${otp}</p><p>၁၀ မိနစ်အတွင်း အသုံးပြုပါ။</p>`,
      });
      if (error) {
        await prisma.emailOtp.deleteMany({ where: { email, tokenHash } });
        console.error("Resend email failed:", error.message);
        throw new HttpError(502, "OTP အီးမေးလ် ပို့မရပါ။ ဆာဗာမှတ်တမ်းကို စစ်ဆေးပါ။");
      }
    } catch (error) {
      if (error instanceof HttpError) throw error;
      await prisma.emailOtp.deleteMany({ where: { email, tokenHash } });
      console.error("Resend email request failed:", error);
      throw new HttpError(502, "OTP အီးမေးလ် ပို့မရပါ။ ဆာဗာမှတ်တမ်းကို စစ်ဆေးပါ။");
    }
  } else {
    console.warn(`[DEV OTP - resend registration] ${email}: ${otp}`);
  }

  response.json({ message: "အတည်ပြုကုဒ် အသစ် ပို့ပြီးပါပြီ။" });
});

// ─── OLD SEND-OTP (keep for backward compat) ──────────────────────────────
const sendOtpSchema = z.object({
  email: z.string().trim().email().max(254),
});

app.post("/auth/send-otp", async (request, response) => {
  const parsed = sendOtpSchema.safeParse(request.body);
  if (!parsed.success) {
    throw new HttpError(400, "မှန်ကန်သော အီးမေးလ်လိပ်စာ ထည့်ပါ။");
  }

  const email = parsed.data.email.toLowerCase();
  const isTestRecipient = email === allowedTestRecipient;
  if (!isTestRecipient && !logNonTestOtp) {
    throw new HttpError(503, "လက်ရှိတွင် စမ်းသပ်အီးမေးလ်လိပ်စာတစ်ခုတည်းကိုသာ အသုံးပြုနိုင်ပါသည်။");
  }

  const now = new Date();
  const previous = await prisma.emailOtp.findUnique({ where: { email } });
  if (
    previous &&
    now.getTime() - previous.lastSentAt.getTime() < 60_000
  ) {
    throw new HttpError(429, "အတည်ပြုကုဒ် အသစ်မတောင်းမီ စက္ကန့် ၆၀ စောင့်ပါ။");
  }

  const otp = randomInt(100_000, 1_000_000).toString();
  const tokenHash = createHmac("sha256", otpSecret)
    .update(`${email}:${otp}`)
    .digest("hex");

  await prisma.emailOtp.upsert({
    where: { email },
    create: {
      email,
      tokenHash,
      expiresAt: new Date(now.getTime() + otpLifetimeMs),
      attempts: 0,
      lastSentAt: now,
    },
    update: {
      tokenHash,
      expiresAt: new Date(now.getTime() + otpLifetimeMs),
      attempts: 0,
      lastSentAt: now,
    },
  });

  if (isTestRecipient) {
    try {
      const { error } = await resend.emails.send({
        from: "UniBookExchange <onboarding@resend.dev>",
        to: [email],
        subject: "UniBookExchange အကောင့်ဝင်ရန် အတည်ပြုကုဒ်",
        text: `သင့်အကောင့်ဝင်ရန် အတည်ပြုကုဒ်မှာ ${otp} ဖြစ်ပါသည်။ ၁၀ မိနစ်အတွင်း အသုံးပြုပါ။`,
        html: `<p>သင့်အကောင့်ဝင်ရန် အတည်ပြုကုဒ်မှာ</p><p style="font-size:28px;font-weight:bold;letter-spacing:8px">${otp}</p><p>၁၀ မိနစ်အတွင်း အသုံးပြုပါ။</p>`,
      });

      if (error) {
        await prisma.emailOtp.deleteMany({ where: { email, tokenHash } });
        console.error("Resend email delivery failed:", error.message);
        throw new HttpError(502, "အီးမေးလ် ပို့မရပါ။ ဆာဗာမှတ်တမ်းကို စစ်ဆေးပါ။");
      }
    } catch (error) {
      if (error instanceof HttpError) throw error;
      await prisma.emailOtp.deleteMany({ where: { email, tokenHash } });
      console.error("Resend email request failed:", error);
      throw new HttpError(502, "အီးမေးလ် ပို့မရပါ။ ဆာဗာမှတ်တမ်းကို စစ်ဆေးပါ။");
    }
  } else {
    console.warn(`[DEV OTP - sign-in] ${email}: ${otp}`);
  }

  response.json({ message: "အတည်ပြုကုဒ် ပို့ပြီးပါပြီ။" });
});

const verifyOtpSchema = z.object({
  email: z.string().trim().email().max(254),
  token: z.string().regex(/^\d{6}$/),
});

app.post("/auth/verify-otp", async (request, response) => {
  const parsed = verifyOtpSchema.safeParse(request.body);
  if (!parsed.success) {
    throw new HttpError(400, "အီးမေးလ်လိပ်စာနှင့် ၆ လုံးပါ အတည်ပြုကုဒ်ကို မှန်ကန်စွာ ထည့်ပါ။");
  }

  const email = parsed.data.email.toLowerCase();

  const challenge = await prisma.emailOtp.findUnique({ where: { email } });
  if (!challenge || challenge.expiresAt <= new Date()) {
    if (challenge) {
      await prisma.emailOtp.deleteMany({
        where: { email, tokenHash: challenge.tokenHash },
      });
    }
    throw new HttpError(400, "အတည်ပြုကုဒ် သက်တမ်းကုန်သွားပါပြီ။ အသစ်ပြန်တောင်းပါ။");
  }
  if (challenge.attempts >= maxOtpAttempts) {
    await prisma.emailOtp.deleteMany({ where: { email } });
    throw new HttpError(429, "အတည်ပြုကုဒ်ကို အကြိမ်များစွာ မှားယွင်းထည့်ထားပါသည်။ အသစ်ပြန်တောင်းပါ။");
  }

  const suppliedHash = createHmac("sha256", otpSecret)
    .update(`${email}:${parsed.data.token}`)
    .digest();
  const storedHash = Buffer.from(challenge.tokenHash, "hex");
  if (
    storedHash.length !== suppliedHash.length ||
    !timingSafeEqual(storedHash, suppliedHash)
  ) {
    const attemptUpdate = await prisma.emailOtp.updateMany({
      where: {
        email,
        tokenHash: challenge.tokenHash,
        expiresAt: { gt: new Date() },
        attempts: { lt: maxOtpAttempts },
      },
      data: { attempts: { increment: 1 } },
    });
    if (attemptUpdate.count === 0) {
      throw new HttpError(429, "အတည်ပြုကုဒ်ကို အကြိမ်များစွာ မှားယွင်းထည့်ထားပါသည်။ အသစ်ပြန်တောင်းပါ။");
    }
    throw new HttpError(400, "အတည်ပြုကုဒ် မမှန်ပါ။");
  }

  const sessionToken = randomBytes(32).toString("base64url");
  const sessionHash = createHmac("sha256", otpSecret)
    .update(sessionToken)
    .digest("hex");
  const expiresAt = new Date(Date.now() + sessionLifetimeMs);

  const result = await prisma.$transaction(async (transaction) => {
    const consumed = await transaction.emailOtp.deleteMany({
      where: {
        email,
        tokenHash: challenge.tokenHash,
        expiresAt: { gt: new Date() },
        attempts: { lt: maxOtpAttempts },
      },
    });
    if (consumed.count !== 1) {
      throw new HttpError(400, "အတည်ပြုကုဒ် သက်တမ်းကုန်သွားပါပြီ သို့မဟုတ် အသုံးပြုပြီးပါပြီ။");
    }

    const user = await transaction.user.upsert({
      where: { email },
      create: { email },
      update: {},
    });
    await transaction.session.create({
      data: { tokenHash: sessionHash, userId: user.id, expiresAt },
    });
    return user;
  });

  response.json({
    sessionToken,
    user: {
      id: result.id,
      email: result.email,
      name: result.name,
      year: result.year,
      phone: result.phone,
      telegram: result.telegram,
    },
  });
});

const profileSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  year: z.string().trim().min(1).max(40),
  phone: z.string().trim().min(1).max(30),
  telegram: z.string().trim().min(1).max(32),
});

type AuthenticatedRequest = Request & { userId?: string };

async function requireSession(
  request: AuthenticatedRequest,
  _response: Response,
  next: NextFunction,
) {
  const authorization = request.header("authorization");
  const match = authorization?.match(/^Bearer ([A-Za-z0-9_-]+)$/);
  if (!match) {
    throw new HttpError(401, "ဝင်ရောက်မှု သက်တမ်းမရှိတော့ပါ။ အတည်ပြုကုဒ်ဖြင့် ပြန်ဝင်ပါ။");
  }

  const tokenHash = createHmac("sha256", otpSecret)
    .update(match[1])
    .digest("hex");
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    select: { userId: true, expiresAt: true },
  });
  if (!session || session.expiresAt <= new Date()) {
    throw new HttpError(401, "ဝင်ရောက်မှု သက်တမ်းကုန်သွားပါပြီ။");
  }

  request.userId = session.userId;
  next();
}

app.post(
  "/profile",
  requireSession,
  async (request: AuthenticatedRequest, response) => {
    const parsed = profileSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new HttpError(400, "ကိုယ်ရေးအချက်အလက်များကို မှန်ကန်စွာ ဖြည့်ပါ။");
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true },
    });
    if (existingUser && existingUser.id !== request.userId) {
      throw new HttpError(409, "ဤအီးမေးလ်လိပ်စာကို အခြားအကောင့်က အသုံးပြုထားပါသည်။");
    }

    const user = await prisma.user.update({
      where: { id: request.userId },
      data: parsed.data,
      select: {
        id: true,
        email: true,
        name: true,
        year: true,
        major: true,
        phone: true,
        telegram: true,
        createdAt: true,
      },
    });
    response.json({ message: "ကိုယ်ရေးအချက်အလက်များကို သိမ်းဆည်းပြီးပါပြီ။", user });
  },
);

const pushTokenSchema = z.object({
  token: z
    .string()
    .trim()
    .regex(/^(ExponentPushToken|ExpoPushToken)\[[^\]]+\]$/, "Push token မမှန်ပါ။"),
});

app.post("/push-tokens", requireSession, async (request: AuthenticatedRequest, response) => {
  const parsed = pushTokenSchema.safeParse(request.body);
  if (!parsed.success) {
    throw new HttpError(400, "Push token မမှန်ပါ။");
  }

  await prisma.pushToken.upsert({
    where: { token: parsed.data.token },
    update: { userId: request.userId! },
    create: { token: parsed.data.token, userId: request.userId! },
  });
  response.json({ message: "အကြောင်းကြားချက်ကို ဖွင့်ပြီးပါပြီ။" });
});

app.delete("/push-tokens", requireSession, async (request: AuthenticatedRequest, response) => {
  const parsed = pushTokenSchema.safeParse(request.body);
  if (!parsed.success) {
    throw new HttpError(400, "Push token မမှန်ပါ။");
  }

  await prisma.pushToken.deleteMany({
    where: { token: parsed.data.token, userId: request.userId },
  });
  response.json({ message: "အကြောင်းကြားချက်ကို ပိတ်ပြီးပါပြီ။" });
});

app.get("/me", requireSession, async (request: AuthenticatedRequest, response) => {
  const user = await prisma.user.findUnique({
    where: { id: request.userId },
    select: {
      id: true,
      email: true,
      name: true,
      year: true,
      major: true,
      phone: true,
      telegram: true,
      createdAt: true,
    },
  });
  if (!user) {
    throw new HttpError(404, "အသုံးပြုသူကို ရှာမတွေ့ပါ။");
  }
  response.json({ user });
});

const createBookSchema = z.object({
  title: z.string().trim().min(1, "စာအုပ်အမည် ထည့်ပေးပါ။").max(200, "စာအုပ်အမည်သည် စာလုံး ၂၀၀ ထက် မကျော်ရပါ။"),
  author: z.string().trim().max(100, "ရေးသားသူအမည်သည် စာလုံး ၁၀၀ ထက် မကျော်ရပါ။").optional().default(""),
  major: z.string().trim().min(1, "မေဂျာ ရွေးပေးပါ။").max(50, "မေဂျာအမည်သည် စာလုံး ၅၀ ထက် မကျော်ရပါ။"),
  year: z.string().trim().min(1, "သင်တန်းနှစ် ရွေးပေးပါ။").max(50, "သင်တန်းနှစ်သည် စာလုံး ၅၀ ထက် မကျော်ရပါ။"),
  price: z.coerce.number().min(0, "ဈေးနှုန်းသည် သုညထက် မနည်းရပါ။").default(0),
  condition: z.string().trim().min(1, "အခြေအနေ ရွေးပေးပါ။").max(50, "အခြေအနေသည် စာလုံး ၅၀ ထက် မကျော်ရပါ။"),
  description: z.string().trim().max(1000, "ဖော်ပြချက်သည် စာလုံး ၁,၀၀၀ ထက် မကျော်ရပါ။").optional().default(""),
  imageUrl: z.string().trim().optional().default(""),
});

app.get("/books", async (request, response) => {
  const { search, major, year } = request.query;

  const where: Record<string, unknown> = {};
  if (typeof search === "string" && search.trim()) {
    const q = search.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { author: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }
  if (typeof major === "string" && major.trim() && major !== "All") {
    where.AND = [
      {
        OR: [
          { major: { equals: major.trim(), mode: "insensitive" } },
          { major: { equals: ALL_MAJORS_VALUE, mode: "insensitive" } },
        ],
      },
    ];
  }
  if (typeof year === "string" && year.trim() && year !== "All") {
    where.year = { equals: year.trim(), mode: "insensitive" };
  }

  const books = await prisma.book.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      seller: {
        select: {
          id: true,
          year: true,
        },
      },
    },
  });

  response.json({ books });
});

app.post("/books", requireSession, async (request: AuthenticatedRequest, response) => {
  const parsed = createBookSchema.safeParse(request.body);
  if (!parsed.success) {
    throw new HttpError(
      400,
      parsed.error.issues[0]?.message ?? "စာအုပ်အချက်အလက်များကို မှန်ကန်စွာ ဖြည့်ပါ။",
    );
  }
  const courseRuleError = validateCommonCourseListing(
    parsed.data.title,
    parsed.data.major,
    parsed.data.year,
  );
  if (courseRuleError === "major") {
    throw new HttpError(400, "ဤဘာသာရပ်ကို မေဂျာအားလုံး သင်ယူရသောကြောင့် “မေဂျာအားလုံး” ကို ရွေးပါ။");
  }
  if (courseRuleError === "year") {
    throw new HttpError(400, "ဤဘာသာရပ်အတွက် သတ်မှတ်ထားသော သင်တန်းနှစ်ကို ရွေးပါ။");
  }

  const book = await prisma.book.create({
    data: {
      title: parsed.data.title,
      author: parsed.data.author,
      major: parsed.data.major,
      year: parsed.data.year,
      price: parsed.data.price,
      condition: parsed.data.condition,
      description: parsed.data.description,
      imageUrl: parsed.data.imageUrl || null,
      sellerId: request.userId!,
    },
    include: {
      seller: {
        select: {
          id: true,
          name: true,
          year: true,
          phone: true,
          telegram: true,
        },
      },
    },
  });

  response.json({ message: "စာအုပ်တင်ပြီးပါပြီ။", book });
});

app.get("/my-books", requireSession, async (request: AuthenticatedRequest, response) => {
  const books = await prisma.book.findMany({
    where: { sellerId: request.userId },
    orderBy: { createdAt: "desc" },
  });
  response.json({ books });
});

app.patch("/books/:id", requireSession, async (request: AuthenticatedRequest, response) => {
  const id = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
  if (!id) {
    throw new HttpError(400, "စာအုပ် id မမှန်ပါ");
  }

  const parsed = createBookSchema.safeParse(request.body);
  if (!parsed.success) {
    throw new HttpError(
      400,
      parsed.error.issues[0]?.message ?? "စာအုပ်အချက်အလက်ကို မှန်ကန်စွာ ဖြည့်ပါ",
    );
  }

  const existingBook = await prisma.book.findUnique({ where: { id } });
  if (!existingBook) {
    throw new HttpError(404, "စာအုပ်ကို ရှာမတွေ့ပါ");
  }
  if (existingBook.sellerId !== request.userId) {
    throw new HttpError(403, "ဤစာအုပ်ကို ပြင်ဆင်ခွင့်မရှိပါ");
  }

  const courseRuleError = validateCommonCourseListing(
    parsed.data.title,
    parsed.data.major,
    parsed.data.year,
  );
  if (courseRuleError) {
    throw new HttpError(400, "ဘာသာရပ်နှင့် သင်တန်းနှစ်ကို မှန်ကန်စွာ ရွေးချယ်ပါ");
  }

  const book = await prisma.book.update({
    where: { id },
    data: {
      title: parsed.data.title,
      author: parsed.data.author,
      major: parsed.data.major,
      year: parsed.data.year,
      price: parsed.data.price,
      condition: parsed.data.condition,
      description: parsed.data.description,
      imageUrl: parsed.data.imageUrl || null,
    },
    include: {
      seller: {
        select: { id: true, name: true, year: true, phone: true, telegram: true },
      },
    },
  });

  response.json({ message: "စာအုပ်အချက်အလက်ကို ပြင်ဆင်ပြီးပါပြီ", book });
});

app.delete("/books/:id", requireSession, async (request: AuthenticatedRequest, response) => {
  const id = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
  if (!id) {
    throw new HttpError(400, "စာအုပ် id မမှန်ပါ။");
  }
  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) {
    throw new HttpError(404, "စာအုပ် ရှာမတွေ့ပါ။");
  }
  if (book.sellerId !== request.userId) {
    throw new HttpError(403, "ဤစာအုပ်ကို ဖျက်ပိုင်ခွင့် မရှိပါ။");
  }

  await prisma.book.delete({ where: { id } });
  response.json({ message: "စာအုပ်ကို ဖျက်ပြီးပါပြီ။" });
});

const updateBookStatusSchema = z.object({
  status: z.enum(["AVAILABLE", "SOLD"]),
});

app.patch("/books/:id/status", requireSession, async (request: AuthenticatedRequest, response) => {
  const id = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
  if (!id) {
    throw new HttpError(400, "စာအုပ် id မမှန်ပါ။");
  }

  const parsed = updateBookStatusSchema.safeParse(request.body);
  if (!parsed.success) {
    throw new HttpError(400, "စာအုပ်ရရှိနိုင်မှု အခြေအနေကို မှန်ကန်စွာ ရွေးပါ။");
  }

  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) {
    throw new HttpError(404, "စာအုပ် ရှာမတွေ့ပါ။");
  }
  if (book.sellerId !== request.userId) {
    throw new HttpError(403, "ဤစာအုပ်၏ အခြေအနေကို ပြောင်းပိုင်ခွင့် မရှိပါ။");
  }

  const updatedBook = await prisma.book.update({
    where: { id },
    data: { status: parsed.data.status },
  });
  response.json({
    message: parsed.data.status === "SOLD"
      ? "စာအုပ်ကို ရောင်းပြီးအဖြစ် သတ်မှတ်လိုက်ပါပြီ။"
      : "စာအုပ်ကို ရရှိနိုင်အဖြစ် ပြန်သတ်မှတ်လိုက်ပါပြီ။",
    book: updatedBook,
  });
});

const createAppointmentSchema = z.object({
  bookId: z.string().min(1),
  note: z.string().trim().max(300).optional().default(""),
});

app.post("/appointments", requireSession, async (request: AuthenticatedRequest, response) => {
  const parsed = createAppointmentSchema.safeParse(request.body);
  if (!parsed.success) {
    throw new HttpError(400, "စာအုပ် id မမှန်ပါ။");
  }

  const book = await prisma.book.findUnique({
    where: { id: parsed.data.bookId },
    include: { seller: { select: { id: true, name: true } } },
  });
  if (!book) {
    throw new HttpError(404, "စာအုပ် ရှာမတွေ့ပါ။");
  }

  if (book.sellerId === request.userId) {
    throw new HttpError(400, "မိမိတင်ထားသော စာအုပ်ကို ဝယ်ယူရန် တောင်းဆို၍ မရပါ။");
  }
  if (!canRequestBook(book.status)) {
    throw new HttpError(400, "ဤစာအုပ်ကို ရောင်းပြီးဖြစ်၍ ဝယ်ယူရန် တောင်းဆို၍ မရပါ။");
  }

  const existing = await prisma.appointment.findFirst({
    where: {
      bookId: parsed.data.bookId,
      buyerId: request.userId!,
      status: { in: ["PENDING", "ACCEPTED"] },
    },
  });
  if (existing) {
    throw new HttpError(400, "ဤစာအုပ်ကို ဝယ်ယူရန် တောင်းဆိုထားပြီး ဖြစ်ပါသည်။");
  }

  const appointment = await prisma.appointment.create({
    data: {
      bookId: parsed.data.bookId,
      buyerId: request.userId!,
      sellerId: book.sellerId,
      note: parsed.data.note,
      status: "PENDING",
    },
    include: {
      book: {
        select: { id: true, title: true, major: true, year: true, price: true },
      },
      buyer: {
        select: { id: true, name: true, year: true },
      },
    },
  });

  const buyerName = appointment.buyer.name || "ကျောင်းသား";
  await notifyUser(book.sellerId, {
    title: "ဝယ်ယူရန် တောင်းဆိုမှုအသစ်",
    body: `သင့်စာအုပ် "${appointment.book.title}" ကို ဝယ်ယူရန် ${buyerName} က တောင်းဆိုထားပါသည်။`,
    data: { appointmentId: appointment.id },
  });
  response.json({ message: "ဝယ်ယူရန် တောင်းဆိုမှု ပို့ပြီးပါပြီ။", appointment });
});

app.get("/appointments/incoming", requireSession, async (request: AuthenticatedRequest, response) => {
  const appointments = await prisma.appointment.findMany({
    where: { sellerId: request.userId },
    orderBy: { createdAt: "desc" },
    include: {
      book: {
        select: { id: true, title: true, price: true, major: true, year: true },
      },
      buyer: {
        select: {
          id: true,
          name: true,
          year: true,
          phone: true,
          telegram: true,
        },
      },
    },
  });

  const sanitized = appointments.map((apt) => {
    if (apt.status === "PENDING") {
      return {
        ...apt,
        buyer: {
          id: apt.buyer.id,
          name: apt.buyer.name || "ကျောင်းသား",
          year: apt.buyer.year,
          phone: null,
          telegram: null,
        },
      };
    }
    return apt;
  });

  response.json({ appointments: sanitized });
});

app.get("/appointments/my-requests", requireSession, async (request: AuthenticatedRequest, response) => {
  const appointments = await prisma.appointment.findMany({
    where: { buyerId: request.userId },
    orderBy: { createdAt: "desc" },
    include: {
      book: {
        select: { id: true, title: true, price: true, major: true, year: true },
      },
      seller: {
        select: {
          id: true,
          name: true,
          year: true,
          phone: true,
          telegram: true,
        },
      },
    },
  });

  const sanitized = appointments.map((apt) => {
    if (apt.status !== "ACCEPTED") {
      return {
        ...apt,
        seller: {
          id: apt.seller.id,
          name: null,
          year: apt.seller.year,
          phone: null,
          telegram: null,
        },
      };
    }
    return apt;
  });

  response.json({ appointments: sanitized });
});

app.patch("/appointments/:id/accept", requireSession, async (request: AuthenticatedRequest, response) => {
  const id = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
  if (!id)   throw new HttpError(400, "ဝယ်ယူရန် တောင်းဆိုမှု အမှတ်စဉ် မမှန်ပါ။");

  const appointment = await prisma.appointment.findUnique({
    where: { id },
  });
  if (!appointment)   throw new HttpError(404, "ဝယ်ယူရန် တောင်းဆိုမှုကို ရှာမတွေ့ပါ။");
  if (appointment.sellerId !== request.userId) {
    throw new HttpError(403, "ဤဝယ်ယူရန် တောင်းဆိုမှုကို လက်ခံပိုင်ခွင့် မရှိပါ။");
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status: "ACCEPTED" },
    include: {
      book: { select: { id: true, title: true } },
      buyer: {
        select: { id: true, name: true, year: true, phone: true, telegram: true },
      },
    },
  });

  await notifyUser(updated.buyerId, {
    title: "ကမ်းလှမ်းချက်ကို လက်ခံလိုက်ပါပြီ 🎉",
    body: `ရောင်းသူက သင့်ရဲ့ "${updated.book.title}" ကမ်းလှမ်းချက်ကို လက်ခံလိုက်ပါပြီ။`,
    data: { appointmentId: updated.id },
  });
  response.json({ message: "ဝယ်ယူရန် တောင်းဆိုမှုကို လက်ခံလိုက်ပါပြီ။", appointment: updated });
});

app.patch("/appointments/:id/reject", requireSession, async (request: AuthenticatedRequest, response) => {
  const id = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
  if (!id) throw new HttpError(400, "ဝယ်ယူရန် တောင်းဆိုမှု အမှတ်စဉ် မမှန်ပါ။");

  const appointment = await prisma.appointment.findUnique({
    where: { id },
  });
  if (!appointment) throw new HttpError(404, "ဝယ်ယူရန် တောင်းဆိုမှုကို ရှာမတွေ့ပါ။");
  if (appointment.sellerId !== request.userId) {
    throw new HttpError(403, "ဤဝယ်ယူရန် တောင်းဆိုမှုကို ပယ်ဖျက်ပိုင်ခွင့် မရှိပါ။");
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status: "REJECTED" },
    include: { book: { select: { title: true } } },
  });

  await notifyUser(updated.buyerId, {
    title: "ကမ်းလှမ်းချက် ငြင်းပယ်ခံရပါသည် 😔",
    body: `စိတ်မကောင်းပါဘူး၊ ရောင်းသူက သင့်ရဲ့ "${updated.book.title}" ကမ်းလှမ်းချက်ကို ငြင်းပယ်လိုက်ပါတယ်။`,
    data: { appointmentId: updated.id },
  });
  response.json({ message: "ဝယ်ယူရန် တောင်းဆိုမှုကို ငြင်းပယ်လိုက်ပါပြီ။", appointment: updated });
});

app.use(
  (error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    if (error instanceof HttpError) {
      response.status(error.status).json({ error: error.message });
      return;
    }

    console.error("Unhandled API error:", error);
    response.status(500).json({ error: "ဆာဗာအတွင်းပိုင်း အမှားဖြစ်နေပါသည်။" });
  },
);

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`UniBookExchange API listening on port ${port}`);
});

async function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
