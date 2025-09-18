import Image from "next/image";

const FeaturesIntro = () => {
  return (
    <section className="bg-[#2C2C2C]">
      <div className="mx-auto max-w-[1200px] px-6 py-24 md:px-10 md:py-[120px]">
        <div className="text-center">
          <h1 className="text-[48px] font-bold leading-tight text-white md:leading-[1.2]">
            Every Sales Team Needs a Researcher
          </h1>
        </div>

        <div className="mt-16 md:mt-24">
          <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2 md:items-center md:gap-12">
            <div className="flex flex-col gap-2">
              <p className="text-xl font-medium leading-8 text-gray-300">
                &ldquo;Honeycomb has transformed our outbound strategy&rdquo;
              </p>
              <h2 className="text-[48px] font-bold leading-tight text-white md:leading-[1.2]">
                Daily Signals
              </h2>
            </div>
            <div>
              <p className="text-xl leading-8 text-gray-300">
                Track sales signals across all your accounts to{" "}
                <strong className="font-bold text-white">
                  uncover opportunities as they happen
                </strong>
                . From specific keywords in job postings to executives
                discussing next year&apos;s plans, sales signals help you{" "}
                <strong className="font-bold text-white">
                  engage at the right time
                </strong>
                .
              </p>
            </div>
          </div>

          <a
            href="#"
            className="mt-12 block md:mt-20"
            aria-label="open lightbox"
          >
            <Image
              src="https://cdn.prod.website-files.com/66a999af2125597557ba7b53/67f6a8ff07c0a08e6d6901bb_Screenshot%202025-03-31%20at%208.21.57%E2%80%AFAM.png"
              alt="Dashboard mockup"
              width={1440}
              height={892}
              className="w-full rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.15)]"
            />
          </a>
        </div>
      </div>
    </section>
  );
};

export default FeaturesIntro;