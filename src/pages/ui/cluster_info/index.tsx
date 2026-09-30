import { useEffect, useState, type ReactNode } from "react";
import { Box, ClipboardList, Cpu, Gpu, Layers, LoaderPinwheel, MemoryStick, Server, XCircle } from "lucide-react";
import GenericTopbar from "@/components/Topbar";
import ExpandCard from "@/components/ExpandCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorAlert } from "@/components/ErrorAlert";
import { useAuth } from "@/contexts/AuthContext";
import getStatusApi from "@/api/status/getStatusApi";
import { ClusterStatus } from "@/models/clusterStatus";
import OscarColors from "@/styles";
import ClusterUseGraph from "./components/ClusterUseGraph";
import StatusMetricCard from "./components/StatusMetricCard";

const formatBytes = (bytes: number) => (bytes / 1024 ** 3).toFixed(1) + " GB";
const formatCores = (millicores: number) => (millicores / 1000).toFixed(2) + " cores";
const usagePercentage = (used: number, capacity: number) =>
  capacity > 0 ? Math.min(Math.max(Math.round((used / capacity) * 100), 0), 100) : undefined;

function StatusSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="mb-4 border-l-4 border-[#009688] pl-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Cluster() {
  const { authData } = useAuth();
  const isAdmin = authData.user === "oscar";
  const [clusterStatusData, setClusterStatusData] = useState<ClusterStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    document.title = "OSCAR - Status";
  }, []);

  async function fetchData() {
    setLoading(true);
    setError(false);
    try {
      setClusterStatusData(await getStatusApi());
    } catch (fetchError) {
      console.error("Error fetching status:", fetchError);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  const status = clusterStatusData;
  const nodes = status?.cluster.nodes ?? [];
  const readyNodes = nodes.filter((node) => node.status === "Ready").length;
  const cpuTotal = nodes.reduce((total, node) => total + node.cpu.capacity_cores, 0);
  const cpuUsed = nodes.reduce((total, node) => total + node.cpu.usage_cores, 0);
  const memoryTotal = nodes.reduce((total, node) => total + node.memory.capacity_bytes, 0);
  const memoryUsed = nodes.reduce((total, node) => total + node.memory.usage_bytes, 0);
  const cpuFree = status?.cluster.metrics.cpu.total_free_cores ?? 0;
  const memoryFree = status?.cluster.metrics.memory.total_free_bytes ?? 0;

  return (
    <div className="flex h-full w-full flex-col">
      <GenericTopbar defaultHeader={{ title: "Status", linkTo: "/ui/status" }} refresher={fetchData} />
      {loading ? (
        <div className="flex h-full items-center justify-center">
          <LoaderPinwheel className="animate-spin" size={60} color={OscarColors.Green3} />
        </div>
      ) : error || !status ? (
        <div className="flex h-full items-center justify-center px-4">
          <ErrorAlert title="Status unavailable" description="Cluster status could not be loaded." variant="warning" icon={XCircle} />
        </div>
      ) : status.cluster.nodes_count < 0 ? (
        <div className="flex h-full items-center justify-center px-4">
          <ErrorAlert title="Version not supported" description="The current OSCAR cluster version is not compatible with this dashboard. Please upgrade the cluster or contact your administrator." variant="warning" icon={XCircle} />
        </div>
      ) : (
        <div className="mx-auto w-full space-y-6 px-4 pb-6 pt-6">
          <StatusSection title="Current status">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              <StatusMetricCard
                icon={<Server size={18} />}
                label="Nodes ready"
                value={readyNodes + " / " + status.cluster.nodes_count}
                warning={status.cluster.nodes_count === 0 || readyNodes !== status.cluster.nodes_count}
              />
              <StatusMetricCard
                icon={<Layers size={18} />}
                label="OSCAR deployment"
                value={<Badge variant={status.oscar.ready ? "success" : "destructive"}>{status.oscar.ready ? "Ready" : "Not ready"}</Badge>}
                warning={!status.oscar.ready}
              />
              {isAdmin && (
                <StatusMetricCard
                  icon={<Box size={18} />}
                  label="Failed service pods"
                  value={status.oscar.pods.states.Failed}
                  warning={status.oscar.pods.states.Failed > 0}
                />
              )}
            </div>
          </StatusSection>

          <StatusSection title="Cluster resources">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              <StatusMetricCard
                icon={<Cpu size={18} />}
                label="Free CPU"
                value={formatCores(cpuFree)}
                detail={
                  <>
                    <div>Used: {formatCores(cpuUsed)} of {formatCores(cpuTotal)}</div>
                    <div>Max free on one node: {formatCores(status.cluster.metrics.cpu.max_free_on_node_cores)}</div>
                  </>
                }
                percentage={usagePercentage(cpuUsed, cpuTotal)}
                warning={cpuTotal > 0 && cpuFree / cpuTotal <= 0.3}
              />
              <StatusMetricCard
                icon={<MemoryStick size={18} />}
                label="Free memory"
                value={formatBytes(memoryFree)}
                detail={
                  <>
                    <div>Used: {formatBytes(memoryUsed)} of {formatBytes(memoryTotal)}</div>
                    <div>Max free on one node: {formatBytes(status.cluster.metrics.memory.max_free_on_node_bytes)}</div>
                  </>
                }
                percentage={usagePercentage(memoryUsed, memoryTotal)}
                warning={memoryTotal > 0 && memoryFree / memoryTotal <= 0.4}
              />
              <StatusMetricCard icon={<Gpu size={18} />} label="Total GPUs" value={status.cluster.metrics.gpu.total_gpu} />
            </div>
          </StatusSection>

          <StatusSection title={"Nodes (" + nodes.length + ")"}>
            {nodes.map((node) => {
              const cpuUsage = usagePercentage(node.cpu.usage_cores, node.cpu.capacity_cores);
              const memoryUsage = usagePercentage(node.memory.usage_bytes, node.memory.capacity_bytes);
              return (
                <ExpandCard title={node.name} className="w-full" key={node.name} defaultExpanded>
                  <CardContent className="space-y-3 pt-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <StatusMetricCard
                        icon={<Server size={18} />}
                        label="Node status"
                        value={<Badge variant={node.status === "Ready" ? "success" : "destructive"}>{node.status}</Badge>}
                        warning={node.status !== "Ready"}
                      />
                      <StatusMetricCard
                        icon={<Cpu size={18} />}
                        label="CPU usage"
                        value={formatCores(node.cpu.usage_cores)}
                        detail={"Capacity: " + formatCores(node.cpu.capacity_cores)}
                        percentage={cpuUsage}
                        warning={cpuUsage !== undefined && cpuUsage >= 70}
                      />
                      <StatusMetricCard
                        icon={<MemoryStick size={18} />}
                        label="Memory usage"
                        value={formatBytes(node.memory.usage_bytes)}
                        detail={"Capacity: " + formatBytes(node.memory.capacity_bytes)}
                        percentage={memoryUsage}
                        warning={memoryUsage !== undefined && memoryUsage >= 60}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <StatusMetricCard icon={<Gpu size={18} />} label="GPU capacity" value={node.gpu} />
                      <StatusMetricCard
                        icon={<Layers size={18} />}
                        label="InterLink"
                        value={<Badge variant="secondary">{node.is_interlink ? "Enabled" : "Disabled"}</Badge>}
                      />
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-sm font-medium text-slate-600 dark:text-slate-300">Node conditions</div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {node.conditions.map((condition) => {
                              const isError = condition.type === "Ready" ? !condition.status : condition.status;
                              return <Badge key={condition.type} variant={isError ? "destructive" : "secondary"}>{condition.type}</Badge>;
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </ExpandCard>
              );
            })}
          </StatusSection>

          <StatusSection title="OSCAR">
            <ExpandCard title="Deployment" className="w-full" defaultExpanded>
              <CardContent className="grid grid-cols-1 gap-3 pt-4 md:grid-cols-2">
                <StatusMetricCard icon={<Layers size={18} />} label="Deployment name" value={status.oscar.deployment_name} />
                <StatusMetricCard
                  icon={<Server size={18} />}
                  label="Ready replicas"
                  value={status.oscar.deployment.ready_replicas + " / " + status.oscar.deployment.replicas}
                  detail={"Available: " + status.oscar.deployment.available_replicas}
                  warning={!status.oscar.ready}
                />
                <StatusMetricCard icon={<ClipboardList size={18} />} label="Created on" value={new Date(status.oscar.deployment.creation_timestamp).toLocaleString()} />
                <StatusMetricCard icon={<Layers size={18} />} label="Strategy" value={status.oscar.deployment.strategy} />
              </CardContent>
            </ExpandCard>
            {isAdmin && (
              <ExpandCard title="Pods and Jobs" className="w-full" defaultExpanded>
                <CardContent className="grid grid-cols-1 gap-3 pt-4 md:grid-cols-2">
                  <StatusMetricCard icon={<Box size={18} />} label="Total pods" value={status.oscar.pods.total} />
                  <StatusMetricCard icon={<ClipboardList size={18} />} label="Total jobs" value={status.oscar.jobs_count} />
                  <Card className="md:col-span-2">
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-slate-600 dark:text-slate-300">Pod states</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="secondary">Pending: {status.oscar.pods.states.Pending}</Badge>
                        <Badge variant="secondary">Running: {status.oscar.pods.states.Running}</Badge>
                        <Badge variant={status.oscar.pods.states.Failed > 0 ? "destructive" : "secondary"}>Failed: {status.oscar.pods.states.Failed}</Badge>
                        <Badge variant="secondary">Succeeded: {status.oscar.pods.states.Succeeded}</Badge>
                        <Badge variant={status.oscar.pods.states.Unknown > 0 ? "destructive" : "secondary"}>Unknown: {status.oscar.pods.states.Unknown}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </ExpandCard>
            )}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">Configuration and storage</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">OIDC</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 px-4 pb-4 pt-0">
                    <Badge variant={status.oscar.oidc.enabled ? "success" : "secondary"}>{status.oscar.oidc.enabled ? "Enabled" : "Disabled"}</Badge>
                    <div className="text-sm">
                      <div className="font-medium text-slate-600 dark:text-slate-300">Issuers</div>
                      {status.oscar.oidc.issuers.length ? status.oscar.oidc.issuers.map((issuer) => <div key={issuer} className="break-all">{issuer}</div>) : "N/A"}
                    </div>
                    <div className="text-sm">
                      <div className="font-medium text-slate-600 dark:text-slate-300">Authorized groups</div>
                      {status.oscar.oidc.groups.length ? status.oscar.oidc.groups.map((group) => <div key={group} className="break-all">{group}</div>) : "N/A"}
                    </div>
                  </CardContent>
                </Card>
                {isAdmin && (
                  <Card>
                    <CardHeader className="p-4">
                      <CardTitle className="text-lg">MinIO</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-3 px-4 pb-4 pt-0">
                      <div>
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-300">Total buckets</div>
                        <div className="mt-1 text-xl font-semibold">{status.minio.buckets_count}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-300">Total objects</div>
                        <div className="mt-1 text-xl font-semibold">{status.minio.total_objects}</div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </StatusSection>

          {isAdmin && (
            <StatusSection title="Usage history">
              <ClusterUseGraph />
            </StatusSection>
          )}
        </div>
      )}
    </div>
  );
}

export default Cluster;
