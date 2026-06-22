import Link from "next/link";

export default function DashCard({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-violet-500/50 hover:bg-white/10"
    >
      <div className="text-base font-semibold">
        {icon} {title}
      </div>
      <p className="mt-1 text-sm text-slate-400">{desc}</p>
    </Link>
  );
}
