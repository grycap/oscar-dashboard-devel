import axios from "axios";
import type { ClusterConfig, SystemConfig } from "@/models/systemConfig";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function getSystemConfigApi(): Promise<ClusterConfig | null> {
  const response = await axios.get<unknown>("/system/config");
  const data = response.data;
  if (!isObject(data)) {
    console.error("Invalid system configuration response", data);
    return null;
  }

  if (isObject(data.config)) {
    const rawConfig = data.config as Partial<SystemConfig>;
    const config = {
      ...rawConfig,
      oidc_groups: Array.isArray(rawConfig.oidc_groups)
        ? rawConfig.oidc_groups
        : [],
    } as SystemConfig;
    return {
      config,
      minio_provider: isObject(data.minio_provider)
        ? data.minio_provider as ClusterConfig["minio_provider"]
        : config.minio_provider,
      allowed_image_repositories: Array.isArray(data.allowed_image_repositories)
        ? data.allowed_image_repositories as string[]
        : [],
    };
  }

  if (Array.isArray(data.oidc_groups) && isObject(data.minio_provider)) {
    const config = data as unknown as SystemConfig;
    return {
      config,
      minio_provider: config.minio_provider,
      allowed_image_repositories: [],
    };
  }

  console.error("Invalid system configuration response", data);
  return null;
}

export default getSystemConfigApi;
