import { Navbar, MobileBottomNav } from '@openpass/ui'
import { HeroSection, FeaturesSection, CtaFooter } from '@openpass/ui'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="pt-20 pb-20 md:pb-0">
        <HeroSection />
        <FeaturesSection />
        <CtaFooter />
      </main>
      <MobileBottomNav />
    </>
  )
}
