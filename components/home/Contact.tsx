import { useTranslations } from "next-intl";

import ContactForm from "@/components/contact/ContactForm";
import { contactInfo } from "@/lib/landing-data";

export default function Contact() {
  const t = useTranslations("contact");

  return (
    <section id="contact" className="bg-[#fcfaf7] py-16">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h2 className="mt-3 text-3xl font-semibold text-teal sm:text-4xl">
              { t(contactInfo.headingKey) }
            </h2>
            <p className="mt-4 text-xl font-semibold">
              { t(contactInfo.subheadingKey) }
            </p>
          </div>
          <ContactForm/>
        </div>
      </div>
    </section>
  );
}
