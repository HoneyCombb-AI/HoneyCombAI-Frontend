"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqData = [
  {
    value: "item-1",
    question: "What to expect on the 30-min demo call?",
    answer:
      "During the call, we'll upload the accounts you're currently working on. Within just 30 minutes, you'll see a full view of Honeycomb in action, complete with account details, signals, and insights tailored to your pipeline.",
  },
  {
    value: "item-2",
    question: "Will it work for my ICP / Accounts?",
    answer:
      "Of course. Honeycomb is designed to work with any ICP or account list. We pull data from across the internet, so as long as your accounts have an online presence, Honeycomb will find relevant signals and insights for them.",
  },
  {
    value: "item-3",
    question: "What kind of signals can you find?",
    answer:
      "Any signal that matters to you. Unlike most tools that limit you to 5–10 pre-set triggers (like funding, M&A, or job changes), Honeycomb tracks anything available on the internet, so you're never boxed in.",
  },
];

export default function Faq() {
  return (
    <section className="bg-black">
      <div className="max-w-7xl mx-auto px-6 py-24 lg:py-30 flex flex-col lg:flex-row items-start lg:items-center gap-24">
        {/* Left side */}
        <div className="flex-1">
          <h2
            id="faq"
            className="text-[48px] font-bold tracking-tight text-white leading-tight scroll-mt-100"
          >
            Common Questions
          </h2>
          <p className="mt-4 text-xl text-gray-300 leading-8">
            Anything you need to know about the product. Can&apos;t find the answer
            you&apos;re looking for? Reach out at{" "}
            <span className="text-white">ankush@honeycombai.in</span>
          </p>
        </div>

        {/* Right side */}
        <div className="flex-1 w-full">
          <Accordion type="single" collapsible className="w-full">
            {faqData.map((faq, index) => (
              <AccordionItem
                key={index}
                value={faq.value}
                className="border-b border-white/10 last:border-b-0"
              >
                <AccordionTrigger className="py-6 text-left text-xl font-medium text-white hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-base text-gray-300 leading-relaxed pr-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
