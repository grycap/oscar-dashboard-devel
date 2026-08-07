import { useAuth } from "@/contexts/AuthContext";
import { useMinio } from "@/contexts/Minio/MinioContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import InfoItem from "./components/InfoItem";
import InfoBooleanItem from "./components/InfoBooleanItem";
import InfoListItems from "./components/InfoListItems";
import { useEffect } from "react";
import { useMediaQuery } from "react-responsive";
import { useSidebar } from "@/components/ui/sidebar";
import env from "@/env";

function InfoView() {
  
  useEffect(() => {
    document.title ="OSCAR - Info"
  });
  const { authData, systemConfig, clusterInfo } = useAuth();
  const { endpoint, user, password, egiSession, token, refresh_token } = authData;
  const { providerInfo } = useMinio();
  const { open } = useSidebar();
  // 1976 is the width when flex wrap is applied with the sidebar open
  // 1824 is the width when flex wrap is applied with the sidebar closed
  const isBigScreen = useMediaQuery({maxWidth: open ? 1697 : 1824});

  if (!systemConfig) return null;
  if (!authData.authenticated) return null;

  return (
    <div className="container mx-auto min-w-[300px] space-y-6 py-6">
      <div className={cn(isBigScreen && "flex justify-center")}>
        <div className="w-full max-w-[700px] text-center sm:text-left">
          <h1 className="text-2xl font-semibold tracking-tight">
            Server information
          </h1>
        </div>
      </div>
      <div className={cn("flex w-full flex-wrap items-start gap-6", isBigScreen && "justify-center")}>
        <Card className="w-full max-w-[700px] overflow-hidden">
          <CardHeader className="bg-muted py-4">
            <CardTitle className="text-base font-medium">User</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            <InfoItem label="User" value={user} enableCopy />
            {token ? (
              <>
                <InfoItem label="Subject ID" value={egiSession?.sub! ?? egiSession?.sub!} enableCopy />
                <InfoItem
                  label="Access Token"
                  value={token}
                  isPassword
                  enableCopy
                />
                {refresh_token && (
                  <InfoItem
                    label="Refresh Token"
                    value={refresh_token}
                    isPassword
                    enableCopy
                  />
                )}
                {!refresh_token && egiSession?.sub.endsWith("@egi.eu") && (
                  <InfoItem label="Refresh Token" value={"Get EGI Refresh Token"} link={{ url: env.EGI_ISSUER.replace(/\.eu.*$/, '.eu')+"/token", enableRedirectIcon: true }} />
                )}
              </>
            ) : (
              <InfoItem label="Password" value={password} isPassword enableCopy />
            )}
          </CardContent>
        </Card>
        <Card className="w-full max-w-[700px] overflow-hidden">
          <CardHeader className="bg-muted py-4">
            <CardTitle className="text-base font-medium">OSCAR Cluster</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            <InfoItem label="Endpoint" value={endpoint} enableCopy link={{url: endpoint, enableRedirectIcon: true}} />
            {systemConfig.config.oidc_groups.length > 1 ? 
              <InfoListItems  label="Supported VOs" placeholder={systemConfig.config.oidc_groups[0] + '... '} values={systemConfig.config.oidc_groups} enableCopy />
              :
              <InfoItem label="Supported VOs" value={systemConfig.config.oidc_groups.toString()} enableCopy />
            }
            <InfoItem label="Version" value={clusterInfo?.version!} enableCopy />
            <InfoItem label="Git commit" value={clusterInfo?.git_commit! + "..."} link={{url: `https://github.com/grycap/oscar/commit/${clusterInfo?.git_commit!}`, enableRedirectIcon: true}} />
            <div className="flex justify-evenly p-4">
              <InfoBooleanItem
                label="GPU"
                enabled={Boolean(systemConfig?.config.gpu_available)}
              />

              <InfoBooleanItem
                label="InterLink"
                enabled={Boolean(systemConfig?.config.interLink_available)}
              />
              <InfoBooleanItem
                label="Yunikorn"
                enabled={Boolean(systemConfig?.config.yunikorn_enable)}
              />
            </div>
          </CardContent>
        </Card>
        <Card className="w-full max-w-[700px] overflow-hidden">
          <CardHeader className="bg-muted py-4">
            <CardTitle className="text-base font-medium">MinIO</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            <InfoItem label="Endpoint" value={providerInfo.endpoint} enableCopy link={{url: providerInfo.endpoint, enableRedirectIcon: true}} />
            <InfoItem
              label="Access key"
              value={providerInfo.access_key}
              enableCopy
            />
            <InfoItem
              label="Secret key"
              value={providerInfo.secret_key}
              isPassword
              enableCopy
            />
            <div className="flex justify-evenly p-4">
              <InfoBooleanItem
                label="SSL"
                enabled={Boolean(providerInfo.endpoint.includes("http://"))}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default InfoView;
