export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.protocol.startsWith('http')
    ? ''
    : 'http://127.0.0.1:3000');

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
}

export class ApiError extends Error {
  public statusCode: number;
  public details?: unknown;

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;  
  }
}

export interface ApiRequestConfig {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  data?: unknown;
}

async function send<T = any>(url: string, method = 'GET', data?: unknown, headers?: Record<string, string>) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: data === undefined ? undefined : JSON.stringify(data),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => undefined);
    if (!response.ok) {
      throw new ApiError(
        body?.message || body?.error || `Request failed with status ${response.status}`,
        response.status,
        body,
      );
    }
    return { data: body as T, status: response.status };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (controller.signal.aborted) {
      throw new ApiError('Request timed out. Please verify that the API is running.', 408);
    }
    throw new ApiError(error instanceof Error ? error.message : 'Network error: could not connect to API server.', 0);
  } finally {
    window.clearTimeout(timeout);
  }
}

export const axiosInstance = {
  get: <T = any>(url: string) => send<T>(url),
  post: <T = any>(url: string, data?: unknown) => send<T>(url, 'POST', data),
  patch: <T = any>(url: string, data?: unknown) => send<T>(url, 'PATCH', data),
  delete: <T = any>(url: string) => send<T>(url, 'DELETE'),
};

export async function apiRequest<T>(
  config: ApiRequestConfig
): Promise<T> {
  const response = await send<ApiResponse<T>>(config.url || '', config.method || 'GET', config.data, config.headers);
  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    return response.data.data;
  }
  return response.data as unknown as T;
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const config: ApiRequestConfig = {
    url: endpoint,
    method: options.method || 'GET',
    headers: options.headers ? Object.fromEntries(new Headers(options.headers).entries()) : undefined,
    data: options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : undefined,
  };
  return apiRequest<T>(config);
}
