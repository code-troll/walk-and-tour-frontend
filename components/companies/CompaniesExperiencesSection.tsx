import { useTranslations } from "next-intl";

import { companyExperiences } from "@/lib/companies-data";
import CompanyListingCard from "@/components/companies/CompanyListingCard";

export default function CompaniesExperiencesSection() {
  const t = useTranslations("companiesPage");

  return (
    <section className="bg-[#fcfaf7] py-16">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mt-3 text-3xl font-semibold text-teal sm:text-4xl">
            { t("intro.title") }
          </h2>
          <p className="mt-5 text-base leading-7 text-[#3d3124] md:text-lg">
            { t("intro.description") }
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          { companyExperiences.map((experience) => (
            <CompanyListingCard key={ experience.id } experience={ experience }/>
          )) }
        </div>
      </div>
    </section>
  );
}
