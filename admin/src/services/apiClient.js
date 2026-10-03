// Shared axios instance for the admin dashboard: base URL from VITE_API_URL, bearer token, normalised errors.
// Page services call it and receive the API envelope { success, message, data } directly.
import { create } from 'axios';

export const ACCESS_TOKEN_STORAGE_KEY = 'ceylonSmartBus.adminAccessToken';

const API_TIMEOUT_MS = 15000;
const HTTP_UNAUTHORIZED = 401;
const NO_RESPONSE_STATUS = 0;
const NETWORK_ERROR_MESSAGE = 'Cannot reach the server. Check your connection and try again.';
const UNKNOWN_ERROR_MESSAGE = 'Something went wrong. Please try again.';

let handleUnauthorizedSession = null;

const apiClient = create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Lets AuthContext log the admin out when the API answers 401.
 * @param {Function | null} unauthorizedHandler - Called on every 401 response.
 * @returns {void}
 */
export function registerUnauthorizedHandler(unauthorizedHandler) {
  handleUnauthorizedSession = unauthorizedHandler;
}

/**
 * Converts an axios error into { message, status, fieldErrors } for pages to display.
 * @param {import('axios').AxiosError} axiosError - Error thrown by axios.
 * @returns {{message: string, status: number, fieldErrors: Object<string, string>}} Normalised error.
 */
export function normaliseApiError(axiosError) {
  const errorResponse = axiosError.response;
  if (!errorResponse) {
    return { message: NETWORK_ERROR_MESSAGE, status: NO_RESPONSE_STATUS, fieldErrors: {} };
  }
  const responseBody = errorResponse.data || {};
  const fieldErrors = {};
  (responseBody.errors || []).forEach((fieldError) => {
    if (fieldError.field) fieldErrors[fieldError.field] = fieldError.message;
  });
  return {
    message: responseBody.message || UNKNOWN_ERROR_MESSAGE,
    status: errorResponse.status,
    fieldErrors,
  };
}

/**
 * Request interceptor: adds the stored admin token.
 * @param {import('axios').InternalAxiosRequestConfig} requestConfig - Outgoing request config.
 * @returns {import('axios').InternalAxiosRequestConfig} Config with the Authorization header.
 */
function attachAccessToken(requestConfig) {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  if (accessToken) {
    requestConfig.headers.Authorization = `Bearer ${accessToken}`;
  }
  return requestConfig;
}

/**
 * Response error interceptor: normalises the error and logs out on 401.
 * @param {import('axios').AxiosError} axiosError - Failed request.
 * @returns {Promise<never>} Always rejects with the normalised error.
 */
function rejectWithNormalisedError(axiosError) {
  const normalisedError = normaliseApiError(axiosError);
  if (normalisedError.status === HTTP_UNAUTHORIZED && handleUnauthorizedSession) {
    handleUnauthorizedSession();
  }
  return Promise.reject(normalisedError);
}

apiClient.interceptors.request.use(attachAccessToken);
apiClient.interceptors.response.use((axiosResponse) => axiosResponse.data, rejectWithNormalisedError);

export default apiClient;
