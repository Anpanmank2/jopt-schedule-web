import HomeLink from "./HomeLink";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Header() {
  return (
    <div className="bg-blue-50/80 backdrop-blur border-b border-blue-200/60">
      <div className="max-w-6xl mx-auto px-3 md:px-8 py-1.5 md:py-2 flex items-center justify-between gap-2">
        <HomeLink />
        <LanguageSwitcher />
      </div>
    </div>
  );
}
