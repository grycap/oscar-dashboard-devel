import getSystemConfigApi from "@/api/config/getSystemConfig";
import { getInfoApi } from "@/api/info/getInfoApi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { setAxiosInterceptor } from "@/lib/axiosClient";
import { ClusterInfo } from "@/models/clusterInfo";
import { ClusterConfig } from "@/models/systemConfig";
import { AlertTriangle } from "lucide-react";
import { isAxiosError } from "axios";
import React, {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type EGISessionInfo = {
  eduperson_assurance: string[]; // List of URLs for assurance levels
  eduperson_entitlement: string[]; // List of entitlement values
  email: string; // User email address
  email_verified: boolean; // Indicates whether the email is verified
  family_name: string; // User last name
  given_name: string; // User first name
  name: string; // User full name
  preferred_username: string; // Preferred username
  sub: string; // Unique user identifier
  voperson_verified_email: string[]; // List of verified email addresses

  group_membership: string[];
  realm_access?: {
    roles?: string[];
  };
};

export type AuthData = {
  user: string;
  password: string;
  endpoint: string;
  token?: string;
  refresh_token?: string; 
  authenticated?: boolean;
  egiSession?: EGISessionInfo;
};

export const AuthContext = createContext({
  authData: {
    user: "",
    password: "",
    endpoint: "",
    authenticated: false,
  } as AuthData,
  setAuthData: (_: AuthData) => {},
  refreshSystemConfig: async () => {},
  systemConfig: null as ClusterConfig | null,
  clusterInfo: null as ClusterInfo | null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const initialData = useMemo(() => {
    const storedData = localStorage.getItem("authData");
    if (!storedData) {
      return {
        user: "",
        password: "",
        endpoint: "",
        token: undefined,
        authenticated: false,
      } as AuthData;
    }

    return JSON.parse(storedData) as AuthData;
  }, []);

  const [authData, setAuthDataState] = useState(initialData);
  const [systemConfig, setSystemConfig] = useState<ClusterConfig | null>(null);
  const [clusterInfo, setClusterInfo] = useState<ClusterInfo | null>(null);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  const handleSessionExpired = useCallback(() => {
    const emptyAuthData: AuthData = {
      user: "",
      password: "",
      endpoint: "",
      token: undefined,
      refresh_token: undefined,
      authenticated: false,
      egiSession: undefined,
    };

    localStorage.clear();
    sessionStorage.clear();
    if ("caches" in window) {
      void caches.keys()
        .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
        .catch((error) => console.error("Failed to clear browser cache", error));
    }

    setAuthDataState(emptyAuthData);
    setSystemConfig(null);
    setClusterInfo(null);
    setIsSessionExpired(true);
    window.location.hash = "/login";
  }, []);

  const removeAxiosInterceptor = useMemo(() => {
    return setAxiosInterceptor(authData, {
      onTokensRefreshed: (refreshedAuthData) => {
        localStorage.setItem("authData", JSON.stringify(refreshedAuthData));
        setAuthDataState(refreshedAuthData);
      },
      onSessionExpired: handleSessionExpired,
    });
  }, [authData, handleSessionExpired]);

  useEffect(() => removeAxiosInterceptor, [removeAxiosInterceptor]);

  async function refreshSystemConfig() {
    if (!authData.authenticated) {
      setSystemConfig(null);
      return;
    }

    const response = await getSystemConfigApi();
    if (!response) {
      setSystemConfig(null);
      return;
    }

    if (authData.token === undefined && response.config.oidc_groups.length === 1 && response.config.oidc_groups[0] === "") {
      response.config.oidc_groups[0] = " ";
    } else if (response.config.oidc_groups.length > 1) {
      response.config.oidc_groups = response.config.oidc_groups.map((group) => group === "" ? " " : group);
    }

    setSystemConfig(response);
  }

  useEffect(() => {
    void refreshSystemConfig();
  }, [authData]);

  function setAuthData(data: AuthData) {
    if (data.authenticated) {
      localStorage.setItem("authData", JSON.stringify(data));
    } else {
      localStorage.removeItem("authData");
    }

    setAuthDataState(data);
  }

  async function checkAuth() {
    if (!authData.authenticated) return;
    try {
      setClusterInfo(await getInfoApi({
        endpoint: authData.endpoint,
        username: authData.user,
        password: authData.password,
        token: authData?.token,
      }));
    } catch (error) {
      if (!authData.token && isAxiosError(error) && error.response?.status === 401) {
        setAuthData({
          user: "",
          password: "",
          endpoint: "",
          authenticated: false,
          egiSession: undefined,
        });
      } else {
        console.error("Unable to verify the saved session", error);
      }
    }
  }

  useEffect(() => {
    checkAuth();
  }, [initialData]);

  return (
    <AuthContext.Provider
      value={{
        authData,
        setAuthData,
        refreshSystemConfig,
        systemConfig,
        clusterInfo,
      }}
    >
      {children}
      <Dialog
        open={isSessionExpired}
        onOpenChange={(open) => {
          if (open) setIsSessionExpired(true);
        }}
      >
        <DialogContent
          className="sm:max-w-[425px]"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Sesión caducada
            </DialogTitle>
            <DialogDescription>
              Tu sesión ha caducado. Debes iniciar sesión de nuevo para
              continuar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => {
                setIsSessionExpired(false);
                window.location.hash = "/login";
              }}
            >
              Ir al inicio de sesión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
