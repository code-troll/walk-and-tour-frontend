import Link from "next/link";
import { CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const isSuccess = tone === "success";

  return (
    <main className="min-h-screen bg-muted/30 px-6 py-12 sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-2xl items-center justify-center">
        <div className="w-full rounded-xl border border-border bg-card p-8 shadow-lg sm:p-10">
          {/* Icon */ }
          <div
            className={ cn(
              "inline-flex h-12 w-12 items-center justify-center rounded-full align-middle mr-2",
              isSuccess ? "bg-primary/10" : "bg-destructive/10"
            ) }
          >
            { isSuccess ? (
              <CheckCircle2 className="h-7 w-7 text-primary"/>
            ) : (
              <XCircle className="h-7 w-7 text-destructive"/>
            ) }
          </div>

          {/* Badge */ }
          <span
            className={ cn(
              "mt-6 inline-flex rounded-full px-3 py-1 text-xs font-medium",
              isSuccess
                ? "bg-primary/10 text-primary"
                : "bg-destructive/10 text-destructive"
            ) }
          >
            { isSuccess ? "Newsletter updated" : "Newsletter issue" }
          </span>

          {/* Content */ }
          <h1
            className={ cn(
              "mt-4 text-2xl font-semibold tracking-tight text-balance sm:text-3xl",
              isSuccess ? "text-foreground" : "text-destructive"
            ) }
          >
            { title }
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            { body }
          </p>

          {/* Actions */ }
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <ArrowLeft className="h-4 w-4"/>
              Return home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
