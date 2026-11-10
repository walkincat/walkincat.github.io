import { WarningIcon } from "./icons";

/**
 * risk_note block. An empty risk_note renders the fixed "待補" state; this
 * component never generates risk text of its own.
 */
export function RiskNote({ items }: { items: readonly string[] }) {
  if (items.length === 0) {
    return (
      <section className="wc-risk wc-risk--pending" aria-labelledby="risk-title" data-risk="pending">
        <h2 className="wc-risk__head" id="risk-title">
          <WarningIcon />
          風險提醒
          <span className="wc-badge wc-badge--pending">待補</span>
        </h2>
        <p className="wc-risk__pending-text">此篇風險說明待補，閱讀時請自行評估</p>
      </section>
    );
  }
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
