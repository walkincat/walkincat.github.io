import { describe, expect, test } from "bun:test";
import { classifyExternalStatus } from "../scripts/link-rules";

describe("external link status rules", () => {
  test("Instagram 429 is a warning, like 403", () => {
    expect(classifyExternalStatus("https://www.instagram.com/walkincat2020/", 429)).toBe("warn");
    expect(classifyExternalStatus("https://instagram.com/p/abc/", 429)).toBe("warn");
    expect(classifyExternalStatus("https://www.instagram.com/walkincat2020/", 403)).toBe("warn");
  });

  test("429 from other hosts is still an error", () => {
    expect(classifyExternalStatus("https://example.com/", 429)).toBe("error");
    expect(classifyExternalStatus("https://x.com/WalkinCatorg", 429)).toBe("error");
    expect(classifyExternalStatus("https://www.youtube.com/@walkincat2020", 429)).toBe("error");
    expect(classifyExternalStatus("https://notinstagram.com/", 429)).toBe("error");
  });

  test("403 stays a warning only on bot-blocking hosts", () => {
    expect(classifyExternalStatus("https://x.com/WalkinCatorg", 403)).toBe("warn");
    expect(classifyExternalStatus("https://example.com/", 403)).toBe("error");
  });

  test("other Instagram errors still fail; 2xx/3xx pass", () => {
    expect(classifyExternalStatus("https://www.instagram.com/walkincat2020/", 404)).toBe("error");
    expect(classifyExternalStatus("https://www.instagram.com/walkincat2020/", 0)).toBe("error");
    expect(classifyExternalStatus("https://www.instagram.com/walkincat2020/", 200)).toBe("ok");
    expect(classifyExternalStatus("https://example.com/", 301)).toBe("ok");
  });
});
