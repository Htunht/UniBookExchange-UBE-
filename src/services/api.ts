const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  year: string | null;
  major: string | null;
  phone: string | null;
  telegram: string | null;
  createdAt: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  year: string;
  major: string;
  phone: string;
  telegram: string;
}

export interface Seller {
  id: string;
  name: string | null;
  year: string | null;
  phone: string | null;
  telegram: string | null;
}

export interface Book {
  id: string;
  title: string;
  author: string | null;
  major: string;
  year: string;
  price: number;
  condition: string;
  status: "AVAILABLE" | "SOLD";
  description: string | null;
  imageUrl: string | null;
  sellerId: string;
  createdAt: string;
  seller?: Seller;
}

export interface CreateBookInput {
  title: string;
  author?: string;
  major: string;
  year: string;
  price: number;
  condition: string;
  description?: string;
  imageUrl?: string;
}

export type AppointmentStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface Appointment {
  id: string;
  bookId: string;
  buyerId: string;
  sellerId: string;
  status: AppointmentStatus;
  note: string | null;
  createdAt: string;
  book: {
    id: string;
    title: string;
    price: number;
    major: string;
    year: string;
  };
  seller?: Seller;
  buyer?: {
    id: string;
    name: string | null;
    year: string | null;
    phone: string | null;
    telegram: string | null;
  };
}

async function request<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "DELETE" | "PATCH";
    body?: unknown;
    sessionToken?: string;
  } = {},
): Promise<T> {
  if (!apiBaseUrl) {
    throw new Error(
      "EXPO_PUBLIC_API_URL မသတ်မှတ်ရသေးပါ။ .env.local ထဲတွင် backend URL ထည့်ပါ။",
    );
  }

  const { method = "POST", body, sessionToken } = options;

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  let result: { error?: string } & Record<string, unknown>;
  try {
    result = (await response.json()) as typeof result;
  } catch {
    throw new Error("Backend မှ မှန်ကန်သော response မရပါ။");
  }

  if (!response.ok) {
    throw new ApiError(
      result.error ?? "တောင်းဆိုမှု မအောင်မြင်ပါ။",
      response.status,
    );
  }

  return result as T;
}

export interface OtpRequestResponse {
  message: string;
}

export function registerUser(
  data: RegisterInput,
): Promise<{ sessionToken: string; user: UserProfile }> {
  return request("/auth/register", { method: "POST", body: data });
}

export function loginUser(
  email: string,
  password: string,
): Promise<{ sessionToken: string; user: UserProfile }> {
  return request("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function requestPasswordReset(email: string): Promise<OtpRequestResponse> {
  return request("/auth/forgot-password/request", {
    method: "POST",
    body: { email },
  });
}

export function verifyPasswordResetOtp(
  email: string,
  otp: string,
): Promise<{ resetToken: string }> {
  return request("/auth/forgot-password/verify", {
    method: "POST",
    body: { email, otp },
  });
}

export function resetPassword(
  email: string,
  resetToken: string,
  password: string,
): Promise<{ message: string }> {
  return request("/auth/forgot-password/reset", {
    method: "POST",
    body: { email, resetToken, password },
  });
}

export function sendOtp(email: string): Promise<{ message: string }> {
  return request("/auth/send-otp", { method: "POST", body: { email } });
}

export function verifyOtp(
  email: string,
  token: string,
): Promise<{
  sessionToken: string;
  user: {
    id: string;
    email: string;
    name?: string | null;
    year?: string | null;
    phone?: string | null;
    telegram?: string | null;
  };
}> {
  return request("/auth/verify-otp", { method: "POST", body: { email, token } });
}

export function saveProfile(
  sessionToken: string,
  profile: { name: string; year: string; phone: string; telegram: string },
): Promise<{ message: string }> {
  return request("/profile", { method: "POST", body: profile, sessionToken });
}

export function registerPushToken(
  sessionToken: string,
  token: string,
): Promise<{ message: string }> {
  return request("/push-tokens", { method: "POST", body: { token }, sessionToken });
}

export function unregisterPushToken(
  sessionToken: string,
  token: string,
): Promise<{ message: string }> {
  return request("/push-tokens", { method: "DELETE", body: { token }, sessionToken });
}

export function getMyProfile(sessionToken: string): Promise<{ user: UserProfile }> {
  return request("/me", { method: "GET", sessionToken });
}

export function getBooks(filters?: {
  search?: string;
  major?: string;
  year?: string;
}): Promise<{ books: Book[] }> {
  const query = new URLSearchParams();
  if (filters?.search) query.set("search", filters.search);
  if (filters?.major) query.set("major", filters.major);
  if (filters?.year) query.set("year", filters.year);

  const queryString = query.toString();
  const endpoint = queryString ? `/books?${queryString}` : "/books";
  return request(endpoint, { method: "GET" });
}

export function createBook(
  sessionToken: string,
  book: CreateBookInput,
): Promise<{ message: string; book: Book }> {
  return request("/books", { method: "POST", body: book, sessionToken });
}

export function getMyBooks(sessionToken: string): Promise<{ books: Book[] }> {
  return request("/my-books", { method: "GET", sessionToken });
}

export function deleteBook(
  sessionToken: string,
  bookId: string,
): Promise<{ message: string }> {
  return request(`/books/${bookId}`, { method: "DELETE", sessionToken });
}

export function updateBookStatus(
  sessionToken: string,
  bookId: string,
  status: Book["status"],
): Promise<{ message: string; book: Book }> {
  return request(`/books/${bookId}/status`, {
    method: "PATCH",
    body: { status },
    sessionToken,
  });
}

export function requestAppointment(
  sessionToken: string,
  bookId: string,
  note?: string,
): Promise<{ message: string; appointment: Appointment }> {
  return request("/appointments", {
    method: "POST",
    body: { bookId, note },
    sessionToken,
  });
}

export function getIncomingAppointments(
  sessionToken: string,
): Promise<{ appointments: Appointment[] }> {
  return request("/appointments/incoming", {
    method: "GET",
    sessionToken,
  });
}

export function getMyRequestedAppointments(
  sessionToken: string,
): Promise<{ appointments: Appointment[] }> {
  return request("/appointments/my-requests", {
    method: "GET",
    sessionToken,
  });
}

export function acceptAppointment(
  sessionToken: string,
  appointmentId: string,
): Promise<{ message: string; appointment: Appointment }> {
  return request(`/appointments/${appointmentId}/accept`, {
    method: "PATCH",
    sessionToken,
  });
}

export function rejectAppointment(
  sessionToken: string,
  appointmentId: string,
): Promise<{ message: string; appointment: Appointment }> {
  return request(`/appointments/${appointmentId}/reject`, {
    method: "PATCH",
    sessionToken,
  });
}
