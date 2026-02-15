export const API_BASE_URL = "https://api.limelink.org/api/v1";
export const DOCS_BASE_URL = "https://limelink.org";

export interface Config {
  apiKey?: string;
  projectId?: string;
}

export function loadConfig(): Config {
  return {
    apiKey: process.env.LIMELINK_API_KEY || undefined,
    projectId: process.env.LIMELINK_PROJECT_ID,
  };
}
