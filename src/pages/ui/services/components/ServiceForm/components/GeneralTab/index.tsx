import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import useServicesContext from "@/pages/ui/services/context/ServicesContext";
import {
  LOG_LEVEL,
  Service,
  ServiceVisibility,
} from "@/pages/ui/services/models/service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import EnviromentVariables from "./components/EnviromentVariables";
import ServiceFormCell from "../FormCell";
import InlineFDLEditor from "./components/InlineFDLEditor";
import { CheckIcon, CopyIcon, XIcon, ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { alert } from "@/lib/alert";
import Divider from "@/components/ui/divider";
import { Label } from "@/components/ui/label";
import { ServiceViewMode } from "../../../Topbar";
import InputOutputEditor from "../InputOutputTab";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import EnviromentSecrets from "./components/EnviromentSecrets";
import Annotations from "./components/Annotations";

import { AllowedUsersPopover } from "./components/AllowedUsersPopover";
import { downloadString, getAllowedVOs, getExposedServiceUrl, getFDLAndScriptText } from "@/lib/utils";
import { useEffect } from "react";

function ServiceGeneralTab() {
  const { formService, setFormService, formMode, formFunctions } =
    useServicesContext();

  const { handleChange, onBlur, errors } = formFunctions;
  const { systemConfig, authData } = useAuth();
  const voGroups = getAllowedVOs(systemConfig, authData);
  function voGroupsIsEmpthy(){
    if( voGroups === undefined){ return true}
    else if (JSON.stringify(voGroups) === '[""]'){ return true}
    else {return false}
  } 
  
  const selectedVo = formService?.vo ?? "";
  const selectedLogLevel = formService?.log_level ?? LOG_LEVEL.INFO;
  const memoryUnits =
    (formService?.memory?.replace(/[0-9]/g, "") as "Mi" | "Gi" | "") ||
    "Mi";
  const memory = formService?.memory?.replace(/[a-zA-Z]/g, "") ?? "";

  const setAllowedUsers = (users: string[]) => {
    setFormService((prev) => ({
      ...prev,
      allowed_users: users
    }));
  };
const serviceToDownload = getFDLAndScriptText(formService)
  

  const visibility = formService?.visibility ?? ServiceVisibility.private;
  const serviceIsRestricted = visibility === ServiceVisibility.restricted;

  useEffect(() => {
    if (!formService) return;
  }, [formService]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
      }}
    >
      <ServiceFormCell title="General Settings">
        <div className="grid grid-cols-1 gap-[10px] w-full max-w-5xl min-w-[720px]">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 items-end w-full">
            <div className="col-span-1">
              <Input
                id="service-name-input"
                flex={1}
                value={formService?.name}
                onChange={(e) => {
                  handleChange(e, "name");
                }}
                label="Service name"
                error={errors.name}
                onBlur={() => onBlur("name")}
                required
                disabled={formMode === ServiceViewMode.Update}
                className="disabled:bg-gray"
              />
            </div>
            <div className="col-span-1 lg:col-span-2">
              {formService?.image && (
                <Input
                  id="docker-image-input"
                  flex={2}
                  value={formService?.image}
                  label="Docker image"
                  onChange={(e) => {
                    handleChange(e, "image");
                  }}
                  error={errors.image}
                  onBlur={() => onBlur("image")}
                  required
                />
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-[auto_auto_auto_1fr] gap-5 items-end w-full">
            <div className="min-w-[154px]">
              {voGroupsIsEmpthy() ?
               <></>
                  :
              <>
                <Label>VO</Label>
                <Select
                  value={selectedVo}
                  onValueChange={(value) => {
                    setFormService((service: Service) => {
                      return {
                        ...service,
                        vo: value,
                      };
                    });
                  }}
                >
                  <SelectTrigger id="vo-select-trigger">
                    <SelectValue placeholder="Select a VO" />
                  </SelectTrigger>
                  <SelectContent>
                    {voGroups?.map((vo) => {
                      return (
                        <SelectItem key={vo} value={vo}>
                          {vo}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </>
              }
              
            </div>

            <div className="min-w-[152px]">
              <Label>Log level</Label>
              <Select
                value={selectedLogLevel}
                onValueChange={(value) => {
                  setFormService((service: Service) => {
                    return {
                      ...service,
                      log_level: value as LOG_LEVEL,
                    };
                  });
                }}
              >
                <SelectTrigger id="log-level-select-trigger">
                  <SelectValue placeholder="Log level" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(LOG_LEVEL).map((value) => {
                    return (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[152px]">
              <Label>Visibility</Label>
              <Select
                value={visibility}
                onValueChange={(value: ServiceVisibility) => {
                  setFormService((service: Service) => {
                    return {
                      ...service,
                      visibility: value,
                      allowed_users:
                        value === ServiceVisibility.restricted
                          ? service.allowed_users
                          : [],
                    };
                  });
                }}
              >
                <SelectTrigger id="visibility-select-trigger">
                  <SelectValue placeholder="Visibility" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ServiceVisibility).map((value) => {
                    return (
                      <SelectItem key={value} value={value}>
                        {value.toUpperCase()}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            {formService.token && (
              <div 
               className="col-span-1"
              >
                <div className="grid grid-cols-[1fr_auto] items-end w-full">
                  <Input
                    id="token-input"
                    value={formService?.token}
                    readOnly
                    label="Token"
                    type="password"
                  />
                  <Button
                    id="copy-token-button"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(formService?.token || "");
                      alert.success("Token copied to clipboard");
                    }}
                  >
                    <CopyIcon size={20}/>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {formMode === ServiceViewMode.Update && (
            <div
              style={{
                marginTop: 10,
                display: "flex",
                flexDirection: "row",
                gap: 50,
              }}
            >
              <div className="flex flex-row gap-2 items-center">
                <strong>Exposed:</strong>
                {(formService.expose?.api_port || formService.kserve) ? (
                  <Link
                    to={getExposedServiceUrl(authData.endpoint, formService.name, "", systemConfig?.config)}
                    target="_blank"
                  >
                    <ExternalLink size={18} />
                  </Link>
                ) : (
                  <XIcon size={16} className="pt-[2px]" />
                )}
              </div>
              <div className="flex flex-row gap-2 items-center">
                <strong>Alpine:</strong>
                {formService.alpine ? (
                  <CheckIcon size={16} />
                ) : (
                  <XIcon size={16} className="pt-[2px]" />
                )}
              </div>

              <div className="flex flex-row gap-2 items-center">
                <strong>Interlink:</strong>
                {formService.interlink_node_name ? (
                  formService.interlink_node_name
                ) : (
                  <XIcon size={16} className="pt-[2px]" />
                )}
              </div>
              {serviceIsRestricted && (
                <div className="flex flex-row gap-2 items-center">
                  <strong>Allowed users:</strong>
                  <AllowedUsersPopover
                    allowed_users={formService.allowed_users ?? []}
                    setAllowedUsersInExternalVar={setAllowedUsers}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </ServiceFormCell>
      <Divider />
      {formService?.image && <ServiceFormCell title="Service Resources">
        <div className="grid grid-cols-1 gap-5 w-full max-w-6xl min-w-[720px]">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 w-full max-w-5xl min-w-[720px] ">
            <div className="grid grid-cols-[150px_150px_150px] gap-[10px] items-end">
              <Input
                id="cpu-input"
                value={formService?.cpu}
                onChange={(e) => {
                  handleChange(e, "cpu");
                }}
                label="CPU cores"
                error={errors.cpu}
                type="number"
                step="0.1"
              />
              <Input
                id="memory-input"
                value={memory}
                label="Memory"
                onChange={(e) => {
                  setFormService((service: Service) => {
                    return {
                      ...service,
                      memory: e.target.value + memoryUnits,
                    };
                  });
                }}
                type="number"
                error={errors.memory}
              />
              <Select
                value={memoryUnits}
                onValueChange={(value) => {
                  setFormService((service: Service) => {
                    return {
                      ...service,
                      memory: memory + value,
                    };
                  });
                }}
              >
                <SelectTrigger id="memory-units-select" className="w-[75px]">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mi">Mi</SelectItem>
                  <SelectItem value="Gi">Gi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </ServiceFormCell>
      }
      {formService?.kserve && formMode === ServiceViewMode.Update && (
        <div>
          <Divider />
          <ServiceFormCell title="Serving Model">
            <Card className="w-full max-w-5xl overflow-hidden border-slate-200 shadow-sm dark:border-slate-800">
              <CardHeader className="border-b border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-semibold">
                      {formService.kserve.type === "llm_inference" ? "LLM Inference" : "Inference"}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Model configuration
                    </CardDescription>
                  </div>
                  <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    Read only
                  </span>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-x-8 gap-y-5 p-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <p className="mb-1 text-sm font-medium text-slate-600 dark:text-slate-400">Model source URI</p>
                  <p className="break-all rounded-md bg-slate-50 px-3 py-2 font-mono text-sm text-slate-900 dark:bg-slate-900 dark:text-slate-100">
                    {formService.kserve.storage_uri || "Not specified"}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="mb-1 text-sm font-medium text-slate-600 dark:text-slate-400">Runtime image</p>
                  <p className="break-all text-sm text-slate-900 dark:text-slate-100">
                    {formService.kserve.type === "inference"
                      ? formService.kserve.inference?.runtime_image || "Default"
                      : formService.kserve.llm_inference?.runtime_image || "Default"}
                  </p>
                </div>
                {formService.kserve.type === "inference" && (
                  <>
                    <div>
                      <p className="mb-1 text-sm font-medium text-slate-600 dark:text-slate-400">Model format</p>
                      <p className="text-sm text-slate-900 dark:text-slate-100">
                        {formService.kserve.inference?.model_format || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-sm font-medium text-slate-600 dark:text-slate-400">API version</p>
                      <p className="text-sm text-slate-900 dark:text-slate-100">
                        {formService.kserve.inference?.api_version || "Not specified"}
                      </p>
                    </div>
                  </>
                )}
                <div>
                  <p className="mb-1 text-sm font-medium text-slate-600 dark:text-slate-400">Replicas (min / max)</p>
                  <p className="text-sm text-slate-900 dark:text-slate-100">
                    {formService.kserve.min_scale ?? "—"} / {formService.kserve.max_scale ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-sm font-medium text-slate-600 dark:text-slate-400">Resources</p>
                  <p className="text-sm text-slate-900 dark:text-slate-100">
                    CPU: {formService.kserve.cpu || "—"} · Memory: {formService.kserve.memory || "—"}
                  </p>
                </div>
                {Boolean(formService.kserve.args?.length) && (
                  <div className="sm:col-span-2">
                    <p className="mb-1 text-sm font-medium text-slate-600 dark:text-slate-400">Runtime arguments</p>
                    <p className="break-words font-mono text-sm text-slate-900 dark:text-slate-100">
                      {formService.kserve.args?.join(" ")}
                    </p>
                  </div>
                )}
                <div className="sm:col-span-2 flex flex-wrap gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    GPU: {formService.kserve.enable_gpu ? "Enabled" : "Disabled"}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    Authentication: {formService.kserve.set_auth ? "Required" : "Not required"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </ServiceFormCell>
        </div>
      )}
      <Divider />
      <ServiceFormCell title="FDL / Script">
        { (
          <div className="grid gap-5 w-full max-w-6xl min-w-[720px]">
            <InlineFDLEditor mode={formMode === ServiceViewMode.Create ? "inline-edit" : "api"} />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-600 dark:text-slate-300">
                Download the service files for review or backup.
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <Button
                  className="w-full sm:w-auto flex flex-row gap-2 items-center justify-center"
                  variant="secondary"
                  onClick={() => {downloadString(serviceToDownload.fdlText, `${formService.name}.yaml`, "application/yaml")}}
                >
                  <Download size={16} />
                  Download FDL
                </Button>
                <Button
                  className="w-full sm:w-auto flex flex-row gap-2 items-center justify-center"
                  variant="secondary"
                  onClick={() => {downloadString(serviceToDownload.scriptText, `${formService.name}-script.sh`)}}
                >
                  <Download size={16} />
                  Download script
                </Button>
              </div>
            </div>
          </div>
        )}
      </ServiceFormCell>
      <Divider />
      {formService?.image && 
      <div>
      <ServiceFormCell title="Annotations">
        <Annotations />
      </ServiceFormCell>
      <Divider />
      <div className="grid grid-cols-1 2xl:grid-cols-2 w-ful max-w-[1250px] min-w-[720px]">
        <div className="2xl:border-r-2 border-b-2 2xl:border-b-0">
          <ServiceFormCell title="Environment variables">
            <EnviromentVariables />
          </ServiceFormCell>
        </div>
        <ServiceFormCell title="Environment secrets">
          <EnviromentSecrets />
        </ServiceFormCell>
      </div>
      <Divider />
      <InputOutputEditor />
      </div>
      }
    </div>
  );
}

export default ServiceGeneralTab;
