import type {ReactNode} from "react";

export function AdminNoticeCard({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-[#d8c5a8] bg-[#fcfaf6] p-8 shadow-[0_20px_60px_rgba(61,45,27,0.07)]">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9a6a2f]">{eyebrow}</p>
      <h2 className="mt-4 font-serif text-3xl text-[#21343b]">{title}</h2>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[#53656c]">{description}</p>
      {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
    </section>
  );
}

export function AdminSectionCard({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <section className="rounded-3xl border border-[#eadfce] bg-white p-6 shadow-[0_20px_50px_rgba(42,36,25,0.05)]">
      <div className="border-b border-[#f0e6d8] pb-4">
        <h2 className="text-xl font-semibold text-[#21343b]">{title}</h2>
        {description ? <p className="mt-2 text-sm text-[#627176]">{description}</p> : null}
      </div>
      <div className="pt-5">{children}</div>
    </section>
  );
}

export function AdminStatCard({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-[#eadfce] bg-[#fffcf7] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9a6a2f]">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-[#21343b]">{value}</p>
    </div>
  );
}
