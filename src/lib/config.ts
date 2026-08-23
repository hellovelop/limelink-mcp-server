import {
  closeSync,
  fstatSync,
  openSync,
  readFileSync,
  realpathSync,
} from "node:fs";
import { resolve } from "node:path";

export const API_ORIGIN = "https://api.limelink.org";
export const DOCS_BASE_URL = "https://limelink.org";

export interface ProfileConfig {
  readonly apiKey: string;
  readonly organizationLabel: string;
  readonly projects?: ReadonlyMap<string, string>;
}

export interface ProfilesConfig {
  readonly version: 1;
  readonly defaultProfile?: string;
  readonly profiles: ReadonlyMap<string, ProfileConfig>;
}

const ALIAS = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const CONTROL = /[\u0000-\u001f\u007f]/;
const safeError = (message: string): Error => new Error(message);

function assertNoDuplicateObjectKeys(raw: string): void {
  let index = 0;
  const whitespace = /\s/;
  const skipWhitespace = (): void => {
    while (index < raw.length && whitespace.test(raw[index])) index += 1;
  };
  const parseString = (): string => {
    const start = index;
    index += 1;
    while (index < raw.length) {
      if (raw[index] === "\\") index += 2;
      else if (raw[index++] === '"') return JSON.parse(raw.slice(start, index));
    }
    throw new Error("unterminated string");
  };
  const parseValue = (): void => {
    skipWhitespace();
    if (raw[index] === "{") return parseObject();
    if (raw[index] === "[") return parseArray();
    if (raw[index] === '"') {
      parseString();
      return;
    }
    while (index < raw.length && !/[\s,\]}]/.test(raw[index])) index += 1;
  };
  const parseObject = (): void => {
    index += 1;
    const keys = new Set<string>();
    skipWhitespace();
    if (raw[index] === "}") {
      index += 1;
      return;
    }
    while (index < raw.length) {
      skipWhitespace();
      const key = parseString();
      if (keys.has(key)) throw new Error("duplicate key");
      keys.add(key);
      skipWhitespace();
      index += 1; // colon; JSON.parse has already validated syntax
      parseValue();
      skipWhitespace();
      if (raw[index++] === "}") return;
    }
  };
  const parseArray = (): void => {
    index += 1;
    skipWhitespace();
    if (raw[index] === "]") {
      index += 1;
      return;
    }
    while (index < raw.length) {
      parseValue();
      skipWhitespace();
      if (raw[index++] === "]") return;
    }
  };
  parseValue();
}

function readProfilesFile(input: string): string {
  let target: string;
  try {
    target = realpathSync(resolve(process.cwd(), input));
  } catch {
    throw safeError("LimeLink profiles file could not be resolved.");
  }

  let descriptor: number;
  try {
    descriptor = openSync(target, "r");
  } catch {
    throw safeError("LimeLink profiles file could not be read.");
  }

  try {
    const stat = fstatSync(descriptor);
    if (!stat.isFile()) {
      throw safeError("LimeLink profiles path must resolve to a regular file.");
    }
    if (process.platform !== "win32" && (stat.mode & 0o044) !== 0) {
      console.error(
        "Warning: LimeLink profile credentials file is readable by group or other users."
      );
    }
    return readFileSync(descriptor, "utf8");
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("LimeLink profiles")) {
      throw error;
    }
    throw safeError("LimeLink profiles file could not be read.");
  } finally {
    closeSync(descriptor);
  }
}

export function loadConfig(
  env: NodeJS.ProcessEnv = process.env
): ProfilesConfig {
  const input = env.LIMELINK_PROFILES_FILE;
  if (!input) return { version: 1, profiles: new Map() };

  const raw = readProfilesFile(input);
  let value: unknown;
  try {
    value = JSON.parse(raw);
    assertNoDuplicateObjectKeys(raw);
  } catch {
    throw safeError("LimeLink profiles file contains invalid JSON.");
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw safeError("LimeLink profiles file does not match the required schema.");
  }
  const root = value as Record<string, unknown>;
  if (root.version !== 1) {
    throw safeError("Unsupported LimeLink profiles file version.");
  }
  if (
    Object.keys(root).some(
      (key) => !["version", "defaultProfile", "profiles"].includes(key)
    ) ||
    !root.profiles ||
    typeof root.profiles !== "object" ||
    Array.isArray(root.profiles)
  ) {
    throw safeError("LimeLink profiles file does not match the required schema.");
  }

  const profiles = new Map<string, ProfileConfig>();
  for (const [alias, item] of Object.entries(
    root.profiles as Record<string, unknown>
  )) {
    if (
      !ALIAS.test(alias) ||
      !item ||
      typeof item !== "object" ||
      Array.isArray(item)
    ) {
      throw safeError("LimeLink profiles file does not match the required schema.");
    }
    const profile = item as Record<string, unknown>;
    if (
      Object.keys(profile).some(
        (key) => !["apiKey", "organizationLabel", "projects"].includes(key)
      ) ||
      typeof profile.apiKey !== "string" ||
      profile.apiKey.length < 1 ||
      profile.apiKey.length > 4096 ||
      profile.apiKey.trim() !== profile.apiKey ||
      CONTROL.test(profile.apiKey) ||
      typeof profile.organizationLabel !== "string" ||
      profile.organizationLabel.trim() !== profile.organizationLabel ||
      profile.organizationLabel.length < 1 ||
      [...profile.organizationLabel].length > 100 ||
      CONTROL.test(profile.organizationLabel)
    ) {
      throw safeError("LimeLink profiles file does not match the required schema.");
    }
    const projectsValue = profile.projects ?? {};
    if (
      !projectsValue ||
      typeof projectsValue !== "object" ||
      Array.isArray(projectsValue)
    ) {
      throw safeError("LimeLink profiles file does not match the required schema.");
    }
    const projects = new Map<string, string>();
    for (const [projectAlias, projectId] of Object.entries(
      projectsValue as Record<string, unknown>
    )) {
      if (
        !ALIAS.test(projectAlias) ||
        typeof projectId !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId)
      ) {
        throw safeError("LimeLink profiles file does not match the required schema.");
      }
      projects.set(projectAlias, projectId);
    }
    profiles.set(alias, {
      apiKey: profile.apiKey,
      organizationLabel: profile.organizationLabel,
      projects,
    });
  }

  const defaultProfile = root.defaultProfile;
  if (
    defaultProfile !== undefined &&
    (typeof defaultProfile !== "string" || !ALIAS.test(defaultProfile))
  ) {
    throw safeError("LimeLink profiles file does not match the required schema.");
  }
  if (typeof defaultProfile === "string" && !profiles.has(defaultProfile)) {
    throw safeError("The configured default profile does not exist.");
  }
  return {
    version: 1,
    ...(defaultProfile ? { defaultProfile } : {}),
    profiles,
  };
}
