import { WarningIcon } from "./icons";
import { NotAdviceNote } from "./NotAdviceNote";

/**
 * risk_note block. An empty risk_note renders the shared NotAdviceNote; this
 * component never generates article-specific risk text.
 */
export function RiskNote({ items }: { items: readonly string[] }) {
  if (items.length === 0) return <NotAdviceNote />;
  return (
    <section className="wc-risk wc-risk--normal" aria-labelledby="risk-title" data-risk="filled">
      <h2 className="wc-risk__head" id="risk-title">
        <WarningIcon />
        風險提醒
      </h2>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="wc-risk__foot">以上為教學說明，非投資建議。</p>
    </section>
  );
}

export function PendingBadge() {
  return (
    <span className="wc-badge wc-badge--pending">
      <WarningIcon />
      風險說明待補
    </span>
  );
}
