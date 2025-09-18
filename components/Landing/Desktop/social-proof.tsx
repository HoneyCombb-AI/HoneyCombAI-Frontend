import Image from "next/image";

const SocialProof = () => {
  return (
    <section className="bg-white text-foreground py-20 lg:py-20">
      <div className="container px-4 mx-auto">
        {/* Testimonial Section */}
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-center text-xl font-medium text-black mb-10">Loved By Sales Teams...</p>
          <div className="testimonial-wrapper rounded-3xl border border-border bg-white p-10 shadow-lg text-center mx-auto">
            <div className="testimonial-content flex flex-col items-center">
              <p className="text-center text-2xl lg:text-3xl font-medium leading-normal text-[#2c2c2c] max-w-3xl mx-auto !whitespace-pre-line">&ldquo;Honeycomb helps us focus on the few accounts that actually matter right now by surfacing the right buying signals at the right time.&rdquo;

              </p>
            </div>
            <div className="testimonial-author-wrap mt-9 flex items-center justify-center">
              <div className="author-thumb rounded-full overflow-hidden border-2 border-gray-300" style={{ width: '65px', height: '65px' }}>
                <Image
                  src="/Suresh sir.jpeg"
                  alt="Suresh Narasimha"
                  width={65}
                  height={65}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="author-data ml-5 text-left">
                <div className="author-name text-xl font-semibold text-black">Suresh Narasimha</div>
                <p className="body-medium text-base text-gray-500">Director @ Just Books</p>
              </div>
            </div>
          </div>
        </div>

        {/* Logo Grid Section */}
        <div className="py-12 mt-4">
          <div className="mx-auto max-w-6xl text-center">
            <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-10 mx-auto">
              <div className="h-16 w-56 flex items-center justify-center bg-black rounded-md p-4 border border-gray-200">
                <Image
                  src="/Bonhomia logo.png"
                  alt="Bonhomia Coffee"
                  width={180}
                  height={50}
                  loading="lazy"
                  sizes="180px"
                  className="object-contain max-h-12 w-auto h-auto"
                />
              </div>
              <div className="h-16 w-56 flex items-center justify-center bg-white rounded-md p-4 border border-gray-200">
                <Image
                  src="/Justbooks.webp"
                  alt="Just Books"
                  width={180}
                  height={50}
                  loading="lazy"
                  sizes="180px"
                  className="object-contain max-h-12 w-auto h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>);

};

export default SocialProof;