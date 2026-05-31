import { Service } from "@/pages/ui/services/models/service";

function toPortList(value: unknown): number[] | undefined {
  if (Array.isArray(value)) {
    return value.map(Number).filter(Number.isFinite);
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? [value] : undefined;
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return undefined;
    }

    const port = Number(trimmedValue);
    return Number.isFinite(port) ? [port] : undefined;
  }

  return undefined;
}

function normalizeServicePayload(service: Service): Service {
  if (!service.expose) {
    return service;
  }

  const expose = {
    ...(service.expose as Record<string, unknown>),
  };
  const apiPort = toPortList(expose.api_port);
  const nodePort = toPortList(expose.nodePort);

  if (apiPort) {
    expose.api_port = apiPort;
  }

  if (nodePort && nodePort.some((port) => port > 0)) {
    expose.nodePort = nodePort;
  } else {
    delete expose.nodePort;
  }

  return {
    ...service,
    expose: expose as Service["expose"],
  };
}

export default normalizeServicePayload;
