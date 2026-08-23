import { describe, it, expect, vi } from "vitest";
import { ProfileRegistry } from "../../../src/lib/profile-registry.js";
const cfg = (profiles: any, defaultProfile?: string) => ({ version: 1 as const, profiles: new Map(Object.entries(profiles)), ...(defaultProfile ? { defaultProfile } : {}) });
const credential = { id: "c", organization_id: "o", key_prefix: "prefix", scopes: ["links:read"] };

describe("ProfileRegistry", () => {
  it("resolves explicit then default then sole", () => {
    const clients: any = {};
    const registry = new ProfileRegistry(cfg({ a: { apiKey: "ka", organizationLabel: "A" }, b: { apiKey: "kb", organizationLabel: "B" } }, "a"), (key) => clients[key] ??= ({ key } as any));
    expect((registry.select("b").client as any).key).toBe("kb");
    expect((registry.select().client as any).key).toBe("ka");
  });

  it("rejects ambiguous and unknown safely", () => {
    const registry = new ProfileRegistry(cfg({ a: { apiKey: "secret", organizationLabel: "A" }, b: { apiKey: "two", organizationLabel: "B" } }));
    expect(() => registry.select()).toThrow("Multiple");
    expect(() => registry.select("x")).toThrow("Unknown");
  });

  it("single-flights initialization and reports state without eager network", async () => {
    let resolve!: (value: any) => void;
    const call = vi.fn(() => new Promise<any>((done) => { resolve = done; }));
    const registry = new ProfileRegistry(cfg({ a: { apiKey: "k", organizationLabel: "A" } }), () => ({ getCurrentCredential: call } as any));
    expect(registry.list()[0].initializationStatus).toBe("uninitialized");
    const first = registry.initialize();
    const second = registry.initialize();
    expect(registry.list()[0].initializationStatus).toBe("initializing");
    expect(call).toHaveBeenCalledOnce();
    resolve(credential);
    await Promise.all([first, second]);
    expect(registry.list()[0]).toMatchObject({ initializationStatus: "ready", scopes: ["links:read"] });
  });

  it("retries failed initialization", async () => {
    const call = vi.fn().mockRejectedValueOnce(new Error("temporary")).mockResolvedValueOnce(credential);
    const registry = new ProfileRegistry(cfg({ a: { apiKey: "k", organizationLabel: "A" } }), () => ({ getCurrentCredential: call } as any));
    await expect(registry.initialize()).rejects.toThrow("temporary");
    expect(registry.list()[0].initializationStatus).toBe("uninitialized");
    await expect(registry.initialize()).resolves.toMatchObject({ credential });
    expect(call).toHaveBeenCalledTimes(2);
  });

  it("checks scope after initialization", async () => {
    const registry = new ProfileRegistry(cfg({ a: { apiKey: "k", organizationLabel: "A" } }), () => ({ getCurrentCredential: async () => credential } as any));
    await expect(registry.initialize(undefined, "links:write")).rejects.toThrow("links:write");
  });

  it("resolves a profile-local alias or direct UUID", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    const registry = new ProfileRegistry(cfg({ a: { apiKey: "k", organizationLabel: "A", projects: new Map([["web", id]]) } }));
    expect(registry.resolveProject("a", "web")).toBe(id);
    expect(registry.resolveProject("a", id)).toBe(id);
    expect(() => registry.resolveProject("a", "missing")).toThrow("web");
  });

  it("keeps same-Organization aliases isolated", async () => {
    const calls: string[] = [];
    const registry = new ProfileRegistry(cfg({ a: { apiKey: "ka", organizationLabel: "A" }, b: { apiKey: "kb", organizationLabel: "B" } }), (key) => ({ getCurrentCredential: async () => { calls.push(key); return { ...credential, organization_id: "same" }; } } as any));
    const [a, b] = await Promise.all([registry.initialize("a"), registry.initialize("b")]);
    expect(calls.sort()).toEqual(["ka", "kb"]);
    expect(a.client).not.toBe(b.client);
  });
});
