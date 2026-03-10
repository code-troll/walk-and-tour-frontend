import { footerContent } from "@/lib/landing-data";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { type AppLocale } from "@/i18n/routing";
import { getInternalHref } from "@/lib/internal-paths";

export default function Footer() {
  const t = useTranslations("footer");
  const locale = useLocale() as AppLocale;
  const privacyHref = getInternalHref({
    locale,
    target: {kind: "homeSection", section: "blog"},
  });
  const termsHref = getInternalHref({
    locale,
    target: {kind: "page", page: "/terms-of-use"},
  });

  return (
    <footer id="blog" className="bg-black py-16 text-[#f5f1ec]">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr_1fr_1.1fr]">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{ t("brandName") }</h3>
            <p className="text-base text-[#e0d7ce]">{ t(footerContent.blurbKey) }</p>
            <div className="space-y-2 text-base text-[#e0d7ce]">
              <p>{ t("labels.cvr") }: { footerContent.contact.cvr }</p>
              <p>{ t("labels.phone") }: { footerContent.contact.phone }</p>
              <p>{ t("labels.email") }: <a
                href={ "mailto:" + footerContent.contact.email }>{ footerContent.contact.email }</a></p>
            </div>
            <div className="flex gap-3">
              <a href="https://www.instagram.com/walkandtour.dk" target="_blank" rel="noopener noreferrer">
                <Image src="/walkandtour/social/color/instagram.png" alt={ t("social.instagram") } width={ 28 }
                       height={ 28 }/>
              </a>
              <a href="https://www.facebook.com/walkandtour.dk" target="_blank" rel="noopener noreferrer">
                <Image src="/walkandtour/social/color/facebook.png" alt={ t("social.facebook") } width={ 28 }
                       height={ 28 }/>
              </a>
              <a href="https://www.linkedin.com/company/walk-and-tour" target="_blank" rel="noopener noreferrer">
                <Image src="/walkandtour/social/color/linkedin.png" alt={ t("social.linkedin") } width={ 28 }
                       height={ 28 }/>
              </a>
              <a href="https://www.tiktok.com/@walkandtour.dk" target="_blank" rel="noopener noreferrer">
                <Image src="/walkandtour/social/color/tiktok.png" alt={ t("social.tiktok") } width={ 28 }
                       height={ 28 }/>
              </a>
              <a
                href="https://www.tripadvisor.com/Attraction_Review-g189541-d33403499-Reviews-Walk_and_Tour-Copenhagen_Zealand.html"
                target="_blank" rel="noopener noreferrer">
                <Image src="/walkandtour/social/color/tripadvisor.png" alt={ t("social.tiktok") } width={ 28 }
                       height={ 28 }/>
              </a>
            </div>
          </div>
          { footerContent.linkSections.map((section) => (
            <div key={ section.id } className="space-y-3">
              <h4 className="text-base font-semibold uppercase tracking-wide text-[#f5f1ec]">
                { t(`sections.${ section.id }.title`) }
              </h4>
              <ul className="space-y-2 text-base text-[#e0d7ce]">
                { section.links.map((link) => (
                  <li key={ link.id }>
                    <a
                      href={ getInternalHref({locale, target: link.target}) }
                      className="hover:text-white"
                    >
                      { t(`sections.${ section.id }.links.${ link.id }`) }
                    </a>
                  </li>
                )) }
              </ul>
            </div>
          )) }
          <div className="space-y-4">
            <h4 className="text-base font-semibold uppercase tracking-wide text-[#f5f1ec]">
              { t("newsletter.title") }
            </h4>
            <p className="text-base text-[#e0d7ce]">
              { t("newsletter.description") }
            </p>
            <div className="space-y-3">
              <input
                type="email"
                placeholder={ t("newsletter.emailPlaceholder") }
                className="w-full rounded-full border border-white/30 bg-transparent px-4 py-2 text-base text-white placeholder:text-[#cbbfb3] focus:border-white focus:outline-none"
              />
              <label className="flex items-center gap-2 text-sm text-[#e0d7ce]">
                <input type="checkbox" className="h-4 w-4"/>
                { t("newsletter.consent") }
              </label>
              <button
                type="button"
                className="w-full btn-red-white px-4 py-2 text-base font-semibold cursor-pointer"
              >
                { t("newsletter.submit") }
              </button>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-white/20 pt-6 text-base text-[#e0d7ce]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>{ t("copyright") }</p>
            <div className="flex gap-6">
              <a href={ privacyHref } className="hover:text-white">
                { t("legal.privacyPolicy") }
              </a>
              <a href={ termsHref } className="hover:text-white">
                { t("legal.termsOfUse") }
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
