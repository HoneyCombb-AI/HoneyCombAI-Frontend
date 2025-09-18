export default function Customization() {
  return (
    <section className="bg-white py-[120px]">
      <div className="container">
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

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
            <h3 className="text-2xl font-semibold text-black">Workflow Augmentation</h3>
            <p className="mt-3 text-base leading-[1.7] text-[#6B7280]">
              Custom stages, handoffs, and ownership rules so signals move smoothly through your
              pipeline without busywork.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
            <h3 className="text-2xl font-semibold text-black">Targeted Automations</h3>
            <p className="mt-3 text-base leading-[1.7] text-[#6B7280]">
              Triggered alerts, enrichment, and list-building tuned to your ICP and territories — only
              when it matters.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
            <h3 className="text-2xl font-semibold text-black">Flexible Integrations</h3>
            <p className="mt-3 text-base leading-[1.7] text-[#6B7280]">
              Use Honeycomb standalone or alongside the tools you already rely on. We’ll fit to your
              process, not the other way around.
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <a
            href="https://cal.com/ankushkothari/honeycomb-demo"
            className="inline-flex items-center justify-center rounded-lg bg-black px-8 py-4 text-base font-medium text-white hover:opacity-90"
          >
            Talk Through Your Process
          </a>
        </div>
      </div>
    </section>
  );
}