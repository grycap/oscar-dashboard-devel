import { Service } from "@/pages/ui/services/models/service";
import axios from "axios";
import normalizeServicePayload from "./normalizeServicePayload";

async function updateServiceApi(service: Service) {
  const response = await axios.put(
    "/system/services",
    normalizeServicePayload(service)
  );

  return response.data;
}

export default updateServiceApi;
