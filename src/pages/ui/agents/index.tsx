import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import IntegratedApp from "@/components/IntegratedApp";
import useServicesContext from "../services/context/ServicesContext";
import AgentFormPopover from "./components/AgentFormPopover";

function AgentsView() {
  const { authData } = useAuth();
  const { services } = useServicesContext();

  const ownerName = authData?.egiSession?.sub ?? authData?.token ?? (authData?.user === "oscar" ? "cluster_admin" : authData?.user);
  const agentServices = services.filter(
    (service) =>
      (service.owner === ownerName || ownerName === "cluster_admin") &&
      service.labels?.oscar_agent === "true"
  );

  useEffect(() => {
    document.title = "OSCAR - Agents";
  }, []);

  return (
    <div className="flex flex-col h-full w-full">
      <IntegratedApp
        appName="Agents"
        deployedServiceEndpoint={authData.endpoint}
        filteredServices={agentServices}
        DeployInstancePopover={AgentFormPopover}
        additionalExposedPathArgs="?token={{service.token}}"
        healthcheckPath="/api/status"
      />
    </div>
  );
}

export default AgentsView;
