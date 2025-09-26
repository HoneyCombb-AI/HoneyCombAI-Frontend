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
import { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";

export default function DesktopLanding() {
    useEffect(() => {
        (async function () {
          const cal = await getCalApi({ namespace: "30min" });
          cal("ui", { hideEventTypeDetails: false, layout: "month_view" });
        })();
      }, []);
      
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <SocialProof />
        <DailySignals />
        <div className="bg-white">
          <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
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
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}