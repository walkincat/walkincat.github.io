import { WarningIcon } from "./icons";

/** Fixed plain-language text shared by every post that has no risk_note of its own. */
export const NOT_ADVICE_TEXT = "這篇是學習筆記，不是投資建議。加密資產波動很大，可能全部虧光；任何操作前先自己查證，只用輸得起的錢。";

/** Shared "not investment advice" block, shown on post pages whose risk_note is empty. */
export function NotAdviceNote() {
  return (
    <section className="wc-risk wc-risk--plain" aria-labelledby="risk-title" data-risk="not-advice">
      <h2 className="wc-risk__head" id="risk-title">
        <WarningIcon />
        非投資建議
      </h2>
      <p className="wc-risk__plain-text">{NOT_ADVICE_TEXT}</p>
    </section>
  );
}
