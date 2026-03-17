"use client";

import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#fcfaf7] px-6 py-12">
      <div className="text-center">
        {/* 404 text */ }
        <h1 className="text-8xl font-bold tracking-tight text-[#5b4d3c]">
          404
        </h1>

        {/* Clever tour guide message */ }
        <h2 className="mt-4 text-2xl font-semibold text-[#2b666d]">
          Looks like you wandered off the trail
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[#5b4d3c]">
          Even the best explorers get lost sometimes. This destination
          doesn&apos;t exist on our map — but don&apos;t worry, we&apos;ll help
          you find your way back.
        </p>

        {/* CTA button */ }
        <Link href="/" className="flex flex-row justify-center items-center">
          <button
            className="mt-8 bg-[#2b666d] px-6 py-3 text-[#ffffff] hover:bg-[#2b666d]/90 flex flex-row cursor-pointer rounded-xl">
            <Home className="mr-2 mt-1 h-4 w-4"/>
            Return to Base Camp
          </button>
        </Link>

        {/* Fun footer text */ }
        <p className="mt-12 text-sm text-[#5b4d3c]/60">
          Pro tip: The journey is the destination... just not this one.
        </p>
      </div>
    </main>
  );
}
