import { tours } from "@/lib/landing-data";
import TourCard from "@/components/home/TourCard";

export default function Tours() {
  return (
    <section id="tours" className="bg-[#fcfaf7] py-16">
      <div className="mx-auto w-full max-w-6xl px-6 lg:px-12">
        <div className="flex flex-col gap-4 text-center">
          <h2 className="text-3xl font-extrabold text-teal sm:text-4xl">
            Choose the Perfect Tour for Your Visit
          </h2>
          <p className="mx-auto text-xl font-semibold">
            Whether you’re interested in history, architecture, food, royal palaces or day trips, we have the perfect
            experience waiting for you.
          </p>
          <p className="mx-auto text-xl font-semibold">
            Explore Copenhagen your way — with small groups, expert guides and flexible options designed for every
            traveler.
          </p>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          { tours.map((tour) => (
            <TourCard key={ tour.title } tour={ tour }/>
          )) }
        </div>
        <div className="mt-10 flex justify-center">
          <a
            href="#tours"
            className="rounded-full border border-[#2a221a] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-[#2a221a] transition-colors hover:bg-[#2a221a] hover:text-white"
          >
            Explore all our tours
          </a>
        </div>
      </div>
    </section>
  );
}
