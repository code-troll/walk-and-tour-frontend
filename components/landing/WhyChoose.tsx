import { whyChoose } from "@/lib/landing-data";
import { CheckIcon } from "lucide-react";

export default function WhyChoose() {
  return (
    <section id="about" className="bg-[#f8f4ef] py-16">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 xl:grid-cols-[1.1fr_0.9fr] lg:px-12">
        <div className="order-1 col-span-2 sm:col-span-1">
          <h2 className="mt-3 text-3xl font-semibold text-teal sm:text-4xl">
            { whyChoose.heading }
          </h2>
          <p className="mt-4 text-xl font-semibold">
            { whyChoose.description }
          </p>
        </div>
        <div className="order-2 space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/10 col-span-2 sm:col-span-1">
          { whyChoose.bullets.map((bullet) => (
            <div key={ bullet } className="flex gap-3 text-base">
              <CheckIcon className="text-red"/>
              <p>{ bullet }</p>
            </div>
          )) }
        </div>
        <div className="order-3 col-span-2">
          <script src="https://elfsightcdn.com/platform.js" async></script>
          <div className="elfsight-app-c976affe-b00e-4af3-b550-53dd2fb36e1b" data-elfsight-app-lazy></div>
        </div>
      </div>
    </section>
  );
}
