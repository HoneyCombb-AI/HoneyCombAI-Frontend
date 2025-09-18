import Link from 'next/link';
import React from 'react';
import { Linkedin } from 'lucide-react';


const resourcesLinks = [
  { text: "FAQ", href: "/#faq" },
];

const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const isExternal = href.startsWith('http');
  const commonClasses = "text-base text-white hover:text-[#F5E617] hover:underline";

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={commonClasses}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={commonClasses}>
      {children}
    </Link>
  );
};


const FooterColumn = ({ title, links }: { title: string; links: { text: string; href: string }[] }) => (
  <div>
    <h3 className="text-base font-bold text-white mb-6">{title}</h3>
    <ul className="space-y-4">
      {links.map((link) => (
        <li key={link.text}>
          <FooterLink href={link.href}>{link.text}</FooterLink>
        </li>
      ))}
    </ul>
  </div>
);

export default function Footer() {
  return (
    <footer className="bg-black">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex flex-col lg:flex-row justify-between gap-8">
          <div className="lg:w-1/3">
            <Link href="/" className="inline-block">
            <div className="flex items-center gap-2">
            <span className="font-bold text-xl bg-gradient-to-r from-amber-600 to-yellow-500 bg-clip-text text-transparent tracking-tight">
              HoneyComb
            </span>

            <span className="text-sm font-medium text-white">
              AI
            </span>
          </div>
            </Link>
            <p className="mt-6 text-base text-gray-300">
              <em className="font-normal italic">We are not interested in using AI to replace humans.</em>
              <br />
              <em className="font-normal italic">Rather, we are helping humans achieve what is impossible without AI.</em>
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-8 lg:w-1/2">
            {/* <FooterColumn title="COMPANY" links={companyLinks} /> */}
            <FooterColumn title="RESOURCES" links={resourcesLinks} />
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <a href="https://www.linkedin.com/in/ankush-nagathan-100946308/" target="_blank" rel="noopener noreferrer">
              <Linkedin className="h-6 w-6 text-white hover:text-[#F5E617] transition-colors" />
              <span className="sr-only">LinkedIn</span>
            </a>
          </div>
          <div className="text-sm text-gray-400 text-center sm:text-right">
            <p>
              © 2025 Honeycomb AI
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}