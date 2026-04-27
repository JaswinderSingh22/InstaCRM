import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { CtaSection } from "@/components/marketing/cta-section";
import { FaqItem } from "@/components/marketing/faq-item";
import { FeaturesBento } from "@/components/marketing/features-bento";
import { GradientText } from "@/components/marketing/gradient-text";
import { HeroMockup } from "@/components/marketing/hero-mockup";
import { LandingFooter } from "@/components/marketing/landing-footer";
import { LandingNav } from "@/components/marketing/landing-nav";
import { PillBadge } from "@/components/marketing/pill-badge";
import { PricingCard } from "@/components/marketing/pricing-card";
import { SectionHeader } from "@/components/marketing/section-header";
import { TestimonialCard } from "@/components/marketing/testimonial-card";
import { StarRating } from "@/components/marketing/star-rating";
import { cn } from "@/lib/utils";
import { PRICING, formatPlanPrice } from "@/lib/pricing-plans";

export function LandingPageView() {
  return (
    <div className="min-h-dvh bg-[#fafbfc] text-neutral-900">
      <LandingNav />
      <main>
        <section
          id="product"
          className="relative overflow-hidden px-4 pb-20 pt-10 sm:px-6 sm:pb-24 sm:pt-14 lg:px-8"
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.12),transparent_50%)]"
            aria-hidden
          />
          <div className="pointer-events-none absolute top-0 right-0 h-[400px] w-[400px] bg-rose-100/30 blur-3xl" />
          <div className="relative mx-auto max-w-4xl text-center">
            <div className="flex justify-center">
              <PillBadge>
                <span className="text-[10px]">●</span> v2.0 now live for creators
              </PillBadge>
            </div>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-balance sm:text-5xl md:text-6xl">
              Close More Brand Deals. Track Leads.{" "}
              <GradientText as="span" className="block sm:inline">
                Get Paid Faster.
              </GradientText>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-balance text-base text-[#777681] sm:text-lg">
              InstaCRM is the operating system for creator-led businesses — leads, deals,
              invoicing, and analytics in one beautiful workspace. Built for Instagram-forward
              brands and the agencies behind them.
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Link
                href="/signup"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-12 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#6366f1] px-8 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 hover:from-[#4338ca]",
                )}
              >
                Start Free Trial
              </Link>
              <Link
                href="mailto:hello@instacrm.app"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-12 rounded-xl border-neutral-200 bg-white px-8 text-base font-semibold",
                )}
              >
                Book Demo
              </Link>
            </div>
          </div>
          <div className="relative z-10 mx-auto mt-14 max-w-5xl">
            <HeroMockup />
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <SectionHeader
              title="Everything you need to scale"
              description="Stop juggling spreadsheets and DMs. We've built the tools to automate your back-office."
            />
            <div className="mt-12 sm:mt-16">
              <FeaturesBento />
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-8 sm:gap-16 md:mt-12">
              <StarRating />
              <StarRating />
              <StarRating />
            </div>
          </div>
        </section>

        <section className="border-y border-neutral-200/60 bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 md:grid-cols-3 md:gap-8">
              <TestimonialCard
                initials="SJ"
                name="Sarah Jenkins"
                role="Lifestyle Creator, 850k followers"
                quote="InstaCRM changed how I view my business. I can finally see which brands are actually worth the time before I even reply to a DM."
              />
              <TestimonialCard
                initials="ML"
                name="Marcus Lee"
                role="Tech reviewer, 1.2M subs"
                quote="The invoicing alone saves me 10 hours a week. Getting paid on time used to be a nightmare. Now it just happens."
              />
              <TestimonialCard
                initials="ER"
                name="Elena Rodriguez"
                role="Agency lead, 12 creators"
                quote="I finally feel like a professional. My clients see a polished portal instead of a messy Notion page."
              />
            </div>
          </div>
        </section>

        <section id="pricing" className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <SectionHeader
              title="Transparent pricing for creators"
              description="Pick a plan that matches your current growth stage."
            />
            <div className="mt-12 grid gap-6 md:grid-cols-3 md:items-stretch">
              <PricingCard
                planName={PRICING.starter.name}
                price={formatPlanPrice(PRICING.starter.monthlyPrice)}
                description={PRICING.starter.description}
                features={[...PRICING.starter.features]}
                ctaText={PRICING.starter.landing.cta}
                ctaHref={PRICING.starter.landing.href}
              />
              <PricingCard
                planName={PRICING.proCreator.name}
                price={formatPlanPrice(PRICING.proCreator.monthlyPrice)}
                description={PRICING.proCreator.description}
                features={[...PRICING.proCreator.features]}
                ctaText={PRICING.proCreator.landing.cta}
                ctaHref={PRICING.proCreator.landing.href}
                isFeatured
                featuredBadge={PRICING.proCreator.badge}
                checkColor="indigo"
              />
              <PricingCard
                planName={PRICING.talentAgency.name}
                price={formatPlanPrice(PRICING.talentAgency.monthlyPrice)}
                description={PRICING.talentAgency.description}
                features={[...PRICING.talentAgency.features]}
                ctaText={PRICING.talentAgency.landing.cta}
                ctaHref={PRICING.talentAgency.landing.href}
              />
            </div>
          </div>
        </section>

        <section id="faq" className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-center text-2xl font-bold text-neutral-900 sm:text-3xl">
              Frequently Asked Questions
            </h2>
            <div className="mt-10 flex flex-col gap-4">
              <FaqItem
                question="Can I import my data from other CRMs?"
                answer="Yes, we support one-click imports from Excel, CSV, and common CRM platforms like HubSpot or Pipedrive."
              />
              <FaqItem
                question="Does it connect to my Instagram?"
                answer="InstaCRM uses the official Meta API to safely track your engagement metrics and creator stats without needing your password."
              />
              <FaqItem
                question="What payment methods do you support?"
                answer="We use Stripe for subscriptions and invoicing, so you can accept cards, ACH, and more depending on your Stripe configuration."
              />
            </div>
          </div>
        </section>

        <section className="px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <CtaSection
              title="Ready to take your creator business to the next level?"
              description="Join 10,000+ top-tier creators who use InstaCRM to run their empire."
              primaryCta={{ label: "Get Started for Free", href: "/signup" }}
              secondaryCta={{ label: "Talk to an Expert", href: "mailto:hello@instacrm.app" }}
            />
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
