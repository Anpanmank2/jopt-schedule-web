import type {
  Highlight,
  RuleBlock,
  RuleCallout,
  RuleEmailLink,
  RuleOrderedList,
  RuleParagraph,
} from "@/data/rules-content";
import { CalloutIcon, MailIcon } from "./RuleIcon";

/**
 * 本文中の highlights を <strong> 化する。
 * 同じ phrase が複数回出ても全て置換。highlights 配列順に長い phrase から処理して
 * 部分マッチ問題を回避する。
 */
function renderWithHighlights(
  text: string,
  highlights?: Highlight[]
): React.ReactNode[] {
  if (!highlights || highlights.length === 0) return [text];

  // 長い phrase 優先で sort（短い phrase が長い phrase の一部に含まれる場合の誤マッチ防止）
  const sorted = [...highlights].sort(
    (a, b) => b.phrase.length - a.phrase.length
  );

  let segments: Array<{ text: string; bold: boolean }> = [
    { text, bold: false },
  ];

  for (const { phrase } of sorted) {
    if (!phrase) continue;
    const next: typeof segments = [];
    for (const seg of segments) {
      if (seg.bold) {
        next.push(seg);
        continue;
      }
      const parts = seg.text.split(phrase);
      for (let i = 0; i < parts.length; i++) {
        if (parts[i]) next.push({ text: parts[i], bold: false });
        if (i < parts.length - 1) next.push({ text: phrase, bold: true });
      }
    }
    segments = next;
  }

  return segments.map((seg, i) =>
    seg.bold ? (
      <strong key={i} className="font-semibold text-text-primary">
        {seg.text}
      </strong>
    ) : (
      <span key={i}>{seg.text}</span>
    )
  );
}

function ParagraphBlock({ block }: { block: RuleParagraph }) {
  return (
    <p className="text-sm md:text-[15px] leading-relaxed text-text-secondary">
      {renderWithHighlights(block.text, block.highlights)}
    </p>
  );
}

function CalloutBlock({ block }: { block: RuleCallout }) {
  const isWarning = block.tone === "warning";
  const wrapper = isWarning
    ? "border border-amber-300 bg-amber-50/80 text-amber-900"
    : "border border-blue-200 bg-blue-50/80 text-blue-900";
  const iconColor = isWarning ? "text-amber-600" : "text-blue-700";
  return (
    <div
      className={`flex items-start gap-2.5 rounded-md px-3 py-2.5 md:px-4 md:py-3 ${wrapper}`}
      role={isWarning ? "alert" : undefined}
    >
      <CalloutIcon
        tone={block.tone}
        className={`shrink-0 mt-0.5 h-4 w-4 md:h-[18px] md:w-[18px] ${iconColor}`}
      />
      <p className="text-[13px] md:text-sm font-semibold leading-relaxed">
        {block.text}
      </p>
    </div>
  );
}

function OrderedListBlock({
  block,
  ariaLabel,
}: {
  block: RuleOrderedList;
  ariaLabel: string;
}) {
  return (
    <ol className="space-y-3 md:space-y-3.5 list-none p-0" aria-label={ariaLabel}>
      {block.items.map((item, i) => (
        <li
          key={i}
          className="flex gap-2.5 md:gap-3 rounded-md bg-bg-secondary/60 px-3 py-2.5 md:px-3.5 md:py-3"
        >
          <span
            className="shrink-0 inline-flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-full bg-blue-100 text-blue-900 text-[11px] md:text-xs font-bold tabular-nums"
            aria-hidden
          >
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-[13px] md:text-sm font-bold text-text-primary leading-snug">
              {item.subject}
            </h3>
            <p className="mt-1 text-[13px] md:text-[14.5px] leading-relaxed text-text-secondary break-words">
              {renderWithHighlights(item.body, item.highlights)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function EmailLinkBlock({
  block,
  ariaLabel,
}: {
  block: RuleEmailLink;
  ariaLabel: string;
}) {
  return (
    <div className="rounded-md border border-blue-200 bg-blue-50/70 px-3.5 py-3 md:px-4 md:py-3.5">
      <div className="flex items-start gap-2.5">
        <MailIcon className="shrink-0 mt-0.5 h-4 w-4 md:h-[18px] md:w-[18px] text-blue-700" />
        <p className="text-[13px] md:text-sm leading-relaxed text-text-secondary break-words">
          <span>{block.prefix}</span>
          <a
            href={`mailto:${block.email}`}
            aria-label={ariaLabel}
            className="font-semibold text-blue-800 underline decoration-blue-300 hover:decoration-blue-700 hover:text-blue-900 break-all"
          >
            {block.email}
          </a>
          <span>{block.suffix}</span>
        </p>
      </div>
    </div>
  );
}

type Props = {
  block: RuleBlock;
  /** ordered-list / email-link で使う aria-label (locale 依存) */
  orderedListAriaLabel?: string;
  emailLinkAriaLabel?: string;
};

export default function RuleBlockRenderer({
  block,
  orderedListAriaLabel,
  emailLinkAriaLabel,
}: Props) {
  switch (block.type) {
    case "paragraph":
      return <ParagraphBlock block={block} />;
    case "callout":
      return <CalloutBlock block={block} />;
    case "ordered-list":
      return (
        <OrderedListBlock
          block={block}
          ariaLabel={orderedListAriaLabel ?? "Ordered list"}
        />
      );
    case "email-link":
      return (
        <EmailLinkBlock
          block={block}
          ariaLabel={emailLinkAriaLabel ?? `Send email to ${block.email}`}
        />
      );
  }
}
