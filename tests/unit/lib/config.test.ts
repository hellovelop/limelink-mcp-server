import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig } from "../../../src/lib/config.js";

describe("loadConfig", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.LIMELINK_API_KEY;
    delete process.env.LIMELINK_PROJECT_ID;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("LIMELINK_API_KEY가 없으면 apiKey가 undefined이다", () => {
    const config = loadConfig();

    expect(config.apiKey).toBeUndefined();
  });

  it("LIMELINK_API_KEY가 빈 문자열이면 apiKey가 undefined이다", () => {
    process.env.LIMELINK_API_KEY = "";

    const config = loadConfig();

    expect(config.apiKey).toBeUndefined();
  });

  it("API 키만 설정하면 apiKey와 undefined projectId를 반환한다", () => {
    process.env.LIMELINK_API_KEY = "my-key";

    const config = loadConfig();

    expect(config.apiKey).toBe("my-key");
    expect(config.projectId).toBeUndefined();
  });

  it("모든 환경변수를 설정하면 해당 값을 반환한다", () => {
    process.env.LIMELINK_API_KEY = "custom-key";
    process.env.LIMELINK_PROJECT_ID = "proj-123";

    const config = loadConfig();

    expect(config.apiKey).toBe("custom-key");
    expect(config.projectId).toBe("proj-123");
  });
});
