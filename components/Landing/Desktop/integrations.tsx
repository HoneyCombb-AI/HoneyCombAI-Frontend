import Image from "next/image";

const logos = [
  {
    src: "https://cdn.prod.website-files.com/66a999af2125597557ba7b53/676aa91929e1562c96bf454f_HubSpot_Logo.png",
    alt: "Hubspot logo",
    width: 139,
    height: 40,
  },
  {
    src: "https://cdn.prod.website-files.com/66a999af2125597557ba7b53/67697bc2a75dc198b9c68033_Salesforce.com_logo.svg.png",
    alt: "Salesforce logo",
    width: 112,
    height: 78,
  },
  {
    src: "https://cdn.prod.website-files.com/66a999af2125597557ba7b53/676986f38b7e384f00e1ca2c_salesloft-logo-full-color-rgb-1.png",
    alt: "Salesloft logo",
    width: 151,
    height: 30,
  },
  {
    src: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/2dd489b6-fdb0-4898-abbb-cc7b5e9464d3-getbirddog-ai/assets/images/67698720f280652b742c2772_outreach_logo-25.png?",
    alt: "Outreach.com logo",
    width: 160,
    height: 32,
  },
  {
    src: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/2dd489b6-fdb0-4898-abbb-cc7b5e9464d3-getbirddog-ai/assets/svgs/6769873ca2db7ab7a3832a81_Pipedrive_Logo-6.svg?",
    alt: "Pipedrive logo",
    width: 150,
    height: 30,
  },
  {
    src: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/2dd489b6-fdb0-4898-abbb-cc7b5e9464d3-getbirddog-ai/assets/svgs/6769892a72e42e362ad936fe_ZoomInfo_logo_(2024).svg-7.png?",
    alt: "Zoominfo Logo",
    width: 153,
    height: 27,
  },
  {
    src: "https://cdn.prod.website-files.com/66a999af2125597557ba7b53/6769f74813ceee709e7128fe_logo_gmail_lockup_default_2x_r5.png",
    alt: "Gmail Logo",
    width: 125,
    height: 47,
  },
  {
    src: "https://cdn.prod.website-files.com/66a999af2125597557ba7b53/6769879b91e38a3c7aaa895c_64a53c0afb60da307f97799a_Uky9NSwNCinNGBQn98J_CelGXVzxt-EBT5RuKF0Woz0.svg",
    alt: "Apollo.io logo",
    width: 80,
    height: 80,
  },
  {
    src: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/2dd489b6-fdb0-4898-abbb-cc7b5e9464d3-getbirddog-ai/assets/images/676aa89ba87731fce6f18978_664ffc89ff539b531cc46813_Clay-logo-black-2024-27.webp?",
    alt: "Clay logo",
    width: 85,
    height: 28,
  },
  {
    src: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/2dd489b6-fdb0-4898-abbb-cc7b5e9464d3-getbirddog-ai/assets/images/676987648b7e384f00e233f2_instantly_logo-28.png?",
    alt: "Instantly.ai logo",
    width: 136,
    height: 30,
  },
];

export default function Integrations() {
  return (
    <section className="bg-white py-[120px]">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-16">
          <div className="flex-shrink-0 text-center lg:text-left">
            <h2 className="text-[32px] font-semibold leading-[1.3] text-foreground">
              Export the data to your favorite tools.
            </h2>
            <p className="mt-4 text-body-regular">
              Custom Integrations to your CRM or CSV Exports to Sequencing Tools.
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="grid w-full grid-cols-2 items-center gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
              {logos.map((logo) => (
                <div key={logo.alt} className="flex h-16 items-center justify-center">
                  <Image
                    src={logo.src}
                    alt={logo.alt}
                    width={logo.width}
                    height={logo.height}
                    loading="lazy"
                    className="max-h-12 w-auto object-contain"
                  />
                </div>
              ))}
            </div>
            <p className="mt-10 text-center text-small">
              30+ Other Connections
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}