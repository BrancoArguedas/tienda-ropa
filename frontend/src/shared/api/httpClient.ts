import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

/**
 * Cliente HTTP único. Sanctum SPA: cookie de sesión + token XSRF.
 * Las peticiones que modifican datos obtienen antes la cookie CSRF (una sola vez).
 */
export const http = axios.create({
  baseURL: '/api',
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
});

let csrfPromise: Promise<unknown> | null = null;

export function ensureCsrfCookie(force = false): Promise<unknown> {
  if (force || !csrfPromise) {
    csrfPromise = axios.get('/sanctum/csrf-cookie', { withCredentials: true }).catch((error) => {
      csrfPromise = null;
      throw error;
    });
  }
  return csrfPromise;
}

const SAFE_METHODS = ['get', 'head', 'options'];

http.interceptors.request.use(async (config) => {
  if (!SAFE_METHODS.includes((config.method ?? 'get').toLowerCase())) {
    await ensureCsrfCookie();
  }
  return config;
});

type RetriableConfig = InternalAxiosRequestConfig & { _csrfRetried?: boolean };

http.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config as RetriableConfig | undefined;
  // 419 = token CSRF vencido: se renueva y se reintenta UNA vez.
  if (error.response?.status === 419 && config && !config._csrfRetried) {
    config._csrfRetried = true;
    await ensureCsrfCookie(true);
    return http(config);
  }
  return Promise.reject(error);
});

export interface ApiValidationError {
  message: string;
  errors?: Record<string, string[]>;
}

export function getApiError(error: unknown): ApiValidationError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Partial<ApiValidationError> | undefined;
    if (error.response?.status === 429) {
      return { message: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.' };
    }
    return {
      message: data?.message ?? 'Ocurrió un error de conexión. Inténtalo de nuevo.',
      errors: data?.errors,
    };
  }
  return { message: 'Ocurrió un error inesperado.' };
}

export function isStatus(error: unknown, status: number): boolean {
  return axios.isAxiosError(error) && error.response?.status === status;
}
