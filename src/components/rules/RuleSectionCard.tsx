import type { RuleSection } from "@/data/rules-content";
import RuleIcon from "./RuleIcon";
import RuleBlockRenderer from "./RuleBlockRenderer";

type Props = {
  section: RuleSection;
  /** 「11 項目」等を locale 依存で渡す */
  orderedListAriaLabel?: string;
  emailLinkAriaLabel?: string;
};

export default function RuleSectionCard({
  section,
  orderedListAriaLabel,
  emailLinkAriaLabel,
}: Props) {
  return (
    <section
      id={section.id}
      aria-labelledby={`${section.id}-heading`}
      className="scroll-mt-20 rounded-md border border-border-default bg-white shadow-sm overflow-hidden"
    >
      <header className="flex items-center gap-2.5 md:gap-3 border-b border-border-default bg-blue-50/40 px-3.5 md:px-5 py-2.5 md:py-3">
        <span className="shrink-0 inline-flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-md bg-blue-900 text-white">
          <RuleIcon
            iconKey={section.iconKey}
            className="h-[18px] w-[18px] md:h-5 md:w-5"
          />
        </span>
        <h2
          id={`${section.id}-heading`}
          className="text-base md:text-lg font-bold text-blue-900 leading-tight"
        >
          {section.title}
        </h2>
      </header>
      <div className="px-3.5 md:px-5 py-3.5 md:py-4 space-y-3 md:space-y-4">
        {section.blocks.map((block, i) => (
          <RuleBlockRenderer
            key={i}
            block={block}
            orderedListAriaLabel={orderedListAriaLabel}
            emailLinkAriaLabel={emailLinkAriaLabel}
          />
        ))}
      </div>
    </section>
  );
}
