import type { RuleSection } from "@/data/rules-content";
import RuleIcon from "./RuleIcon";

type Props = {
  sections: RuleSection[];
  /** 「目次」等の見出し (locale 依存) */
  label: string;
};

/**
 * 目次。
 * - desktop (lg:): 左カラムに sticky 配置
 * - tablet/mobile: 上部に横並び chip リスト
 */
export default function RuleTOC({ sections, label }: Props) {
  return (
    <nav aria-label={label} className="rules-toc">
      {/* desktop sticky panel */}
      <div className="hidden lg:block sticky top-20">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
          {label}
        </p>
        <ul className="space-y-1">
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-secondary hover:text-blue-900 hover:bg-blue-50/70 transition-colors"
              >
                <RuleIcon
                  iconKey={s.iconKey}
                  className="h-4 w-4 text-blue-700 group-hover:text-blue-900"
                />
                <span className="leading-tight">{s.title}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* tablet/mobile chip row */}
      <div className="lg:hidden">
        <p className="sr-only">{label}</p>
        <ul className="flex flex-wrap gap-1.5">
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white px-2.5 py-1 text-[11px] md:text-xs font-semibold text-blue-900 hover:bg-blue-50 transition-colors no-underline"
              >
                <RuleIcon
                  iconKey={s.iconKey}
                  className="h-3.5 w-3.5 text-blue-700"
                />
                <span>{s.title}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
