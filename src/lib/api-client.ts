import { API_BASE_URL } from "./config.js";

interface ApiError {
  message: string;
  statusCode?: number;
}

export class ApiClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private get headers(): Record<string, string> {
    return {
      "X-API-KEY": this.apiKey,
      "Content-Type": "application/json",
    };
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${API_BASE_URL}${path}`;
    const res = await fetch(url, {
      method,
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      let errorMessage: string;
      try {
        const errorBody = await res.json();
        errorMessage =
          (errorBody as { message?: string }).message ||
          JSON.stringify(errorBody);
      } catch {
        errorMessage = `HTTP ${res.status}: ${res.statusText}`;
      }
      const error: ApiError = {
        message: errorMessage,
        statusCode: res.status,
      };
      throw error;
    }

    return (await res.json()) as T;
  }

  async createLink(body: Record<string, unknown>): Promise<unknown> {
    return this.request("POST", "/core/link", body);
  }

  async getLinkBySuffix(
    projectId: string,
    suffix: string
  ): Promise<unknown> {
    const params = new URLSearchParams({
      dynamic_link_suffix: suffix,
      call_type: "API",
    });
    return this.request(
      "GET",
      `/dynamic-link/${projectId}?${params.toString()}`
    );
  }
}
