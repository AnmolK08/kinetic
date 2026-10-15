import LandingNavbar from '@/components/landing/LandingNavbar';
import HeroSection from '@/components/landing/HeroSection';
import TickerSection from '@/components/landing/TickerSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import ProofSection from '@/components/landing/ProofSection';
import LandingFooter from '@/components/landing/LandingFooter';

export default function Landing() {
  return (
    <main className="landing-page">
      <LandingNavbar />
      <HeroSection />
      <TickerSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ProofSection />
      <LandingFooter />
    </main>
  );
}
