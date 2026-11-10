import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { NOT_ADVICE_TEXT, NotAdviceNote } from "../components/NotAdviceNote";
import { RiskNote } from "../components/RiskNote";

describe("RiskNote", () => {
  test("empty risk_note renders the shared not-advice block and no list", () => {
    const html = renderToStaticMarkup(<RiskNote items={[]} />);
    expect(html).toBe(renderToStaticMarkup(<NotAdviceNote />));
    expect(html).toContain('data-risk="not-advice"');
    expect(html).toContain(NOT_ADVICE_TEXT);
    expect(html).not.toContain("<ul>");
    expect(html).not.toContain("待補");
  });

  test("filled risk_note renders only the given items and no not-advice block", () => {
    const html = renderToStaticMarkup(<RiskNote items={["風險一", "風險二"]} />);
    expect(html).toContain('data-risk="filled"');
    expect(html).toContain("<li>風險一</li><li>風險二</li>");
    expect(html).not.toContain('data-risk="not-advice"');
    expect(html).not.toContain(NOT_ADVICE_TEXT);
  });

  test("not-advice text is short and plain", () => {
    expect(NOT_ADVICE_TEXT).toBe("這篇是學習筆記，不是投資建議。加密資產波動很大，可能全部虧光；任何操作前先自己查證，只用輸得起的錢。");
  });
});
