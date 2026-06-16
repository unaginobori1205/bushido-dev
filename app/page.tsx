import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { SocialProof } from "@/components/SocialProof";
import { Problem } from "@/components/Problem";
import { HowItWorks } from "@/components/HowItWorks";
import { AiTeam } from "@/components/AiTeam";
import { Experiences } from "@/components/Experiences";
import { WhyBushido } from "@/components/WhyBushido";
import { ForWhom } from "@/components/ForWhom";
import { Traction } from "@/components/Traction";
import { VisionFounder } from "@/components/VisionFounder";
import { JourneyPlanner } from "@/components/JourneyPlanner";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <a
        href="#planner"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-navy-deep"
      >
        Skip to journey planner
      </a>
      <Nav />
      <main>
        <Hero />
        <SocialProof />
        <Problem />
        <HowItWorks />
        <AiTeam />
        <Experiences />
        <WhyBushido />
        <ForWhom />
        <Traction />
        <VisionFounder />
        <JourneyPlanner />
      </main>
      <Footer />
    </>
  );
}
