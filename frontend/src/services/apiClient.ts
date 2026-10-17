import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';

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

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const data = error.response.data;
      const message =
        data?.message ||
        data?.error ||
        `Request failed with status ${error.response.status}`;
      return Promise.reject(new ApiError(message, error.response.status, data));
    }
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return Promise.reject(
        new ApiError('Request timed out. Please verify that the API is running.', 408)
      );
    }
    return Promise.reject(
      new ApiError(error.message || 'Network error: could not connect to API server.', 0)
    );
  }
);

export async function apiRequest<T>(
  config: AxiosRequestConfig
): Promise<T> {
  const response = await axiosInstance.request<ApiResponse<T>>(config);
  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    return response.data.data;
  }
  return response.data as unknown as T;
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const config: AxiosRequestConfig = {
    url: endpoint,
    method: options.method || 'GET',
    headers: options.headers as Record<string, string>,
    data: options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : undefined,
  };
  return apiRequest<T>(config);
}
