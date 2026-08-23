import { ApiClient, type CurrentApiCredential } from "./api-client.js";
import type { ProfilesConfig } from "./config.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type InitializationStatus = "uninitialized" | "initializing" | "ready";
export interface PublicProfile {
  alias: string;
  organizationLabel: string;
  isDefault: boolean;
  initializationStatus: InitializationStatus;
  scopes?: string[];
}
export interface SelectedProfile {
  alias: string;
  organizationLabel: string;
  client: ApiClient;
}
export interface InitializedProfile extends SelectedProfile {
  credential: CurrentApiCredential;
}
interface Entry extends SelectedProfile {
  projects: ReadonlyMap<string, string>;
  credential?: CurrentApiCredential;
  initialization?: Promise<CurrentApiCredential>;
}

export class ProfileRegistry {
  private readonly entries = new Map<string, Entry>();

  constructor(
    private readonly config: ProfilesConfig,
    clientFactory: (key: string) => ApiClient = (key) => new ApiClient(key)
  ) {
    for (const [alias, profile] of config.profiles) {
      this.entries.set(alias, {
        alias,
        organizationLabel: profile.organizationLabel,
        projects: profile.projects ?? new Map(),
        client: clientFactory(profile.apiKey),
      });
    }
  }

  list(): PublicProfile[] {
    return [...this.entries.values()]
      .sort((a, b) => a.alias.localeCompare(b.alias))
      .map((entry) => ({
        alias: entry.alias,
        organizationLabel: entry.organizationLabel,
        isDefault: this.config.defaultProfile === entry.alias,
        initializationStatus: entry.credential
          ? "ready"
          : entry.initialization
            ? "initializing"
            : "uninitialized",
        ...(entry.credential ? { scopes: [...entry.credential.scopes] } : {}),
      }));
  }

  select(alias?: string): Entry {
    if (this.entries.size === 0) {
      throw new Error(
        "No LimeLink API credential profile is configured. Visit https://limelink.org/organizations, select an Organization, issue an Organization API key, add it to your LimeLink profiles file, set LIMELINK_PROFILES_FILE to that file, and restart the MCP server."
      );
    }
    const available = [...this.entries.keys()].sort();
    const selected =
      alias ||
      this.config.defaultProfile ||
      (this.entries.size === 1 ? available[0] : undefined);
    if (!selected) {
      throw new Error(
        `Multiple LimeLink profiles are configured. Specify profile. Available profiles: ${available.join(", ")}.`
      );
    }
    const entry = this.entries.get(selected);
    if (!entry) {
      throw new Error(
        `Unknown LimeLink profile "${selected}". Available profiles: ${available.join(", ")}.`
      );
    }
    return entry;
  }

  async initialize(alias?: string, requiredScope?: string): Promise<InitializedProfile> {
    const entry = this.select(alias);
    if (!entry.credential) {
      if (!entry.initialization) {
        entry.initialization = entry.client
          .getCurrentCredential()
          .then((credential) => {
            entry.credential = credential;
            return credential;
          })
          .finally(() => {
            entry.initialization = undefined;
          });
      }
      await entry.initialization;
    }
    if (requiredScope && !entry.credential!.scopes.includes(requiredScope)) {
      throw new Error(
        `LimeLink profile "${entry.alias}" does not have required scope "${requiredScope}".`
      );
    }
    return { ...entry, credential: entry.credential! };
  }

  /** Compatibility alias for callers migrating from the old lifecycle name. */
  hydrate(alias?: string): Promise<InitializedProfile> {
    return this.initialize(alias);
  }

  projectAliases(alias: string): ReadonlyMap<string, string> {
    const entry = this.entries.get(alias);
    if (!entry) throw new Error(`Unknown LimeLink profile "${alias}".`);
    return entry.projects;
  }

  resolveProject(alias: string, selector: string): string {
    const entry = this.entries.get(alias);
    if (!entry) throw new Error(`Unknown LimeLink profile "${alias}".`);
    const mapped = entry.projects.get(selector);
    if (mapped) return mapped;
    if (UUID.test(selector)) return selector;
    const available = [...entry.projects.keys()].sort();
    const detail = available.length
      ? ` Available project aliases: ${available.join(", ")}.`
      : " No project aliases are configured; provide a Project UUID.";
    throw new Error(`Unknown Project selector "${selector}".${detail}`);
  }
}
