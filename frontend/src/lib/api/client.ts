/**
 * Core HTTP Client for Aspire AI Backend API
 * Hardened with automatic Bearer JWT injection, 401 interceptors, and typed helpers (Audit §4.6)
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const TOKEN_STORAGE_KEY = "aspireai_jwt_token";

/**
 * Retrieves the cryptographic JWT token from browser localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Persists a cryptographic JWT token to browser localStorage
 */
export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch (err) {
    console.warn("Failed to persist JWT to localStorage:", err);
  }
}

/**
 * Purges the JWT token from browser localStorage
 */
export function clearAuthToken(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (err) {
    console.warn("Failed to clear JWT from localStorage:", err);
  }
}

/**
 * Fetch with automatic JWT Bearer header attachment and deterministic timeout (default 7000ms)
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 7000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => {
    try {
      controller.abort(
        new DOMException(`Request timed out after ${timeoutMs}ms`, "TimeoutError")
      );
    } catch {
      controller.abort();
    }
  }, timeoutMs);

  // Normalize and clone incoming headers
  const headers = new Headers(options.headers || {});

  // Automatically attach Bearer token from localStorage if not already provided (Audit §4.6)
  const token = getAuthToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(id);

    // Centralized 401 Unauthorized handling
    if (res.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("aspireai:unauthorized", {
          detail: { url, status: 401 },
        })
      );
    }

    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

/**
 * High-level typed API client utilities
 */
export const apiClient = {
  async get<T = unknown>(path: string, options?: RequestInit): Promise<T> {
    const fullUrl = path.startsWith("http") ? path : `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
    const res = await fetchWithTimeout(fullUrl, {
      method: "GET",
      ...options,
    });
    if (!res.ok) {
      const errorBody = await res.text().catch(() => "");
      throw new Error(`GET ${path} failed (${res.status}): ${errorBody}`);
    }
    return res.json() as Promise<T>;
  },

  async post<T = unknown>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    const fullUrl = path.startsWith("http") ? path : `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    
    const headers = new Headers(options?.headers || {});
    if (!isFormData && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const res = await fetchWithTimeout(fullUrl, {
      method: "POST",
      body: isFormData ? (body as FormData) : JSON.stringify(body),
      ...options,
      headers,
    });
    if (!res.ok) {
      const errorBody = await res.text().catch(() => "");
      throw new Error(`POST ${path} failed (${res.status}): ${errorBody}`);
    }
    return res.json() as Promise<T>;
  },

  async put<T = unknown>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    const fullUrl = path.startsWith("http") ? path : `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    
    const headers = new Headers(options?.headers || {});
    if (!isFormData && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const res = await fetchWithTimeout(fullUrl, {
      method: "PUT",
      body: isFormData ? (body as FormData) : JSON.stringify(body),
      ...options,
      headers,
    });
    if (!res.ok) {
      const errorBody = await res.text().catch(() => "");
      throw new Error(`PUT ${path} failed (${res.status}): ${errorBody}`);
    }
    return res.json() as Promise<T>;
  },

  async delete<T = unknown>(path: string, options?: RequestInit): Promise<T> {
    const fullUrl = path.startsWith("http") ? path : `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
    const res = await fetchWithTimeout(fullUrl, {
      method: "DELETE",
      ...options,
    });
    if (!res.ok) {
      const errorBody = await res.text().catch(() => "");
      throw new Error(`DELETE ${path} failed (${res.status}): ${errorBody}`);
    }
    return res.json() as Promise<T>;
  },
};

export interface PlanDefinition {
  id: string;
  name: string;
  audience: "student" | "employer" | "all";
  description: string;
  price_inr_monthly: number;
  price_inr_annual: number;
  price_usd_monthly: number;
  price_usd_annual: number;
  limits: {
    active_jobs: number;
    candidate_evaluations_monthly: number;
    seats_included: number;
    resume_uploads_monthly: number;
    ai_interviews_monthly: number;
  };
  features: string[];
  badge?: string;
  is_popular: boolean;
}

export interface UserSubscription {
  id: string;
  org_id?: string;
  user_id?: string;
  plan_id: string;
  status: string;
  seats_purchased: number;
  billing_cycle: "monthly" | "annual";
  provider: string;
  active_jobs_limit: number;
  evaluations_limit: number;
  evaluations_used: number;
  current_period_end?: string;
}

export interface CheckoutPayload {
  plan_id: string;
  billing_cycle: "monthly" | "annual";
  provider: "razorpay" | "stripe";
  currency?: "INR" | "USD";
  seats?: number;
}

export interface CheckoutResponse {
  provider: "razorpay" | "stripe";
  order_id?: string;
  session_id?: string;
  checkout_url?: string;
  key_id?: string;
  publishable_key?: string;
  amount: number;
  currency: string;
  plan_id: string;
  billing_cycle: string;
}

export interface VerifyPaymentPayload {
  provider: "razorpay" | "stripe";
  plan_id: string;
  billing_cycle: string;
  order_id?: string;
  payment_id?: string;
  signature?: string;
  session_id?: string;
}

export const billingApi = {
  getPlans: (audience: string = "all"): Promise<{ plans: PlanDefinition[] }> =>
    apiClient.get<{ plans: PlanDefinition[] }>(`/billing/plans?audience=${audience}`),

  getCurrentSubscription: (): Promise<UserSubscription> =>
    apiClient.get<UserSubscription>("/billing/subscription"),

  createCheckout: (payload: CheckoutPayload): Promise<CheckoutResponse> =>
    apiClient.post<CheckoutResponse>("/billing/checkout", payload),

  verifyPayment: (
    payload: VerifyPaymentPayload
  ): Promise<{ status: string; message: string; subscription: UserSubscription }> =>
    apiClient.post<{ status: string; message: string; subscription: UserSubscription }>(
      "/billing/verify-payment",
      payload
    ),

  cancelSubscription: (): Promise<{ status: string; message: string }> =>
    apiClient.post<{ status: string; message: string }>("/billing/cancel"),
};

