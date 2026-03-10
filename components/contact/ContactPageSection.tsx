import { useTranslations } from "next-intl";
import { MapPin, Phone, Mail } from "lucide-react";

import ContactForm from "@/components/contact/ContactForm";
import { contactInfo } from "@/lib/landing-data";

const googleMapsAddressHref =
  `https://www.google.com/maps/search/?api=1&query=${ encodeURIComponent(contactInfo.address) }`;

type ContactDetail = {
  id: "address" | "phone" | "email";
  labelKey: "info.address.label" | "info.phone.label" | "info.email.label";
  value: string;
  href?: string;
  icon: typeof MapPin;
};

const contactDetails: readonly ContactDetail[] = [
  {
    id: "address",
    labelKey: "info.address.label",
    value: contactInfo.address,
    href: googleMapsAddressHref,
    icon: MapPin,
  },
  {
    id: "phone",
    labelKey: "info.phone.label",
    value: contactInfo.phone,
    href: `tel:${ contactInfo.phone.replace(/\s+/g, "") }`,
    icon: Phone,
  },
  {
    id: "email",
    labelKey: "info.email.label",
    value: contactInfo.email,
    href: `mailto:${ contactInfo.email }`,
    icon: Mail,
  },
] as const;

export default function ContactPageSection() {
  const t = useTranslations("contact");

  return (
    <section className="bg-[#d8c8b7]/30 py-16">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
        <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
          <h2 className="text-3xl font-semibold text-[#2b666d] sm:text-4xl">
            { t(contactInfo.detailsHeadingKey) }
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#5b4d3c] md:text-lg">
            { t(contactInfo.detailsDescriptionKey) }
          </p>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col gap-4">
            { contactDetails.map((detail) => {
              const Icon = detail.icon;
              const content = (
                <div
                  className="flex items-start gap-4 rounded-3xl border border-[#d8c8b7] bg-[#ffffff] p-5 transition-colors hover:border-[#2b666d]">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2b666d]/10">
                    <Icon className="h-5 w-5 text-[#2b666d]"/>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-[#5b4d3c]">
                      { t(detail.labelKey) }
                    </p>
                    <p className="text-base font-semibold text-[#000000]">
                      { detail.value }
                    </p>
                  </div>
                </div>
              );

              return detail.href ? (
                <a
                  key={ detail.id }
                  href={ detail.href }
                  target={ detail.id === "address" ? "_blank" : undefined }
                  rel={ detail.id === "address" ? "noopener noreferrer" : undefined }
                  className="group block"
                >
                  { content }
                </a>
              ) : (
                <div key={ detail.id }>{ content }</div>
              );
            }) }
          </div>

          <ContactForm/>
        </div>
      </div>
    </section>
  );
}
