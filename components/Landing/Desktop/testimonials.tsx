import Image from "next/image";

interface Testimonial {
  name: string;
  title: string;
  quoteHeadline: string;
  quoteBody: string;
  avatarUrl: string;
  avatarAlt: string;
}

const testimonialsData: Testimonial[] = [
{
  name: 'Kiriti Kapavari',
  title: "Outreach @ Cocreate",
  quoteHeadline: '"Actionable insights, not noise"',
  quoteBody: 'Honeycomb\'s signals help us prioritize outreach with confidence. Less guessing, more meaningful conversations.',
  avatarUrl: '/Kiriti .jpeg',
  avatarAlt: 'Kiriti Kapavari'
},
{
  name: 'Suresh Narasimha',
  title: "Director @ Justbooks",
  quoteHeadline: '"We focus on accounts that actually matter"',
  quoteBody: 'We use Honeycomb to zero-in on the right timing and context. It\'s simplified our process and improved outcomes.',
  avatarUrl: '/Suresh sir.jpeg',
  avatarAlt: 'Suresh Narasimha'
}];


const TestimonialCard = ({ name, title, quoteHeadline, quoteBody, avatarUrl, avatarAlt }: Testimonial) => {
  return (
    <div className="bg-[#2C2C2C] text-white rounded-2xl p-8 flex flex-col h-full">
      <div className="rounded-full mb-8 overflow-hidden border-2 border-gray-600" style={{ width: 96, height: 96 }}>
        <Image
          src={avatarUrl}
          alt={avatarAlt}
          width={96}
          height={96}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </div>

      <h3 className="text-2xl font-semibold leading-snug mb-4 text-amber-300">
        {quoteHeadline}
      </h3>
      <p className="text-base text-gray-300 flex-grow mb-8 font-normal leading-relaxed">
        {quoteBody}
      </p>
      <div className="mt-auto">
        <p className="font-semibold text-base text-white">{name}</p>
        <p className="text-sm text-gray-400 !whitespace-pre-line">{title}</p>
      </div>
    </div>);

};

const Testimonials = () => {
  return (
    <section className="bg-white py-[120px]">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-6xl mx-auto">
          <h2 className="font-bold text-black text-[48px] leading-[1.2]">
            Don&apos;t Just Take Our
            <br />
            Word for It
          </h2>
          <p className="mt-6 text-dark-gray text-[20px] leading-[1.6]">
            Trusted by modern outbound and revenue teams.
          </p>
        </div>
        <div className="mt-20 flex justify-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl w-full">
            {testimonialsData.map((testimonial) =>
              <TestimonialCard key={testimonial.name} {...testimonial} />
            )}
          </div>
        </div>
      </div>
    </section>);

};

export default Testimonials;