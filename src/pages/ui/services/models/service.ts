export type ServiceFilter = {
  value: string;
  type: ServiceFilterBy;
};

export enum ServiceFilterBy {
  Name = "Name",
  Type = "Type",
  Image = "Image",
  Owner = "Owner",
}

export enum ServiceOrderBy {
  NameAsc = "Name (asc)",
  NameDesc = "Name (desc)",
  CPUAsc = "CPU (asc)",
  CPUDesc = "CPU (desc)",
  MemoryAsc = "Memory (asc)",
  MemoryDesc = "Memory (desc)",
  ImageAsc = "Image (asc)",
  ImageDesc = "Image (desc)",
}

export interface StorageProviders {
  s3?: Record<string, AWSStorageProvider>;
  minio?: Record<string, MinioStorageProvider>;
  onedata?: Record<string, OnedataStorageProvider>;
  webdav?: Record<string, WebdavStorageProvider>;
}

export type StorageProviderType = keyof StorageProviders;

//In frontend the type is specified to improve type checking
export type StorageProvider = {
  type: StorageProviderType;
  id: string;
} & (
  | AWSStorageProvider
  | MinioStorageProvider
  | OnedataStorageProvider
  | WebdavStorageProvider
);

export type AWSStorageProvider = {
  access_key: string;
  secret_key: string;
  region: string;
};

export type MinioStorageProvider = {
  endpoint: string;
  region: string;
  secret_key: string;
  access_key: string;
  verify: boolean;
};

export type OnedataStorageProvider = {
  oneprovider_host: string;
  token: string;
  space: string;
};

export type WebdavStorageProvider = {
  hostname: string;
  login: string;
  password: string;
};

interface Clusters {
  id: {
    endpoint: string;
    auth_user: string;
    auth_password: string;
    ssl_verify: boolean;
  };
}

export interface StoragePath {
  storage_provider: string;
  path: string;
  suffix: string[];
  prefix: string[];
}

interface Replica {
  type: string;
  cluster_id: string;
  service_name: string;
  url: string;
  ssl_verify: boolean;
  priority: number;
  headers: Record<string, string>;
}

interface Synchronous {
  min_scale: number;
  max_scale: number;
}

export enum LOG_LEVEL {
  CRITICAL = "CRITICAL",
  ERROR = "ERROR",
  WARNING = "WARNING",
  INFO = "INFO",
  DEBUG = "DEBUG",
  NOTSET = "NOTSET",
}

export interface Service {
  allowed_users: string[];
  name: string;
  cluster_id: string;
  memory: string;
  cpu: string;
  enable_gpu: boolean;
  total_memory: string;
  total_cpu: string;
  synchronous: Synchronous;
  replicas: Replica[];
  rescheduler_threshold: string;
  token: string;
  log_level: LOG_LEVEL;
  image: string;
  interlink_node_name: string;
  image_rules: [];
  alpine: boolean;
  script: string;
  image_pull_secrets: string[];
  environment: {
    Variables: Record<string, string>;
  };
  annotations: Record<string, string>;
  labels: Record<string, string>;
  input: StoragePath[];
  output: StoragePath[];
  storage_providers: StorageProviders;
  clusters: Clusters;
}

export enum ServiceTab {
  Settings = 0,
  Logs = 1,
}

export enum ServiceFormTab {
  General,
  Storage,
  "Input - Output",
}