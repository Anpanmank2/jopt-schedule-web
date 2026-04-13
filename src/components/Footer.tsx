import Image from "next/image";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border-default bg-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10 flex items-center justify-between gap-6">
        <Image
          src="/jopt-logo.png"
          alt="Japan Open Poker Tour"
          width={200}
          height={238}
          className="h-20 md:h-28 w-auto"
          priority={false}
        />
        <p className="text-[10px] md:text-xs text-text-muted text-right">
          © 2026 Japan Open Poker Tour
        </p>
      </div>
    </footer>
  );
}
