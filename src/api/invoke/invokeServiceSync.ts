import axios from "axios";
import type { AxiosInstance } from "axios";

interface InvokeServiceSyncProps {
  serviceName: string;
  file: File;
  token: string;
  endpoint: string;
}

function readFile(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      if (e.target?.result) {
        const base64Data = e.target.result as string;
        resolve(base64Data);
      }
    };

    reader.onerror = () => {
      reject(new Error("Error reading file."));
    };

    reader.readAsBinaryString(file);
  });
}

export default async function invokeServiceSync({
  serviceName,
  file,
  token,
  endpoint,
}: InvokeServiceSyncProps) {
  if (!serviceName?.trim()) {
    throw new Error("Service name is required.");
  }
  const axiosInstance: AxiosInstance = axios.create();

  try {
    const fileData: string = await readFile(file);

    const base64 = btoa(fileData);

    const response = await axiosInstance({
      method: "post",
      url: endpoint + "/run/" + serviceName,
      headers: { Authorization: `Bearer ${token}` },
      data: base64,
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data;
      const detail = typeof data === "string" && data.trim() && !data.trim().startsWith("<")
        ? data.trim().slice(0, 200)
        : typeof data?.message === "string"
          ? data.message.slice(0, 200)
          : typeof data?.error === "string"
            ? data.error.slice(0, 200)
            : error.response?.statusText || error.message;
      throw new Error(status ? `HTTP ${status}: ${detail}` : detail);
    }
    throw error;
  }
}
