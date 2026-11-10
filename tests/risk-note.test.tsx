import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { RiskNote } from "../components/RiskNote";

describe("RiskNote", () => {
  test("empty risk_note renders the pending state and no generated risk text", () => {
    const html = renderToStaticMarkup(<RiskNote items={[]} />);
    expect(html).toContain("wc-risk--pending");
    expect(html).toContain('<span class="wc-badge wc-badge--pending">待補</span>');
    expect(html).toContain("此篇風險說明待補，閱讀時請自行評估");
    expect(html).not.toContain("<ul>");
    expect(html).not.toContain("以上為教學說明");
  });

  test("filled risk_note renders only the given items", () => {
    const html = renderToStaticMarkup(<RiskNote items={["風險一", "風險二"]} />);
    expect(html).toContain("wc-risk--normal");
    expect(html).toContain("<li>風險一</li><li>風險二</li>");
    expect(html).not.toContain("待補");
  });
});
