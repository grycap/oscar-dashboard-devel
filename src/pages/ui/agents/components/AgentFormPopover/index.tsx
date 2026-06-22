import createServiceApi from "@/api/services/createServiceApi";
import RequestButton from "@/components/RequestButton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useVolumes } from "@/contexts/Volumes/VolumesContext";
import { alert } from "@/lib/alert";
import { errorMessage } from "@/lib/error";
import { fetchFromGitHubOptions, generateReadableName, genRandomString, getAllowedVOs, isVersionLower } from "@/lib/utils";
import yamlToServices from "@/pages/ui/services/components/FDL/utils/yamlToService";
import useServicesContext from "@/pages/ui/services/context/ServicesContext";
import { Service } from "@/pages/ui/services/models/service";
import OscarColors from "@/styles";
import { Bot, RefreshCcwIcon } from "lucide-react";
import { useEffect, useState } from "react";

const HERMES_FDL_URL = "https://raw.githubusercontent.com/grycap/oscar-agents/refs/heads/main/agents/hermes-dashboard/fdl.yml";
const HERMES_SCRIPT_URL = "https://raw.githubusercontent.com/grycap/oscar-agents/refs/heads/main/agents/hermes-dashboard/script.sh";

async function fetchTemplateText(url: string, label: string) {
  const response = await fetch(url, fetchFromGitHubOptions);

  if (!response.ok) {
    throw Error(`Unable to fetch Hermes ${label}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

function AgentFormPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const { systemConfig, authData, clusterInfo } = useAuth();
  const { refreshServices } = useServicesContext();
  const { volumes, volumesAreLoading, updateVolumes } = useVolumes();
  const oidcGroups = getAllowedVOs(systemConfig, authData);

  function nameService() {
    return `hermes-${generateReadableName(6)}-${genRandomString(8).toLowerCase()}`;
  }

  const [formData, setFormData] = useState({
    name: "",
    cpuCores: "2.0",
    memoryRam: "2",
    memoryUnit: "Gi",
    volumeName: "",
    vo: "",
    providerName: "",
    baseUrl: "",
    model: "",
    apiKey: "",
  });

  const [errors, setErrors] = useState({
    name: false,
    cpuCores: false,
    memoryRam: false,
    volumeName: false,
    vo: false,
    providerName: false,
    baseUrl: false,
    model: false,
  });

  useEffect(() => {
    if (oidcGroups.length > 0 && !formData.vo) {
      setFormData((prev) => ({ ...prev, vo: oidcGroups[0] }));
    }
  }, [oidcGroups, formData.vo]);

  useEffect(() => {
    if (!isOpen) return;

    const serviceName = nameService();
    setFormData((prev) => ({
      ...prev,
      name: serviceName,
      cpuCores: "2.0",
      memoryRam: "2",
      memoryUnit: "Gi",
      volumeName: volumes[0]?.name ?? "",
      vo: oidcGroups[0] ?? "",
      providerName: "",
      baseUrl: "",
      model: "",
      apiKey: "",
    }));
    setErrors({
      name: false,
      cpuCores: false,
      memoryRam: false,
      volumeName: false,
      vo: false,
      providerName: false,
      baseUrl: false,
      model: false,
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    void updateVolumes();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || formData.volumeName || !volumes.length) return;
    setFormData((prev) => ({ ...prev, volumeName: volumes[0].name }));
  }, [isOpen, formData.volumeName, volumes]);

  function regenerateServiceName() {
    const serviceName = nameService();
    setFormData({
      ...formData,
      name: serviceName,
    });
  }

  const handleDeploy = async () => {
    const newErrors = {
      name: !formData.name,
      cpuCores: !formData.cpuCores,
      memoryRam: !formData.memoryRam,
      volumeName: !formData.volumeName,
      vo: !formData.vo,
      providerName: !formData.providerName,
      baseUrl: !formData.baseUrl,
      model: !formData.model,
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) {
      alert.error("Please fill in all required fields");
      return;
    }

    try {
      const [fdlText, scriptText] = await Promise.all([
        fetchTemplateText(HERMES_FDL_URL, "FDL"),
        fetchTemplateText(HERMES_SCRIPT_URL, "script"),
      ]);

      const services = yamlToServices(
        fdlText,
        scriptText,
        !!clusterInfo && !isVersionLower(clusterInfo.version, "v4.1.0")
      );
      if (!services?.length) throw Error("No services found");

      const service = services[0];
      const secrets = { ...service.environment.secrets };
      if (formData.apiKey.trim()) {
        secrets.OPENAI_API_KEY = formData.apiKey.trim();
      } else {
        delete secrets.OPENAI_API_KEY;
      }

      const modifiedService: Service = {
        ...service,
        name: formData.name,
        vo: formData.vo,
        cpu: formData.cpuCores,
        memory: `${formData.memoryRam}${formData.memoryUnit}`,
        volume: {
          ...service.volume,
          name: formData.volumeName,
          mount_path: "/opt/data",
        },
        environment: {
          variables: {
            ...service.environment.variables,
            HERMES_PORT: "9119",
            HERMES_HOST: "0.0.0.0",
            HERMES_DATA_DIR: "/opt/data",
            HERMES_DASHBOARD_TUI: "true",
            HERMES_DASHBOARD_INSECURE: "true",
            LLM_PROVIDER_NAME: formData.providerName,
            OPENAI_BASE_URL: formData.baseUrl,
            OPENAI_MODEL: formData.model,
          },
          secrets,
        },
        labels: {
          ...service.labels,
          oscar_agent: "true",
          oscar_agent_type: "hermes-dashboard",
        },
        expose: {
          ...service.expose,
          min_scale: 1,
          max_scale: 1,
          api_port: [9119],
          cpu_threshold: 90,
          rewrite_target: false,
          set_auth: true,
          auth_type: "forward",
          health_path: "/api/status",
          probe_mode: "direct",
        },
      };

      await createServiceApi(modifiedService);
      refreshServices();

      alert.success("Hermes Agent dashboard deployed");
      setIsOpen(false);
    } catch (error) {
      alert.error(`Error deploying Hermes Agent dashboard: ${errorMessage(error)}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="mainGreen"
          tooltipLabel="New Agent Instance"
          onClick={() => { setIsOpen(false); }}
        >
          <Bot size={20} className="mr-2" />
          New
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[620px] max-h-[90%] gap-4 flex flex-col">
        <DialogHeader>
          <DialogTitle>
            <span style={{ color: OscarColors.DarkGrayText }}>
              Hermes Agent Dashboard Configuration
            </span>
          </DialogTitle>
        </DialogHeader>
        <hr />
        <div className="grid grid-cols-1 gap-y-3 sm:gap-x-2 overflow-y-auto pr-1">
          <div>
            <div className="flex flex-row items-center">
              <Label>Service name</Label>
              <Button variant="link" size="icon" onClick={regenerateServiceName}>
                <RefreshCcwIcon size={16}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "rotate(90deg)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "rotate(0deg)"; }}
                />
              </Button>
            </div>
            <Input
              id="name"
              placeholder="Enter service name"
              value={formData.name}
              className={errors.name ? "border-red-500 focus:border-red-500" : ""}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: false });
              }}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-end">
            <div>
              <Label htmlFor="cpu-cores">CPU Cores</Label>
              <Input
                id="cpu-cores"
                type="number"
                step={0.1}
                value={formData.cpuCores}
                className={errors.cpuCores ? "border-red-500 focus:border-red-500" : ""}
                onChange={(e) => {
                  setFormData({ ...formData, cpuCores: e.target.value });
                  if (errors.cpuCores) setErrors({ ...errors, cpuCores: false });
                }}
              />
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
              <div>
                <Label htmlFor="memory-ram">RAM</Label>
                <Input
                  id="memory-ram"
                  type="number"
                  step={formData.memoryUnit === "Gi" ? 1 : 256}
                  value={formData.memoryRam}
                  className={errors.memoryRam ? "border-red-500 focus:border-red-500" : ""}
                  onChange={(e) => {
                    setFormData({ ...formData, memoryRam: e.target.value });
                    if (errors.memoryRam) setErrors({ ...errors, memoryRam: false });
                  }}
                />
              </div>
              <Select
                value={formData.memoryUnit}
                onValueChange={(value) => setFormData({ ...formData, memoryUnit: value })}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue id="memory-unit" placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gi">Gi</SelectItem>
                  <SelectItem value="Mi">Mi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-end">
            <div>
              <Label htmlFor="vo">VO</Label>
              <Select
                value={formData.vo}
                onValueChange={(value) => {
                  setFormData({ ...formData, vo: value });
                  if (errors.vo) setErrors({ ...errors, vo: false });
                }}
              >
                <SelectTrigger id="vo" className={errors.vo ? "border-red-500 focus:border-red-500" : ""}>
                  <SelectValue placeholder="Select a VO" />
                </SelectTrigger>
                <SelectContent>
                  {oidcGroups.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="volume-name">Volume name</Label>
              <Select
                value={formData.volumeName}
                disabled={volumesAreLoading || volumes.length === 0}
                onValueChange={(value) => {
                  setFormData({ ...formData, volumeName: value });
                  if (errors.volumeName) setErrors({ ...errors, volumeName: false });
                }}
              >
                <SelectTrigger id="volume-name" className={errors.volumeName ? "border-red-500 focus:border-red-500" : ""}>
                  <SelectValue placeholder={volumesAreLoading ? "Loading volumes..." : "Select a volume"} />
                </SelectTrigger>
                <SelectContent>
                  {volumes.length > 0 ? (
                    volumes.map((volume) => (
                      <SelectItem key={volume.name} value={volume.name}>
                        {volume.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-volumes" disabled>
                      No volumes available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-end">
            <div>
              <Label htmlFor="provider-name">Provider name</Label>
              <Input
                id="provider-name"
                placeholder="YOUR_LLM_PROVIDER_NAME"
                value={formData.providerName}
                className={errors.providerName ? "border-red-500 focus:border-red-500" : ""}
                onChange={(e) => {
                  setFormData({ ...formData, providerName: e.target.value });
                  if (errors.providerName) setErrors({ ...errors, providerName: false });
                }}
              />
            </div>
            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                placeholder="YOUR_OPENAI_MODEL"
                value={formData.model}
                className={errors.model ? "border-red-500 focus:border-red-500" : ""}
                onChange={(e) => {
                  setFormData({ ...formData, model: e.target.value });
                  if (errors.model) setErrors({ ...errors, model: false });
                }}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="base-url">OpenAI-compatible base URL</Label>
            <Input
              id="base-url"
              placeholder="YOUR_OPENAI_BASE_URL"
              value={formData.baseUrl}
              className={errors.baseUrl ? "border-red-500 focus:border-red-500" : ""}
              onChange={(e) => {
                setFormData({ ...formData, baseUrl: e.target.value });
                if (errors.baseUrl) setErrors({ ...errors, baseUrl: false });
              }}
            />
          </div>
          <div>
            <Label htmlFor="api-key">API key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Leave empty to configure Hermes later"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <RequestButton className="grid grid-cols-[auto] sm:grid-cols-1 gap-2" variant="mainGreen" request={handleDeploy}>
            Deploy
          </RequestButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AgentFormPopover;
