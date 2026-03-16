import Link from "next/link";

type NewsletterResultPageProps = {
  title: string;
  body: string;
  tone: "success" | "error";
};

export default function NewsletterResultPage({
  title,
  body,
  tone,
}: NewsletterResultPageProps) {
  const accentClassName =
    tone === "success"
      ? "bg-[#2b666d] text-white"
      : "bg-[#c24343] text-white";
  const titleClassName =
    tone === "success"
      ? "text-[#17383d]"
      : "text-[#5c2019]";

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fcfaf7_0%,#f4ece0_100%)] px-6 py-12 text-[#2a221a] sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-3xl items-center justify-center">
        <div className="w-full rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_24px_80px_rgba(42,34,26,0.12)] sm:p-10">
          <span className={ `inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${ accentClassName }` }>
            { tone === "success" ? "Newsletter updated" : "Newsletter issue" }
          </span>
          <h1 className={ `mt-6 text-3xl font-semibold tracking-tight sm:text-4xl ${ titleClassName }` }>
            { title }
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#5b4d3c] sm:text-lg">
            { body }
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-[#2a221a] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-opacity hover:opacity-90"
            >
              Return home
            </Link>
            <Link
              href="/#blog"
              className="inline-flex items-center justify-center rounded-full border border-[#2a221a]/15 bg-[#fcfaf6] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-[#2a221a] transition-colors hover:bg-[#f1e8db]"
            >
              Return to newsletter form
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
