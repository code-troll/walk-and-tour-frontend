import { useTranslations } from "next-intl";

type TermsSubsectionId =
  | "freeTours"
  | "groups"
  | "modificationOfDate"
  | "delays"
  | "considerations";

type TermsSectionId =
  | "introduction"
  | "useOfWebsite"
  | "bookingAndPayments"
  | "cancellationsAndRefunds"
  | "intellectualProperty"
  | "limitationOfLiability"
  | "privacyPolicy"
  | "externalLinks"
  | "changesToTerms"
  | "contactInformation";

type TermsContactDetail = {
  label: string;
  value: string;
  href?: string;
};

type TermsSubsection = {
  title: string;
  paragraphs: string[];
};

type TermsSection = {
  title: string;
  paragraphs: string[];
  subsections?: Record<TermsSubsectionId, TermsSubsection>;
  companyName?: string;
  details?: TermsContactDetail[];
};

const sectionOrder: TermsSectionId[] = [
  "introduction",
  "useOfWebsite",
  "bookingAndPayments",
  "cancellationsAndRefunds",
  "intellectualProperty",
  "limitationOfLiability",
  "privacyPolicy",
  "externalLinks",
  "changesToTerms",
  "contactInformation",
];

const bookingSubsectionOrder: TermsSubsectionId[] = [
  "freeTours",
  "groups",
  "modificationOfDate",
  "delays",
  "considerations",
];

export default function TermsOfUseSection() {
  const t = useTranslations("termsOfUsePage");
  const sections = t.raw("sections") as Record<TermsSectionId, TermsSection>;

  return (
    <section className="bg-[#f8f4ef] py-6 sm:py-12">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
        <div className="rounded-4xl bg-white p-8 shadow-[0_24px_60px_rgba(42,34,26,0.08)] sm:p-10 lg:p-12">
          <p className="text-base leading-8 text-[#5a5047]">
            { t("intro") }
          </p>
          <div className="mt-10 space-y-10">
            { sectionOrder.map((sectionId) => {
              const section = sections[sectionId];

              return (
                <article key={ sectionId } className="space-y-4">
                  <h2 className="text-2xl font-semibold tracking-tight text-[#2a221a] sm:text-3xl">
                    { section.title }
                  </h2>
                  <div className="space-y-4 text-base leading-8 text-[#4a4038]">
                    { section.paragraphs.map((paragraph, index) => (
                      <p key={ `${ sectionId }-${ index }` }>{ paragraph }</p>
                    )) }
                  </div>

                  { sectionId === "bookingAndPayments" && section.subsections && (
                    <div className="space-y-8 pt-2">
                      { bookingSubsectionOrder.map((subsectionId) => {
                        const subsection = section.subsections?.[subsectionId];

                        if (!subsection) {
                          return null;
                        }

                        return (
                          <div
                            key={ subsectionId }
                            className="space-y-3 px-6 gap-y-2"
                          >
                            <h3 className="text-xl font-semibold text-[#2a221a]">
                              { subsection.title }
                            </h3>
                            <div className="space-y-3 text-base leading-8 text-[#4a4038]">
                              { subsection.paragraphs.map((paragraph, index) => (
                                <p key={ `${ subsectionId }-${ index }` }>{ paragraph }</p>
                              )) }
                            </div>
                          </div>
                        );
                      }) }
                    </div>
                  ) }

                  { sectionId === "contactInformation" && (
                    <>
                      { section.companyName && (
                        <p className="pt-2 text-lg font-semibold text-[#2a221a]">
                          { section.companyName }
                        </p>
                      ) }
                      { section.details && section.details.length > 0 && (
                        <dl className="space-y-3 text-base leading-8 text-[#4a4038]">
                          { section.details.map((detail) => (
                            <div
                              key={ `${ detail.label }-${ detail.value }` }
                              className="flex flex-col gap-1 sm:flex-row sm:gap-3"
                            >
                              <dt className="font-semibold text-[#2a221a]">
                                { detail.label }:
                              </dt>
                              <dd>
                                { detail.href
                                  ? (
                                    <a
                                      href={ detail.href }
                                      className="underline decoration-[#cf4633] underline-offset-4 hover:text-[#cf4633]"
                                    >
                                      { detail.value }
                                    </a>
                                  )
                                  : detail.value }
                              </dd>
                            </div>
                          )) }
                        </dl>
                      ) }
                    </>
                  ) }
                </article>
              );
            }) }
          </div>
        </div>
      </div>
    </section>
  );
}
