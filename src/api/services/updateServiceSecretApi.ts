import axios from "axios";

async function updateServiceSecretApi(serviceName: string, secret: Record<string, string>): Promise<string> {
  const response = await axios.put(`/system/services/${serviceName}/secrets`, {
    data: secret
  });

  return response.data as string;
}

export default updateServiceSecretApi;
