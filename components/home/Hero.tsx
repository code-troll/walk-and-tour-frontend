import { heroContent } from "@/lib/landing-data";

export default function Hero() {
  return (
    <section
      id="home"
      className="relative overflow-hidden bg-[#f8f4ef]"
      style={ {
        backgroundImage: `url(${ heroContent.image.src })`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      } }
    >
      <div className="absolute inset-0 bg-[#2a221a]/55" aria-hidden="true"/>
      <div className="relative mx-auto flex w-full max-w-6xl items-center justify-center px-6 py-20 lg:px-12 lg:py-28">
        <div className="max-w-6xl rounded-[2.5rem] p-8 text-center sm:p-10">
          <h1 className="text-5xl font-semibold leading-tight text-white sm:text-6xl">
            { heroContent.heading }
          </h1>
          <p className="mt-12 text-4xl text-white/90">
            { heroContent.subheading }
          </p>
          <div className="mt-12">
            <a
              href={ heroContent.ctaHref }
              className="btn-red-white inline-flex px-6 py-3 text-lg font-semibold uppercase tracking-wide transition-colors"
            >
              { heroContent.ctaLabel }
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
