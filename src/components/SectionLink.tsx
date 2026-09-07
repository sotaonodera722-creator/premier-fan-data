import Link from "next/link";

// The "→" link beside a section heading. Set at 14px it is a 20px-tall tap
// target, which is half of what a thumb needs; the negative margin lets it claim
// 44px of touchable height without pushing the heading's baseline around.
export default function SectionLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`-my-3 inline-flex min-h-[44px] shrink-0 items-center rounded-sm py-3 text-sm font-medium text-accent-2 transition hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`}
    >
      {children}
    </Link>
  );
}
