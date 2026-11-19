import type { AuthData } from "@/contexts/AuthContext";
import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

type InterceptorCallbacks = {
  onTokensRefreshed: (authData: AuthData) => void;
  onSessionExpired: () => void;
};

const EXPIRY_SKEW_MS = 30_000;
const MAX_TIMEOUT_MS = 2_147_000_000;

function getTokenExpiry(token: string) {
  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const parsed = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")));
    return typeof parsed.exp === "number" ? parsed.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function setAxiosInterceptor(
  initialAuthData: AuthData,
  callbacks: InterceptorCallbacks,
) {
  let authData = initialAuthData.authenticated ? initialAuthData : null;
  let refreshPromise: Promise<AuthData> | undefined;
  let expired = false;
  let expiryTimer: ReturnType<typeof setTimeout> | undefined;

  const expireSession = () => {
    if (expired) return;
    expired = true;
    authData = null;
    if (expiryTimer) clearTimeout(expiryTimer);
    callbacks.onSessionExpired();
  };

  const refreshToken = () => {
    if (refreshPromise) return refreshPromise;
    if (!authData?.token || !authData.refresh_token) {
      expireSession();
      return Promise.reject(new Error("The authentication session has expired"));
    }

    const tokenEndpoint = localStorage.getItem("token_endpoint");
    const clientId = localStorage.getItem("client_id");
    if (!tokenEndpoint || !clientId) {
      expireSession();
      return Promise.reject(new Error("Missing OAuth refresh configuration"));
    }

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: authData.refresh_token,
      client_id: clientId,
    });
    const clientSecret = localStorage.getItem("client_secret");
    if (clientSecret) body.set("client_secret", clientSecret);

    refreshPromise = axios
      .create()
      .post<{ access_token: string; refresh_token?: string }>(
        tokenEndpoint,
        body,
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
      )
      .then(({ data }) => {
        if (!data.access_token) throw new Error("Missing access token in response");

        const refreshed = {
          ...authData!,
          token: data.access_token,
          refresh_token: data.refresh_token ?? authData!.refresh_token,
        };
        authData = refreshed;
        callbacks.onTokensRefreshed(refreshed);
        return refreshed;
      })
      .catch((error: unknown) => {
        expireSession();
        throw error;
      })
      .finally(() => {
        refreshPromise = undefined;
      });

    return refreshPromise;
  };

  const currentToken = async () => {
    if (!authData?.token) return undefined;

    const expiry = getTokenExpiry(authData.token);
    if (expiry === null || expiry > Date.now()) return authData.token;
    if (!authData.refresh_token) {
      expireSession();
      throw new Error("The authentication session has expired");
    }
    return (await refreshToken()).token;
  };

  if (authData?.token) {
    const expiry = getTokenExpiry(authData.token);
    if (expiry !== null) {
      const delay = Math.max(
        0,
        expiry - Date.now() - (authData.refresh_token ? EXPIRY_SKEW_MS : 0),
      );
      if (delay <= MAX_TIMEOUT_MS) {
        expiryTimer = setTimeout(() => {
          if (authData?.refresh_token) {
            void refreshToken().catch((error) => {
              console.error("Failed to renew the access token", error);
            });
          } else {
            expireSession();
          }
        }, delay);
      }
    }
  }

  const requestId = axios.interceptors.request.use(async (config) => {
    if (!authData) return config;

    config.baseURL = authData.endpoint;
    if (!authData.token) {
      config.auth = { username: authData.user, password: authData.password };
    } else {
      config.auth = undefined;
      config.headers.Authorization = `Bearer ${await currentToken()}`;
    }
    return config;
  });

  const responseId = axios.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config as RetryableConfig | undefined;
      if (
        error.response?.status !== 401 ||
        !config ||
        config._retry ||
        !authData?.token
      ) {
        return Promise.reject(error);
      }

      config._retry = true;
      if (!authData.refresh_token) {
        expireSession();
        return Promise.reject(error);
      }

      const authorization = `Bearer ${authData.token}`;
      if (config.headers.Authorization !== authorization) {
        config.headers.Authorization = authorization;
        return axios.request(config);
      }

      config.headers.Authorization = `Bearer ${(await refreshToken()).token}`;
      return axios.request(config);
    },
  );

  return () => {
    axios.interceptors.request.eject(requestId);
    axios.interceptors.response.eject(responseId);
    if (expiryTimer) clearTimeout(expiryTimer);
  };
}
