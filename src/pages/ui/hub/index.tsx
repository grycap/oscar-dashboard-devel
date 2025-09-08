import { useEffect, useState } from "react";
import HubCard from "./components/HubCard/index";
import parseROCrateDataJS, { RoCrateServiceDefinition } from "@/lib/roCrate";
import { useAuth } from "@/contexts/AuthContext";
import { alert } from "@/lib/alert";
import { Input } from "@/components/ui/input";
import { Copy, Filter, LayoutGrid, LayoutList, Search } from "lucide-react";
import { Select, SelectContent, SelectTrigger } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { SelectIcon } from "@radix-ui/react-select";
import GenericTable from "@/components/Table";
import { Card, CardContent } from "@/components/ui/card";
import { Service } from "../services/models/service";
import yamlToServices from "../services/components/FDL/utils/yamlToService";
import HubServiceConfPopover from "./components/HubServiceConfPopover";
import { Button } from "@/components/ui/button";

export interface ServiceWithRoCrate extends RoCrateServiceDefinition {
  dockerImage: string;
  service: Service;
}

function HubView() {
  const [filteredServices, setFilteredServices] = useState<ServiceWithRoCrate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const authContext = useAuth();
  const [filter, setFilter] = useState<{serviceType: string}>({serviceType: "" });
  const [serviceList, setServiceList] = useState<ServiceWithRoCrate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGridView, setIsGridView] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setServiceList([]);
      const roCrateServices = await parseROCrateDataJS("grycap", "oscar-hub", "main");
      const services: ServiceWithRoCrate[] = [];
      
      for (const roCrateServiceDef of roCrateServices) {
        const response = await fetch(roCrateServiceDef.fdlUrl);
        if (response.ok) {
          const service = yamlToServices(await response.text(), "")![0];
          services.push({ 
            ...roCrateServiceDef, // Spread all properties from RoCrateServiceDefinition
            dockerImage: service.image ? service.image : "", // Add dockerImage property
            service
          });
        }
      }
      setServiceList(services);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  // Filter services based on search query
  useEffect(() => {
    if (!searchQuery.trim() && !filter.serviceType) {
      setFilteredServices(serviceList);
    } else {
      const filtered = serviceList.filter(( service ) => {
        const query = searchQuery.toLowerCase();
        return (
          service.name.toLowerCase().includes(query) && 
          (!filter.serviceType || service.type === filter.serviceType)
        );
      });
      setFilteredServices(filtered);
    }
  }, [searchQuery, serviceList, filter]);

  return (
    <>
      <div className="grid grid-cols-1 gap-6 w-[95%] sm:w-[90%] lg:w-[80%] mx-auto mt-[40px] min-w-[300px] max-w-[1600px] content-start">
        <div className="text-center sm:text-left" >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <h1 className="" style={{ fontSize: "24px", fontWeight: "500" }}>OSCAR Hub</h1>
            <div className="grid grid-cols-1 xl:grid-cols-[auto_auto] text-md text-decoration-underline-hover"
                onClick={() => {
                        navigator.clipboard.writeText(authContext.authData.endpoint);
                        alert.success("Endpoint copied to clipboard");
                      }}
                style={{
                  cursor: "pointer",
                }}
            >
              <div className="truncate">
                {`${authContext.authData.user} -\u00A0`}
              </div>
              <div className="flex flex-row items-center justify-center gap-2 truncate">
                {`${authContext.authData.endpoint}`}
                <Copy className="h-4 w-4" />
              </div>
            </div>
          </div>
          <p className="text-gray-600">
            A collection of services ready to be deployed in OSCAR.
          </p>
        </div>

        <div className="grid grid-cols-[auto_auto_1fr] w-full -mb-3 gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant={isGridView ? "mainGreen" : "outline"}
              size="sm"
              onClick={() => setIsGridView(true)}
            >
              <LayoutGrid size={16} />
            </Button>
            <Button
              variant={!isGridView ? "mainGreen" : "outline"}
              size="sm"
              onClick={() => setIsGridView(false)}
            >
              <LayoutList size={16} />
            </Button>
          </div>
          <Select
          >
            <SelectTrigger className="w-max">
              <SelectIcon>
                <Filter size={16} className="mr-2" />

              </SelectIcon>
            </SelectTrigger>

            <SelectContent>
              <div className="flex flex-row gap-2 items-center p-2">
                <Checkbox
                  id="asyncServices"
                  checked={filter.serviceType === "asynchronous"}
                  onCheckedChange={(checked) => {
                    setFilter((prev) => ({
                      ...prev,
                      serviceType: checked ? "asynchronous" : "",
                    }));
                  }}
                  style={{ fontSize: 16 }}
                />
                <label
                  htmlFor="asyncServices"
                  style={{ fontSize: 14}}
                >Async. Services</label>
              </div>
              <div className="flex flex-row gap-2 items-center p-2">
                <Checkbox
                  id="syncServices"
                  checked={filter.serviceType === "synchronous"}
                  onCheckedChange={(checked) => {
                    setFilter((prev) => ({
                      ...prev,
                      serviceType: checked ? "synchronous" : "",
                    }));
                  }}
                  style={{ fontSize: 16 }}
                />
                <label
                  htmlFor="syncServices"
                  style={{ fontSize: 14}}
                >Sync. Services</label>
              </div>
            </SelectContent>
          </Select>
          <Input
            placeholder="Search services by name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            endIcon={<Search size={16} />}
          />
        </div>
        
        {isLoading ? 
        (<div className="w-full text-center py-8">
          <p className="text-gray-500 text-lg">
            Loading services...
          </p>
        </div>
        ) :
        (
        <>
          {isGridView ?
          <div className="flex flex-wrap gap-1 justify-center sm:justify-start gap-6">
            {filteredServices.length > 0 ? (
              filteredServices.map((service, index) => (
                <HubCard key={index} { ...service } />
              ))
            ) : (
              <div className="w-full text-center py-8">
                <p className="text-gray-500 text-lg">
                  {searchQuery.trim() 
                    ? `No services found matching "${searchQuery}"`
                    : "No services available"
                  }
                </p>
                {searchQuery.trim() && (
                  <p className="text-gray-400 text-sm mt-2">
                    Try searching with different keywords or clear the search to see all services.
                  </p>
                )}
              </div>
            )}
          </div>
          :
          <div>
          <Card>
            <CardContent className="pt-2 flex flex-col max-h-[65vh]">
              <GenericTable<ServiceWithRoCrate>
                data={filteredServices}
                idKey="name"
                columns={[
                { 
                  header: "Name", 
                  accessor: "name",
                  sortBy: "name"
                },
                {
                  header: "Type",
                  accessor: "type",
                  sortBy: "type"
                },
                { 
                  header: "Docker Image",
                  accessor: "dockerImage",
                  sortBy: "dockerImage"
                }
                ]}
                actions={[
                  {
                    button: (item) => {
                      return (
                      <HubServiceConfPopover
                          className=""
                          area-hidden={false}
                          variant={"mainGreen"}
                          roCrateServiceDef={item} service={item.service!}
                        />
                      )
                    },
                  },
                ]}
              />
            </CardContent>
          </Card>
          </div>
          }
        </>
        )}
    </div>
  </>
  );
}

export default HubView;
