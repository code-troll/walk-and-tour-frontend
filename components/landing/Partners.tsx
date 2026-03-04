import Image from "next/image";
import { partners } from "@/lib/landing-data";

export default function Partners() {
  return (
    <section
      id="companies"
      className="relative bg-[url('/walkandtour/private-tours.png')] bg-cover bg-position-[50%_30%] py-16"
    >
      <div className="absolute inset-0 bg-black/35" aria-hidden="true"/>
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 lg:px-12">
        <div className="text-center">
          <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
            Our Partners
          </h2>
        </div>
        <div
          className="mt-10 grid grid-cols-2 place-items-center gap-6 rounded-3xl bg-transparent p-6 sm:grid-cols-3 lg:grid-cols-6">
          { partners.map((partner) => (
            <Image
              key={ partner.name }
              src={ partner.logo }
              alt={ partner.name }
              width={ 160 }
              height={ 120 }
              className="mx-auto h-28 w-auto rounded-lg object-contain"
            />
          )) }
        </div>
      </div>
    </section>
  );
}
