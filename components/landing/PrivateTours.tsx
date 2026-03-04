import Image from "next/image";
import { privateTours } from "@/lib/landing-data";

export default function PrivateTours() {
  return (
    <section id="private" className="bg-[#fcfaf7] py-16">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 lg:px-12">
        <div className="order-1 flex flex-col text-center gap-4 lg:order-2">
          <h2 className="text-3xl font-semibold text-teal  sm:text-4xl">
            { privateTours.heading }
          </h2>
          { privateTours.description.map((value, key) => <p key={ key }
                                                            className="text-xl font-semibold">{ value }</p>) }
          <div>
            <a
              href={ privateTours.ctaHref }
              className="inline-flex btn-red-black px-6 py-3 text-sm font-semibold uppercase tracking-wide transition-colors"
            >
              { privateTours.ctaLabel }
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
