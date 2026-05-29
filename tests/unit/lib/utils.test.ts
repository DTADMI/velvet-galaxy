import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges simple string classes", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("filters falsy values", () => {
    expect(cn("foo", false && "bar", null, undefined, 0, "")).toBe("foo");
  });

  it("handles numbers as class values", () => {
    expect(cn(42, "foo")).toBe("42 foo");
  });

  it("handles conditional classes", () => {
    expect(cn("base", true && "active", false && "hidden")).toBe("base active");
  });

  it("handles object syntax", () => {
    expect(cn("base", { active: true, disabled: false })).toBe("base active");
  });

  it("handles nested arrays", () => {
    expect(cn("base", ["nested1", ["nested2"]])).toBe("base nested1 nested2");
  });

  it("merges tailwind conflicts with twMerge", () => {
    expect(cn("px-4 py-2", "px-6")).toContain("px-6");
    expect(cn("px-4 py-2", "px-6")).not.toContain("px-4");
  });

  it("handles zero as falsy", () => {
    expect(cn("foo", 0, "bar")).toBe("foo bar");
  });

  it("returns empty string for no inputs", () => {
    expect(cn()).toBe("");
  });

  it("returns empty string for all falsy inputs", () => {
    expect(cn(null, undefined, false, "")).toBe("");
  });

  it("handles complex mix of types", () => {
    const result = cn(
      "base",
      1,
      ["arr1", false && "hidden"],
      { conditional: true, disabled: false },
      null,
      undefined,
      "px-4",
      "px-6"
    );
    expect(result).toContain("base");
    expect(result).toContain("1");
    expect(result).toContain("arr1");
    expect(result).toContain("conditional");
    expect(result).toContain("px-6");
    expect(result).not.toContain("px-4");
    expect(result).not.toContain("disabled");
    expect(result).not.toContain("hidden");
  });
});
