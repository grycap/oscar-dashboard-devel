const editableExtensions: Record<string, string> = {
  css: "css",
  csv: "plaintext",
  env: "plaintext",
  html: "html",
  ini: "plaintext",
  js: "javascript",
  json: "json",
  md: "markdown",
  markdown: "markdown",
  py: "python",
  sh: "shell",
  toml: "plaintext",
  ts: "typescript",
  tsv: "plaintext",
  txt: "plaintext",
  xml: "xml",
  yaml: "yaml",
  yml: "yaml",
};

const editableMimeTypes: Record<string, string> = {
  "application/javascript": "javascript",
  "application/json": "json",
  "application/markdown": "markdown",
  "application/toml": "plaintext",
  "application/x-yaml": "yaml",
  "application/xml": "xml",
  "application/yaml": "yaml",
  "text/css": "css",
  "text/csv": "plaintext",
  "text/html": "html",
  "text/markdown": "markdown",
  "text/plain": "plaintext",
  "text/tab-separated-values": "plaintext",
  "text/xml": "xml",
  "text/yaml": "yaml",
};

export function getEditableLanguage(file: File): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension && editableExtensions[extension]) {
    return editableExtensions[extension];
  }

  if (file.type && editableMimeTypes[file.type]) {
    return editableMimeTypes[file.type];
  }

  if (file.type.startsWith("text/")) {
    return "plaintext";
  }

  return null;
}
