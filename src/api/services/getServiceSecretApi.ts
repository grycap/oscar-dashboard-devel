import axios from "axios";

async function getServiceSecretApi(serviceName: string, secretName: string): Promise<string> {
  const response = await axios.get(`/system/services/${serviceName}/secrets`, {
    params: {
      key: secretName,
    },
  });

  return response.data as string;
}

export default getServiceSecretApi;
