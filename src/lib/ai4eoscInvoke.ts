// AI4EOSC's OSCAR wrapper expects a JSON document with embedded base64 files.
// invokeServiceSync subsequently base64-encodes the whole document for OSCAR.
export async function buildAI4EOSCInput(
  file: File | null,
  fileKey: string,
  parametersText: string
): Promise<File> {
  let parameters: unknown;
  try {
    parameters = JSON.parse(parametersText);
  } catch {
    throw new Error("Model parameters must be valid JSON.");
  }
  if (parameters === null || Array.isArray(parameters) || typeof parameters !== "object") {
    throw new Error("Model parameters must be a JSON object.");
  }
  const args = parameters as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(args, "oscar-files")) {
    throw new Error("Use Raw file to send a prebuilt oscar-files payload.");
  }
  for (const [name, value] of Object.entries(args)) {
    if (value === null || typeof value === "object") {
      throw new Error(`Parameter ${name} must be a string, number or boolean (encode arrays/objects as strings).`);
    }
  }
  if (!file && Object.keys(args).length === 0) {
    throw new Error("Select a file or provide model parameters (e.g. {\"help\":\"\"}).");
  }

  const payload: Record<string, unknown> = { ...args };
  if (file) {
    const key = fileKey.trim();
    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(key)) {
      throw new Error("Enter a valid model file parameter (e.g. files).");
    }
    const format = file.name.match(/\.([a-zA-Z0-9]+)$/)?.[1].toLowerCase();
    if (!format) {
      throw new Error("The input file must have an extension (e.g. .jpg).");
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    // Chunking avoids overflowing the argument limit of String.fromCharCode.
    let binary = "";
    for (let i = 0; i < bytes.length; i += 8192) {
      binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    }
    payload["oscar-files"] = [{ key, file_format: format, data: btoa(binary) }];
  }

  return new File([JSON.stringify(payload)], "ai4eosc-input.json", {
    type: "application/json",
  });
}
