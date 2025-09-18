import Customization from "@/components/Landing/Desktop/customization";
import DailySignals from "@/components/Landing/Desktop/daily-signals";
import Faq from "@/components/Landing/Desktop/faq";
import FinalCta from "@/components/Landing/Desktop/final-cta";
import Footer from "@/components/Landing/Desktop/footer";
import Header from "@/components/Landing/Desktop/header";
import HeroSection from "@/components/Landing/Desktop/hero";
import ImplementationTimeline from "@/components/Landing/Desktop/implementation-timeline";
import InDepthResearch from "@/components/Landing/Desktop/in-depth-research";
import Integrations from "@/components/Landing/Desktop/integrations";
import SocialProof from "@/components/Landing/Desktop/social-proof";
import Testimonials from "@/components/Landing/Desktop/testimonials";

interface DesktopLandingProps {
  userEmail?: string | null;
}

export default function DesktopLanding({ userEmail }: DesktopLandingProps) {
  return (
    <>
      <Header userEmail={userEmail} />
      <main>
        <HeroSection />
        <SocialProof />
        {/* Make DailySignals full-bleed with its own dark background */}
        <DailySignals />
        <div className="bg-white">
          <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
            {/* <FeaturesIntro /> */}
            {/* DailySignals moved above to span full width */}
            <div className="py-20">
              <InDepthResearch />
            </div>
          </div>
        </div>
        <ImplementationTimeline />
        <Customization />
        <Integrations />
        <Testimonials />
        <Faq />
        {/* Simple final CTA replacement */}
        {/* remove simple button section and restore FinalCta */}
        <FinalCta />
        {/* <FinalCta /> */}
      </main>
      <Footer />
    </>
  );
}