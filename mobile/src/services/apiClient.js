// Shared axios instance: base URL from EXPO_PUBLIC_API_URL, JWT on every request, errors normalised for screens.
// Feature services call it and receive the API envelope { success, message, data } directly.
import { create } from 'axios';
import { getAccessToken } from '../utils/tokenStorage';
import { API_TIMEOUT_MS } from '../utils/constants';

const HTTP_UNAUTHORIZED = 401;
const NO_RESPONSE_STATUS = 0;
const NETWORK_ERROR_MESSAGE = 'Cannot reach the server. Check your internet connection and try again.';
const UNKNOWN_ERROR_MESSAGE = 'Something went wrong. Please try again.';

let handleUnauthorizedSession = null;

const apiClient = create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Lets AuthContext decide what happens when the API answers 401 (it signs the user out).
 * @param {Function | null} unauthorizedHandler - Called with no arguments on every 401 response.
 * @returns {void}
 */
export function registerUnauthorizedHandler(unauthorizedHandler) {
  handleUnauthorizedSession = unauthorizedHandler;
}

/**
 * Converts an axios error into the shape every screen expects.
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
 * Request interceptor: adds "Authorization: Bearer <token>" when a token is stored.
 * @param {import('axios').InternalAxiosRequestConfig} requestConfig - Outgoing request config.
 * @returns {Promise<import('axios').InternalAxiosRequestConfig>} Config with the header set.
 */
async function attachAccessToken(requestConfig) {
  const accessToken = await getAccessToken();
  if (accessToken) {
    requestConfig.headers.Authorization = `Bearer ${accessToken}`;
  }
  return requestConfig;
}

/**
 * Response error interceptor: normalises the error and reports expired sessions.
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
