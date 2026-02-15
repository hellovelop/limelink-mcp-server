import { vi } from "vitest";

interface MockResponseOptions {
  ok?: boolean;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
}

export function createMockResponse(
  body: unknown,
  options: MockResponseOptions = {}
): Response {
  const { ok = true, status = 200, statusText = "OK" } = options;
  return {
    ok,
    status,
    statusText,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === "string" ? body : JSON.stringify(body)),
    headers: new Headers(options.headers),
  } as unknown as Response;
}

export function createTextResponse(
  text: string,
  options: MockResponseOptions = {}
): Response {
  const { ok = true, status = 200, statusText = "OK" } = options;
  return {
    ok,
    status,
    statusText,
    json: () => Promise.reject(new Error("Not JSON")),
    text: () => Promise.resolve(text),
    headers: new Headers(options.headers),
  } as unknown as Response;
}

export function createErrorResponse(
  status: number,
  body?: unknown,
  statusText = "Error"
): Response {
  if (body !== undefined) {
    return createMockResponse(body, { ok: false, status, statusText });
  }
  // Non-JSON error response
  return {
    ok: false,
    status,
    statusText,
    json: () => Promise.reject(new SyntaxError("Unexpected token")),
    text: () => Promise.resolve(statusText),
    headers: new Headers(),
  } as unknown as Response;
}

export function mockFetch() {
  const fn = vi.fn<(...args: unknown[]) => Promise<Response>>();
  vi.stubGlobal("fetch", fn);
  return fn;
}
