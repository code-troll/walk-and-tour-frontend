import { footerContent } from "@/lib/landing-data";
import Image from "next/image";

export default function Footer() {
  return (
    <footer id="blog" className="bg-black py-16 text-[#f5f1ec]">
      <div className="mx-auto w-full max-w-6xl px-6 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr_1fr_1.1fr]">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Walk and Tour</h3>
            <p className="text-sm text-[#e0d7ce]">{ footerContent.blurb }</p>
            <div className="space-y-2 text-sm text-[#e0d7ce]">
              <p>CVR: { footerContent.contact.cvr }</p>
              <p>Phone: { footerContent.contact.phone }</p>
              <p>Email: <a href={ "mailto:" + footerContent.contact.email }>{ footerContent.contact.email }</a></p>
            </div>
            <div className="flex gap-3">
              <a href="https://www.instagram.com/walkandtour.dk" target="_blank" rel="noopener noreferrer">
                <Image src="/walkandtour/instagram.png" alt={ "Instagram" } width={ 28 } height={ 28 }/>
              </a>
              <a href="https://www.facebook.com/walkandtour.dk" target="_blank" rel="noopener noreferrer">
                <Image src="/walkandtour/facebook.png" alt={ "Facebook" } width={ 28 } height={ 28 }/>
              </a>
              <a href="https://www.linkedin.com/company/walk-and-tour" target="_blank" rel="noopener noreferrer">
                <Image src="/walkandtour/linkedin.png" alt={ "Linkedin" } width={ 28 } height={ 28 }/>
              </a>
              <a href="https://www.tiktok.com/@walkandtour.dk" target="_blank" rel="noopener noreferrer">
                <Image src="/walkandtour/tiktok.png" alt={ "Tiktok" } width={ 28 } height={ 28 }/>
              </a>
            </div>
          </div>
          { footerContent.linkSections.map((section) => (
            <div key={ section.title } className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-[#f5f1ec]">
                { section.title }
              </h4>
              <ul className="space-y-2 text-sm text-[#e0d7ce]">
                { section.links.map((link) => (
                  <li key={ link.label }>
                    <a href={ link.href } className="hover:text-white">
                      { link.label }
                    </a>
                  </li>
                )) }
              </ul>
            </div>
          )) }
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-[#f5f1ec]">
              Subscribe
            </h4>
            <p className="text-sm text-[#e0d7ce]">
              Join our newsletter for new tours, travel tips, and updates.
            </p>
            <div className="space-y-3">
              <input
                type="email"
                placeholder="Email"
                className="w-full rounded-full border border-white/30 bg-transparent px-4 py-2 text-sm text-white placeholder:text-[#cbbfb3] focus:border-white focus:outline-none"
              />
              <label className="flex items-center gap-2 text-xs text-[#e0d7ce]">
                <input type="checkbox" className="h-4 w-4"/>
                I agree to receive Walk and Tour newsletter.
              </label>
              <button
                type="button"
                className="w-full btn-red-white px-4 py-2 text-sm font-semibold cursor-pointer"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-white/20 pt-6 text-sm text-[#e0d7ce]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>Copyright 2026 Walk and Tour Copenhagen. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#blog" className="hover:text-white">
                Privacy Policy
              </a>
              <a href="#blog" className="hover:text-white">
                Terms of Use
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
