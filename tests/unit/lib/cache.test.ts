import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TTLCache } from "../../../src/lib/cache.js";

describe("TTLCache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("set / get", () => {
    it("저장 후 즉시 조회하면 값을 반환한다", () => {
      const cache = new TTLCache<string>();
      cache.set("key", "value");
      expect(cache.get("key")).toBe("value");
    });

    it("존재하지 않는 키는 undefined를 반환한다", () => {
      const cache = new TTLCache<string>();
      expect(cache.get("nonexistent")).toBeUndefined();
    });

    it("제네릭 타입으로 숫자를 저장/조회한다", () => {
      const cache = new TTLCache<number>();
      cache.set("count", 42);
      expect(cache.get("count")).toBe(42);
    });

    it("제네릭 타입으로 객체를 저장/조회한다", () => {
      const cache = new TTLCache<{ name: string }>();
      const obj = { name: "test" };
      cache.set("obj", obj);
      expect(cache.get("obj")).toEqual({ name: "test" });
    });

    it("같은 키에 덮어쓰면 최신 값을 반환한다", () => {
      const cache = new TTLCache<string>();
      cache.set("key", "first");
      cache.set("key", "second");
      expect(cache.get("key")).toBe("second");
    });
  });

  describe("TTL 만료", () => {
    it("TTL 내 조회하면 값을 반환한다", () => {
      const cache = new TTLCache<string>(1000);
      cache.set("key", "value");

      vi.advanceTimersByTime(999);
      expect(cache.get("key")).toBe("value");
    });

    it("TTL 초과 후 조회하면 undefined를 반환한다", () => {
      const cache = new TTLCache<string>(1000);
      cache.set("key", "value");

      vi.advanceTimersByTime(1001);
      expect(cache.get("key")).toBeUndefined();
    });

    it("만료된 항목은 store에서 삭제된다", () => {
      const cache = new TTLCache<string>(1000);
      cache.set("key", "value");

      vi.advanceTimersByTime(1001);
      cache.get("key"); // 만료 트리거

      // 다시 조회해도 undefined
      expect(cache.get("key")).toBeUndefined();
    });

    it("커스텀 TTL이 적용된다", () => {
      const cache = new TTLCache<string>(500);
      cache.set("key", "value");

      vi.advanceTimersByTime(499);
      expect(cache.get("key")).toBe("value");

      vi.advanceTimersByTime(2);
      expect(cache.get("key")).toBeUndefined();
    });

    it("기본 TTL은 1시간이다", () => {
      const cache = new TTLCache<string>();
      cache.set("key", "value");

      // 59분: 아직 유효
      vi.advanceTimersByTime(59 * 60 * 1000);
      expect(cache.get("key")).toBe("value");

      // 1시간 + 1ms: 만료
      vi.advanceTimersByTime(1 * 60 * 1000 + 1);
      expect(cache.get("key")).toBeUndefined();
    });
  });

  describe("has", () => {
    it("존재하는 키는 true를 반환한다", () => {
      const cache = new TTLCache<string>();
      cache.set("key", "value");
      expect(cache.has("key")).toBe(true);
    });

    it("존재하지 않는 키는 false를 반환한다", () => {
      const cache = new TTLCache<string>();
      expect(cache.has("key")).toBe(false);
    });

    it("만료된 키는 false를 반환한다", () => {
      const cache = new TTLCache<string>(1000);
      cache.set("key", "value");

      vi.advanceTimersByTime(1001);
      expect(cache.has("key")).toBe(false);
    });
  });

  describe("delete", () => {
    it("키를 명시적으로 삭제한다", () => {
      const cache = new TTLCache<string>();
      cache.set("key", "value");

      cache.delete("key");
      expect(cache.get("key")).toBeUndefined();
    });

    it("존재하지 않는 키 삭제는 에러 없이 무시된다", () => {
      const cache = new TTLCache<string>();
      expect(() => cache.delete("nonexistent")).not.toThrow();
    });
  });

  describe("clear", () => {
    it("모든 항목을 삭제한다", () => {
      const cache = new TTLCache<string>();
      cache.set("a", "1");
      cache.set("b", "2");
      cache.set("c", "3");

      cache.clear();

      expect(cache.get("a")).toBeUndefined();
      expect(cache.get("b")).toBeUndefined();
      expect(cache.get("c")).toBeUndefined();
    });
  });
});
