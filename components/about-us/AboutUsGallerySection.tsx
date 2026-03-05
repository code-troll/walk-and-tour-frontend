import Image from "next/image";
import { useTranslations } from "next-intl";

import { aboutUsGalleryImages } from "@/lib/about-us-data";

export default function AboutUsGallerySection() {
  const t = useTranslations("aboutUs.gallery");

  return (
    <section className="bg-white py-16">
      <div className="mx-auto w-full max-w-6xl px-6 lg:px-12">
        <div className="grid gap-4 md:grid-cols-3">
          { aboutUsGalleryImages.map((item) => (
            <figure
              key={ item.id }
              className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-[#e8ddd2]"
            >
              <Image
                src={ item.imageSrc }
                alt={ t(`items.${ item.id }.imageAlt`) }
                width={ item.imageWidth }
                height={ item.imageHeight }
                className="h-64 w-full object-cover md:h-72"
              />
            </figure>
          )) }
        </div>
      </div>
    </section>
  );
}
