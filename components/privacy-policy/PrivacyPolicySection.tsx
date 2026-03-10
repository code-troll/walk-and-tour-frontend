import { useTranslations } from "next-intl";

type PrivacyPolicySectionId =
  | "introduction"
  | "informationWeCollect"
  | "howWeUseYourInformation"
  | "dataSharingAndDisclosure"
  | "dataSecurity"
  | "cookiesAndTrackingTechnologies"
  | "yourRights"
  | "thirdPartyLinks"
  | "changesToThisPolicy"
  | "contactUs";

type PrivacyPolicyContactDetail = {
  label: string;
  value: string;
  href?: string;
};

type PrivacyPolicyListItem = {
  text: string;
  label?: string;
};

type PrivacyPolicyBlock =
  | {
    type: "paragraph";
    text: string;
  }
  | {
    type: "list";
    items: PrivacyPolicyListItem[];
  };

type PrivacyPolicySection = {
  title: string;
  blocks: PrivacyPolicyBlock[];
  companyName?: string;
  details?: PrivacyPolicyContactDetail[];
};

const sectionOrder: PrivacyPolicySectionId[] = [
  "introduction",
  "informationWeCollect",
  "howWeUseYourInformation",
  "dataSharingAndDisclosure",
  "dataSecurity",
  "cookiesAndTrackingTechnologies",
  "yourRights",
  "thirdPartyLinks",
  "changesToThisPolicy",
  "contactUs",
];

export default function PrivacyPolicySection() {
  const t = useTranslations("privacyPolicyPage");
  const sections = t.raw("sections") as Record<PrivacyPolicySectionId, PrivacyPolicySection>;

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
                    { section.blocks.map((block, blockIndex) => {
                      if (block.type === "paragraph") {
                        return <p key={ `${ sectionId }-paragraph-${ blockIndex }` }>{ block.text }</p>;
                      }

                      return (
                        <ul
                          key={ `${ sectionId }-list-${ blockIndex }` }
                          className="list-disc space-y-3 pl-6 marker:text-[#cf4633]"
                        >
                          { block.items.map((item, itemIndex) => (
                            <li key={ `${ sectionId }-item-${ itemIndex }` }>
                              { item.label && (
                                <span className="font-semibold text-[#2a221a]">
                                  { item.label }:
                                  {" "}
                                </span>
                              ) }
                              <span>{ item.text }</span>
                            </li>
                          )) }
                        </ul>
                      );
                    }) }
                  </div>

                  { sectionId === "contactUs" && (
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
