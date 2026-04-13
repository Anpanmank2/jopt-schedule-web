import Image from "next/image";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border-default bg-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8 flex items-center justify-between gap-4">
        <Image
          src="/jopt-logo.png"
          alt="Japan Open Poker Tour"
          width={120}
          height={143}
          className="h-14 md:h-16 w-auto"
          priority={false}
        />
        <p className="text-[10px] md:text-xs text-text-muted text-right">
          © 2026 Japan Open Poker Tour
        </p>
      </div>
    </footer>
  );
}
