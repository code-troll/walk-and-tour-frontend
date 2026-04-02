"use client";

import Link from "next/link";
import { Home, RotateCcw } from "lucide-react";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#fcfaf7] px-6 py-12">
      <div className="text-center">
        {/* Error text */}
        <h1 className="text-8xl font-bold tracking-tight text-[#5b4d3c]">
          500
        </h1>

        {/* Tour guide message */}
        <h2 className="mt-4 text-2xl font-semibold text-[#2b666d]">
          We hit a bump in the road
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[#5b4d3c]">
          Something unexpected happened on our end. Don&apos;t worry — our team
          is on it. In the meantime, you can try again or head back to safety.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-row justify-center items-center gap-4">
          <button
            onClick={reset}
            className="mt-8 bg-[#2b666d] px-6 py-3 text-[#ffffff] hover:bg-[#2b666d]/90 flex flex-row cursor-pointer rounded-xl"
          >
            <RotateCcw className="mr-2 mt-1 h-4 w-4" />
            Try Again
          </button>
          <Link href="/" className="flex flex-row justify-center items-center">
            <button className="mt-8 border border-[#2b666d] px-6 py-3 text-[#2b666d] hover:bg-[#2b666d]/10 flex flex-row cursor-pointer rounded-xl">
              <Home className="mr-2 mt-1 h-4 w-4" />
              Return to Base Camp
            </button>
          </Link>
        </div>

        {/* Fun footer text */}
        <p className="mt-12 text-sm text-[#5b4d3c]/60">
          Even the best tours have the occasional detour.
        </p>
      </div>
    </main>
  );
}
