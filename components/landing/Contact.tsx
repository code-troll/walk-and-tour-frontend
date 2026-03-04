"use client";

import { useState } from "react";
import PhoneInput, { type Value } from "react-phone-number-input";
import { contactInfo } from "@/lib/landing-data";

export default function Contact() {
  const [phone, setPhone] = useState<Value | undefined>();
  const fieldClassName =
    "mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 text-sm text-[#2a221a] placeholder:text-[#b5a695] focus:border-[#2a221a] focus:outline-none";
  const phoneWrapperClassName =
    "mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-[#2a221a] focus-within:border-[#2a221a]";
  const phoneInputClassName =
    "w-full bg-transparent text-sm text-[#2a221a] placeholder:text-[#b5a695] focus:outline-none";

  return (
    <section id="contact" className="bg-[#fcfaf7] py-16">
      <div className="mx-auto w-full max-w-6xl px-6 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h2 className="mt-3 text-3xl font-semibold text-teal sm:text-4xl">
              { contactInfo.heading }
            </h2>
            <p className="mt-4 text-xl font-semibold">
              { contactInfo.subheading }
            </p>
          </div>
          <form className="space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/10">
            <div>
              <input
                type="text"
                placeholder="Your name"
                className={ fieldClassName }
              />
            </div>
            <div>
              <PhoneInput
                defaultCountry="DK"
                placeholder="Your phone"
                value={ phone }
                onChange={ setPhone }
                className={ phoneWrapperClassName }
                numberInputProps={{
                  className: phoneInputClassName,
                }}
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="Your email"
                className={ fieldClassName }
              />
            </div>
            <div>
              <textarea
                rows={ 4 }
                placeholder="Your message"
                className={ fieldClassName }
              />
            </div>
            <button
              type="button"
              className="w-full btn-red-black px-6 py-3 text-sm font-semibold uppercase tracking-wide transition-colors"
            >
              Send message
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
