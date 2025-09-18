import React from 'react';
import { CheckCircle } from 'lucide-react';

interface ListItem {
  text: string;
}

interface TimelineStep {
  day: string;
  title: string;
  items: ListItem[];
}

const timelineData: TimelineStep[] = [
{
  day: "Today",
  title: "Get Started.",
  items: [
  { text: "Connect CRM in 2 minutes or upload CSV" },
  { text: "Setup your teams accounts" },
  { text: "Start running workflows" }]

},
{
  day: "Day 2",
  title: "Rejoice.",
  items: [
  { text: "Leads sorted based on Intent" },
  { text: "Complete social intelligence on prospects" },
  { text: "Know who to reach out to, how to and when to" }]

},
{
  day: "Day 7",
  title: "Ask why you didn't switch years ago.",
  items: [
  { text: "More meetings getting booked" },
  { text: "Dozens of signals coming in a month." },
  { text: "15+ hours of mediocre manual work saved" }]

}];


const CheckIcon = () =>
<div className="w-5 h-5 flex-shrink-0">
        <CheckCircle className="w-5 h-5 text-purple-500" />
    </div>;


const TimelineCard: React.FC<TimelineStep> = ({ title, items }) =>
<div className="bg-white border border-gray-200 rounded-2xl p-10 h-full">
        <h3 className="text-xl font-semibold text-black mb-6 !whitespace-pre-line">{title}</h3>
        <ul className="space-y-3">
            {items.map((item, index) =>
    <li key={index} className="flex items-start gap-3">
                    <CheckIcon />
                    <span className="text-base text-[#475467] leading-normal !whitespace-pre-line">{item.text}</span>
                </li>
    )}
        </ul>
    </div>;


const ImplementationTimeline = () => {
  return (
    <section className="bg-white py-20 lg:py-[120px]">
      <div className="max-w-[1200px] mx-auto px-10 md:px-6">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-block bg-black text-white text-sm font-semibold py-2 px-3 rounded-full mb-4 !whitespace-pre-line">New software shouldn&apos;t take a year to see results.

          </div>
          <h2 className="text-[48px] font-bold text-black tracking-tight leading-[1.2] !whitespace-pre-line">Here&apos;s what you can get done with Honeycomb in just 7 days.

          </h2>
        </div>

        <div className="mt-20 mb-8 max-w-5xl mx-auto">
          <div className="relative">
            <div className="absolute w-full h-[2px] bg-[#e4e5e7] top-[44px]"></div>
            <div className="relative flex justify-between">
              {timelineData.map((step) =>
              <div key={step.day} className="text-center">
                  <p className="text-base font-semibold text-black mb-4 !whitespace-pre-line">{step.day}</p>
                  <div className="w-3 h-3 bg-black rounded-full mx-auto"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 max-w-5xl mx-auto">
          {timelineData.map((cardData, index) =>
          <TimelineCard key={index} {...cardData} />
          )}
        </div>
      </div>
    </section>);

};

export default ImplementationTimeline;