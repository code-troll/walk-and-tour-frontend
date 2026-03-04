import Image from "next/image";
import type { Tour } from "@/lib/landing-data";

const StarIcon = () => (
  <svg
    viewBox="0 0 20 20"
    aria-hidden="true"
    className="h-4 w-4 fill-[#d4a73d]"
  >
    <path d="M10 1.5l2.5 5.07 5.6.81-4.05 3.94.96 5.58L10 14.98l-5.01 2.92.96-5.58L1.9 7.38l5.6-.81L10 1.5z"/>
  </svg>
);

export default function TourCard({tour}: { tour: Tour }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/10">
      <div className="relative">
        <Image
          src={ tour.image.src }
          alt={ tour.image.alt }
          width={ 640 }
          height={ 480 }
          className="h-48 w-full object-cover"
        />
        <span
          className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#3d3124]">
          { tour.tag }
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-6">
        <h3 className="text-lg font-semibold text-[#2a221a]">
          { tour.title }
        </h3>
        <div className="grid grid-cols-2 mt-auto gap-3 text-sm text-[#5b4d3c]">
          <div>
            <p className="text-xs uppercase tracking-wide text-[#8a7562]">
              Duration
            </p>
            <p className="font-semibold text-[#3d3124]">{ tour.duration }</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[#8a7562]">
              Location
            </p>
            <p className="font-semibold text-[#3d3124]">{ tour.location }</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#5b4d3c]">
          <StarIcon/>
          <span className="font-semibold text-[#3d3124]">{ tour.rating }</span>
          <span className="text-[#8a7562]">/5</span>
          <span className="text-[#8a7562]">({ tour.reviews } reviews)</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-[#8a7562]">
              Price
            </p>
            <p className="text-lg font-semibold text-[#2a221a]">
              { tour.price } { tour.currency }
            </p>
          </div>
          <a
            href="#contact"
            className="btn-red-black px-4 py-2 text-sm font-semibold transition-colors"
          >
            Details
          </a>
        </div>
      </div>
    </article>
  );
}
