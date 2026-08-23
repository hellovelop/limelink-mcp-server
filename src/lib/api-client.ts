import { API_ORIGIN } from "./config.js";

export interface ApiError {
  message: string;
  statusCode?: number;
}

export interface CurrentApiCredential {
  id: string;
  organization_id: string;
  key_prefix: string;
  scopes: string[];
}

export interface Project {
  id: string;
  organization_id: string;
  created_by_user_id: string;
  project_name: string;
  logo_image_id: string | null;
  sub_domain: string | null;
  logo_image: Record<string, unknown> | null;
  skin_info: Record<string, unknown> | null;
  android_app_flag: boolean;
  ios_app_flag: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectList {
  projects: Project[];
}

export interface CustomDomain extends Record<string, unknown> {
  id: string;
  organization_id: string;
  project_id: string;
  hostname: string;
  lifecycle_status: "PENDING_PROVIDER" | "PENDING_DNS" | "PENDING_CERTIFICATE" | "ACTIVE" | "FAILED" | "EXPIRED" | "DELETING";
  retry_count: number;
  created_at: string;
  updated_at: string;
}

export interface CustomDomainList {
  custom_domains: CustomDomain[];
}

export interface Link extends Record<string, unknown> {
  id: string;
  organization_id: string;
  project_id: string;
  custom_domain_id: string | null;
  domain_type: "DEFAULT" | "CUSTOM";
  hostname: string;
  suffix: string;
  short_url: string | null;
  dynamic_link_url: string;
  dynamic_link_name: string;
  apple_options: Record<string, unknown> | null;
  android_options: Record<string, unknown> | null;
  applications: {
    apple: Record<string, unknown> | null;
    android: Record<string, unknown> | null;
  };
  additional_options: Record<string, unknown> | null;
  stats_flag: boolean;
  created_at: string;
  updated_at: string | null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SCOPES = new Set([
  "projects:read",
  "projects:write",
  "applications:read",
  "applications:write",
  "domains:read",
  "domains:write",
  "links:read",
  "links:write",
]);

async function upstreamError(response: Response): Promise<ApiError> {
  const text = (await response.text()).slice(0, 65_536);
  if (text) {
    try {
      return {
        message: JSON.stringify(JSON.parse(text)),
        statusCode: response.status,
      };
    } catch {
      return { message: text, statusCode: response.status };
    }
  }
  return {
    message: `LimeLink API request failed (HTTP ${response.status}).`,
    statusCode: response.status,
  };
}

function isProject(value: unknown): value is Project {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const project = value as Record<string, unknown>;
  return (
    typeof project.id === "string" &&
    UUID.test(project.id) &&
    typeof project.organization_id === "string" &&
    UUID.test(project.organization_id) &&
    typeof project.created_by_user_id === "string" &&
    UUID.test(project.created_by_user_id) &&
    typeof project.project_name === "string" &&
    (project.logo_image_id === null ||
      (typeof project.logo_image_id === "string" &&
        UUID.test(project.logo_image_id))) &&
    (project.sub_domain === null || typeof project.sub_domain === "string") &&
    (project.logo_image === null ||
      (typeof project.logo_image === "object" &&
        !Array.isArray(project.logo_image))) &&
    (project.skin_info === null ||
      (typeof project.skin_info === "object" && !Array.isArray(project.skin_info))) &&
    typeof project.android_app_flag === "boolean" &&
    typeof project.ios_app_flag === "boolean" &&
    typeof project.created_at === "string" &&
    !Number.isNaN(Date.parse(project.created_at)) &&
    typeof project.updated_at === "string" &&
    !Number.isNaN(Date.parse(project.updated_at))
  );
}

function isCustomDomain(value: unknown): value is CustomDomain {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const domain = value as Record<string, unknown>;
  return (
    typeof domain.id === "string" && UUID.test(domain.id) &&
    typeof domain.organization_id === "string" && UUID.test(domain.organization_id) &&
    typeof domain.project_id === "string" && UUID.test(domain.project_id) &&
    typeof domain.hostname === "string" &&
    typeof domain.lifecycle_status === "string" &&
    ["PENDING_PROVIDER", "PENDING_DNS", "PENDING_CERTIFICATE", "ACTIVE", "FAILED", "EXPIRED", "DELETING"].includes(domain.lifecycle_status) &&
    typeof domain.retry_count === "number" && Number.isInteger(domain.retry_count) &&
    typeof domain.created_at === "string" && !Number.isNaN(Date.parse(domain.created_at)) &&
    typeof domain.updated_at === "string" && !Number.isNaN(Date.parse(domain.updated_at))
  );
}

function isNullableObject(value: unknown): value is Record<string, unknown> | null {
  return value === null || (typeof value === "object" && !Array.isArray(value));
}

function isUri(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isLink(value: unknown): value is Link {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const link = value as Record<string, unknown>;
  const applications = link.applications;
  return (
    typeof link.id === "string" && UUID.test(link.id) &&
    typeof link.organization_id === "string" && UUID.test(link.organization_id) &&
    typeof link.project_id === "string" && UUID.test(link.project_id) &&
    (link.custom_domain_id === null ||
      (typeof link.custom_domain_id === "string" && UUID.test(link.custom_domain_id))) &&
    (link.domain_type === "DEFAULT" || link.domain_type === "CUSTOM") &&
    typeof link.hostname === "string" &&
    typeof link.suffix === "string" &&
    (link.short_url === null || isUri(link.short_url)) &&
    isUri(link.dynamic_link_url) &&
    typeof link.dynamic_link_name === "string" &&
    isNullableObject(link.apple_options) &&
    isNullableObject(link.android_options) &&
    !!applications && typeof applications === "object" && !Array.isArray(applications) &&
    isNullableObject((applications as Record<string, unknown>).apple) &&
    isNullableObject((applications as Record<string, unknown>).android) &&
    isNullableObject(link.additional_options) &&
    typeof link.stats_flag === "boolean" &&
    typeof link.created_at === "string" && !Number.isNaN(Date.parse(link.created_at)) &&
    (link.updated_at === null ||
      (typeof link.updated_at === "string" && !Number.isNaN(Date.parse(link.updated_at))))
  );
}

function isCurrentCredential(value: unknown): value is CurrentApiCredential {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const credential = value as Record<string, unknown>;
  return (
    typeof credential.id === "string" &&
    UUID.test(credential.id) &&
    typeof credential.organization_id === "string" &&
    UUID.test(credential.organization_id) &&
    typeof credential.key_prefix === "string" &&
    credential.key_prefix.length === 6 &&
    Array.isArray(credential.scopes) &&
    credential.scopes.every(
      (scope) => typeof scope === "string" && SCOPES.has(scope)
    )
  );
}

export class ApiClient {
  constructor(
    private readonly apiKey: string,
    private readonly origin = API_ORIGIN
  ) {}

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
    const response = await fetch(`${this.origin}${path}`, {
      method,
      headers: this.headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) throw await upstreamError(response);
    return (await response.json()) as T;
  }

  createLink(body: Record<string, unknown>): Promise<unknown> {
    return this.request("POST", "/api/v2/core/link", body);
  }

  getLinkBySuffix(projectId: string, suffix: string): Promise<unknown> {
    const params = new URLSearchParams({
      dynamic_link_suffix: suffix,
      call_type: "API",
    });
    return this.request(
      "GET",
      `/api/v1/dynamic-link/${encodeURIComponent(projectId)}?${params}`
    );
  }

  async resolveLinkByUrl(url: string): Promise<Link> {
    const result = await this.request<unknown>(
      "GET",
      `/api/v2/links/resolve?${new URLSearchParams({ url })}`
    );
    if (!isLink(result)) {
      throw { message: "LimeLink API returned an invalid Link." } satisfies ApiError;
    }
    return result;
  }

  async getCurrentCredential(): Promise<CurrentApiCredential> {
    const credential = await this.request<unknown>(
      "GET",
      "/api/v2/api-credentials/current"
    );
    if (!isCurrentCredential(credential)) {
      throw {
        message: "LimeLink API returned an invalid credential context.",
      } satisfies ApiError;
    }
    return credential;
  }

  async listCustomDomains(
    organizationId: string,
    projectId: string
  ): Promise<CustomDomainList> {
    const result = await this.request<unknown>(
      "GET",
      `/api/v2/organizations/${encodeURIComponent(organizationId)}/projects/${encodeURIComponent(projectId)}/custom-domains`
    );
    if (
      !result || typeof result !== "object" || Array.isArray(result) ||
      !Array.isArray((result as { custom_domains?: unknown }).custom_domains) ||
      !(result as { custom_domains: unknown[] }).custom_domains.every(isCustomDomain)
    ) {
      throw { message: "LimeLink API returned an invalid Custom Domain list." } satisfies ApiError;
    }
    return result as CustomDomainList;
  }

  async listProjects(organizationId: string): Promise<ProjectList> {
    const result = await this.request<unknown>(
      "GET",
      `/api/v2/organizations/${encodeURIComponent(organizationId)}/projects`
    );
    if (
      !result ||
      typeof result !== "object" ||
      Array.isArray(result) ||
      !Array.isArray((result as { projects?: unknown }).projects) ||
      !(result as { projects: unknown[] }).projects.every(isProject)
    ) {
      throw {
        message: "LimeLink API returned an invalid project list.",
      } satisfies ApiError;
    }
    return result as ProjectList;
  }
}
