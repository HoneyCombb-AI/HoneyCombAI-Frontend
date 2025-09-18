import { Button } from "@/components/ui/button";

export default function Customization() {
  return (
    <section className="bg-white py-[120px]">
      <div className="container mx-auto text-center">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-[48px] font-bold leading-[1.2] text-black">
            Tailored to Your Sales Process
          </h2>
          <p className="mt-6 text-[20px] leading-[1.6] text-[#2C2C2C]">
            Don’t worry about fitting into our software. We adapt Honeycomb to your workflows —
            from qualification to outreach to handoff. Need workflow augmentation or light
            automations? We’ll add what you require and shape the system around how you sell.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 mx-auto justify-items-center">
          <div className="rounded-2xl border border-border bg-white p-8 shadow-sm text-center">
            <h3 className="text-2xl font-semibold text-black">Workflow Augmentation</h3>
            <p className="mt-3 text-base leading-[1.7] text-[#6B7280]">
              Custom stages, handoffs, and ownership rules so signals move smoothly through your
              pipeline without busywork.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-white p-8 shadow-sm text-center">
            <h3 className="text-2xl font-semibold text-black">Targeted Automations</h3>
            <p className="mt-3 text-base leading-[1.7] text-[#6B7280]">
              Triggered alerts, enrichment, and list-building tuned to your ICP and territories — only
              when it matters.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-white p-8 shadow-sm text-center">
            <h3 className="text-2xl font-semibold text-black">Flexible Integrations</h3>
            <p className="mt-3 text-base leading-[1.7] text-[#6B7280]">
              Use Honeycomb standalone or alongside the tools you already rely on. We’ll fit to your
              process, not the other way around.
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Button
            variant="outline"
            className="cursor-pointer bg-black text-white hover:bg-black/90 hover:text-amber-300 rounded-lg text-base font-medium px-6 py-3 h-auto ml-2"
            data-cal-namespace="30min"
            data-cal-link="ankushnagathan/30min"
            data-cal-config='{"layout":"month_view"}'
          >
           Talk Through Your Process
          </Button>
        </div>
      </div>
    </section>
  );
}