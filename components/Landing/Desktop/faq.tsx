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
    question: "What to expect on the 15-min demo call?",
    answer:
      "During the call, we'll upload the accounts you're currently working on. Within just 15 minutes, you'll see a full view of Honeycomb in action, complete with account details, signals, and insights tailored to your pipeline.",
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
      <div className="container py-24 lg:py-30">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-12 lg:gap-x-24 items-start">
          <div>
            <h2
              id="faq"
              className="mt-4 text-[48px] font-bold tracking-tight text-white leading-tight scroll-mt-28"
            >
              Common Questions
            </h2>
            <div className="mt-4 text-xl text-gray-300 leading-8 !whitespace-pre-line !whitespace-pre-line !whitespace-pre-line">
              Anything you need to know about the product. Can't find the answer
              you're looking for? Reach out at ankush@honeycombai.in
            </div>
          </div>
          <div>
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
                  <AccordionContent className="text-base text-gray-300 leading-relaxed pr-8">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}
