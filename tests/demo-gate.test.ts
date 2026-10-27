// ТЗ, раздел 21: демо-объекты (чужие фото) не попадают в production-сборку.
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("демо-объекты", () => {
  it("в production скрыты", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SHOW_DEMO", "");
    const { projects } = await import("../src/content/projects");
    expect(projects.filter((p) => p.demo)).toEqual([]);
  });

  it("на staging видны", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_ENV", "staging");
    const { projects } = await import("../src/content/projects");
    expect(projects.length).toBeGreaterThan(0);
  });
});
