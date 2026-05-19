import type { ReactNode } from 'react';
import Link from 'next/link';
import { MarketingFooter } from '@/components/marketing/marketing-footer';
import { MarketingHeader } from '@/components/marketing/marketing-header';
import { Reveal } from '@/components/marketing/reveal';
import {
  ArrowRightIcon,
  CheckIcon,
  CompassIcon,
  GlobeIcon,
  HeartIcon,
  PlayIcon,
  QuoteIcon,
  ShieldIcon,
  SparkIcon,
  StarIcon,
  WifiIcon,
} from '@/components/marketing/icons';

// Metadata for the home page is inherited from the root layout (app/layout.tsx).

const PRIMARY_CTA =
  'group inline-flex h-13 items-center justify-center gap-2 rounded-full bg-primary-500 px-7 text-sm font-semibold text-white shadow-glow-primary transition-all duration-200 hover:bg-primary-600 hover:shadow-glow-lg active:scale-[0.98]';
const SECONDARY_CTA =
  'inline-flex h-13 items-center justify-center gap-2 rounded-full border border-sand-300 bg-surface/70 px-7 text-sm font-semibold text-ink transition-all duration-200 hover:border-primary-300 hover:bg-surface hover:text-primary-700';

const STATS = [
  { value: '0–6 yrs', label: 'Every stage covered' },
  { value: '5', label: 'Developmental domains' },
  { value: '~10 min', label: 'Per gentle check-in' },
  { value: '21', label: 'Age-specific check-ins' },
];

const STEPS = [
  {
    no: '01',
    title: 'Add your child',
    body: 'Pop in a birthday. Namo instantly matches the right age-appropriate check-in — no guesswork, no searching.',
    emoji: '🌱',
  },
  {
    no: '02',
    title: 'Answer with everyday play',
    body: 'Gentle questions you answer from what you already see at home. Yes, Sometimes, or Not yet — there are no wrong answers.',
    emoji: '🧸',
  },
  {
    no: '03',
    title: 'Get clear, kind guidance',
    body: 'A reassuring result with activities to try next — and a soft nudge when it is worth a chat with your pediatrician.',
    emoji: '🌼',
  },
];

const DOMAINS = [
  {
    emoji: '💬',
    name: 'Communication',
    blurb: 'Babbling, first words, and understanding the little requests you make.',
    accent: 'bg-primary-50 text-primary-700 ring-primary-100',
  },
  {
    emoji: '🤸',
    name: 'Gross Motor',
    blurb: 'Rolling, crawling, walking and climbing — the big, confident movements.',
    accent: 'bg-teal-50 text-teal-700 ring-teal-100',
  },
  {
    emoji: '✋',
    name: 'Fine Motor',
    blurb: 'Grasping, stacking and scribbling — small hands learning precise skills.',
    accent: 'bg-gold-400/15 text-gold-600 ring-gold-400/30',
  },
  {
    emoji: '🧩',
    name: 'Problem Solving',
    blurb: 'Exploring, remembering and working out how the world fits together.',
    accent: 'bg-clay-400/15 text-clay-600 ring-clay-400/30',
  },
  {
    emoji: '🧸',
    name: 'Personal-Social',
    blurb: 'Playing with others, sharing feelings and growing happy independence.',
    accent: 'bg-dusk-50 text-dusk-600 ring-dusk-100',
  },
];

const VALUES = [
  {
    Icon: SparkIcon,
    title: 'Clinically grounded',
    body: 'Deterministic, version-aware ASQ-based scoring — the same screening methodology pediatricians trust.',
    tone: 'bg-primary-50 text-primary-600',
  },
  {
    Icon: HeartIcon,
    title: 'Gentle by design',
    body: 'Warm, reassuring language at every step. Namo shows progress and possibility — never a pass or a fail.',
    tone: 'bg-clay-400/15 text-clay-600',
  },
  {
    Icon: WifiIcon,
    title: 'Works anywhere',
    body: 'Offline-first and built for low-bandwidth, low-end devices. Start a check-in even with no signal.',
    tone: 'bg-teal-50 text-teal-600',
  },
  {
    Icon: GlobeIcon,
    title: 'Speaks your language',
    body: 'Multilingual, low-literacy friendly, with voice-guided check-ins so you can answer hands-free.',
    tone: 'bg-dusk-50 text-dusk-600',
  },
  {
    Icon: ShieldIcon,
    title: 'Private & secure',
    body: 'Encrypted in transit and at rest, with HIPAA-inspired practices. Your child’s data is never sold.',
    tone: 'bg-gold-400/15 text-gold-600',
  },
  {
    Icon: CompassIcon,
    title: 'Always a next step',
    body: 'Every result comes with personalised activities and clear guidance on when to seek extra support.',
    tone: 'bg-primary-50 text-primary-600',
  },
];

const TESTIMONIALS = [
  {
    quote:
      'I always wondered if I was reading too much into things. Namo gave me calm, clear answers — and the activity ideas actually work.',
    name: 'Aisha R.',
    role: 'Parent of two',
    avatar: 'bg-primary-100 text-primary-700',
    initials: 'AR',
  },
  {
    quote:
      'We noticed a speech delay months earlier than we otherwise would have. That head start genuinely changed things for our son.',
    name: 'Daniel M.',
    role: 'Dad, first-time parent',
    avatar: 'bg-teal-100 text-teal-700',
    initials: 'DM',
  },
  {
    quote:
      'I point families to Namo for the time between visits. The ASQ-based results are something I can actually act on in clinic.',
    name: 'Dr. Priya N.',
    role: 'Pediatrician',
    avatar: 'bg-dusk-100 text-dusk-600',
    initials: 'PN',
  },
];

const FAQS = [
  {
    q: 'Is Namo a medical diagnosis?',
    a: 'No. Namo is a developmental screening tool. It highlights what to celebrate and what to keep watching, and encourages a pediatrician conversation when it helps — it never diagnoses a condition.',
  },
  {
    q: 'What is ASQ, and why does it matter?',
    a: 'The Ages & Stages Questionnaires is one of the most widely used, research-validated developmental screening methods. Namo follows its scoring faithfully and deterministically, so results are consistent and trustworthy.',
  },
  {
    q: 'What ages does Namo support?',
    a: 'Every child from birth to six years. Namo automatically selects the right check-in for your child’s exact age, so the questions are always developmentally appropriate.',
  },
  {
    q: 'How long does a check-in take?',
    a: 'About ten minutes. Every question is based on everyday play and routines, so there is nothing to prepare, study, or get right in advance.',
  },
  {
    q: 'Is my child’s data private?',
    a: 'Yes. Data is encrypted in transit and at rest, follows HIPAA-inspired practices, and is never sold. You stay in control of your family’s information.',
  },
  {
    q: 'Does Namo work without internet?',
    a: 'Yes. Namo is offline-first — you can complete a full check-in with no connection, and it syncs safely once you are back online.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-sand-50">
      <MarketingHeader />
      <main>
        <Hero />
        <TrustBand />
        <HowItWorks />
        <Domains />
        <ResultSpotlight />
        <WhyNamo />
        <Testimonials />
        <Faq />
        <FinalCta />
      </main>
      <MarketingFooter />
    </div>
  );
}

/* ----------------------------------------------------------------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="namo-wash absolute inset-0" aria-hidden="true" />
      <div
        className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-primary-200/40 blur-3xl animate-blob"
        aria-hidden="true"
      />
      <div
        className="absolute -right-20 top-40 h-80 w-80 rounded-full bg-teal-200/40 blur-3xl animate-blob"
        style={{ animationDelay: '-8s' }}
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-6xl gap-14 px-4 pb-20 pt-32 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-28 lg:pt-40">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-surface/80 px-4 py-1.5 text-xs font-semibold text-primary-700 shadow-soft">
            <span className="inline-flex h-2 w-2 rounded-full bg-primary-500" />
            Early childhood development, made gentle
          </span>

          <h1 className="mt-6 font-display text-[2.7rem] font-medium leading-[1.06] tracking-tight text-ink sm:text-6xl">
            Watch your child{' '}
            <span className="text-gradient italic">bloom</span>,
            <br className="hidden sm:block" /> one milestone at a time.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
            Namo turns trusted ASQ developmental screening into warm, ten-minute
            check-ins — so you always know what to celebrate, and exactly when to
            ask for a little support.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className={PRIMARY_CTA}>
              Start a free check-in
              <ArrowRightIcon
                width={18}
                height={18}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Link>
            <a href="#how" className={SECONDARY_CTA}>
              <PlayIcon width={18} height={18} className="text-primary-500" />
              See how it works
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex items-center">
              {['bg-primary-200', 'bg-teal-200', 'bg-gold-400/40', 'bg-clay-400/35', 'bg-dusk-100'].map(
                (bg, i) => (
                  <span
                    key={bg}
                    className={`-ml-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-sand-50 ${bg} text-xs font-semibold text-ink first:ml-0`}
                  >
                    {['👶', '🧒', '👧', '🍼', '🌟'][i]}
                  </span>
                ),
              )}
            </div>
            <div>
              <div className="flex items-center gap-1 text-gold-500">
                {[0, 1, 2, 3, 4].map((i) => (
                  <StarIcon key={i} width={15} height={15} />
                ))}
              </div>
              <p className="mt-0.5 text-xs text-ink-muted">
                Loved by <span className="font-semibold text-ink">12,000+ parents</span> following
                their children’s growth
              </p>
            </div>
          </div>
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '120ms' }}>
          <HeroCard />
        </div>
      </div>
    </section>
  );
}

function HeroCard() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div
        className="absolute -right-6 -top-6 h-28 w-28 rounded-3xl bg-gold-400/25 blur-xl"
        aria-hidden="true"
      />

      <div className="relative rounded-3xl border border-sand-200 bg-surface p-6 shadow-float">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-lg font-semibold text-primary-700">
            L
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Liam’s check-in</p>
            <p className="text-xs text-ink-muted">9 months · Communication</p>
          </div>
          <span className="ml-auto rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
            In progress
          </span>
        </div>

        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-ink-muted">
            <span>4 of 6 answered</span>
            <span className="text-teal-600">Almost there</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-sand-200">
            <div className="h-full w-2/3 rounded-full bg-teal-500" />
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-sand-100 p-4">
          <p className="text-sm font-medium leading-relaxed text-ink">
            Does your baby make babbling sounds like “da”, “ga”, or “ba”?
          </p>
          <div className="mt-3 flex gap-2">
            <span className="flex h-9 items-center rounded-full bg-teal-500 px-4 text-xs font-semibold text-white">
              Yes
            </span>
            <span className="flex h-9 items-center rounded-full border border-sand-300 bg-surface px-4 text-xs font-medium text-ink-muted">
              Sometimes
            </span>
            <span className="flex h-9 items-center rounded-full border border-sand-300 bg-surface px-4 text-xs font-medium text-ink-muted">
              Not yet
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3">
          <span className="text-base">🌟</span>
          <p className="text-xs font-medium text-teal-800">
            Great progress — Liam is right on track for his age.
          </p>
        </div>
      </div>

      <div
        className="absolute -left-7 top-20 hidden rounded-2xl border border-sand-200 bg-surface px-3.5 py-2.5 shadow-glow animate-float sm:block"
        aria-hidden="true"
      >
        <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-ink-soft">
          This week
        </p>
        <p className="text-sm font-semibold text-ink">🤸 Tummy-time play</p>
      </div>

      <div
        className="absolute -right-6 bottom-10 hidden items-center gap-2 rounded-full border border-sand-200 bg-surface px-4 py-2 shadow-glow animate-float-slow sm:flex"
        style={{ animationDelay: '-3s' }}
        aria-hidden="true"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-teal-700">
          <CheckIcon width={15} height={15} />
        </span>
        <span className="text-xs font-semibold text-ink">On Track</span>
      </div>
    </div>
  );
}

function TrustBand() {
  return (
    <section className="border-y border-sand-200 bg-surface">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden px-4 sm:px-6 lg:grid-cols-4">
        {STATS.map((stat, i) => (
          <Reveal
            key={stat.label}
            delay={i * 80}
            className="px-4 py-9 text-center lg:px-6"
          >
            <p className="font-display text-3xl font-medium text-ink sm:text-4xl">
              {stat.value}
            </p>
            <p className="mt-1.5 text-xs font-medium uppercase tracking-wide text-ink-soft">
              {stat.label}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
        {eyebrow}
      </span>
      <h2 className="mt-3 font-display text-3xl font-medium leading-tight tracking-tight text-ink sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-relaxed text-ink-muted">{description}</p>
      )}
    </div>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="relative scroll-mt-24 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <SectionHeading
            eyebrow="How it works"
            title={<>Three calm steps, start to finish</>}
            description="No clinical jargon, no pressure. Namo fits into the everyday moments you already share with your child."
          />
        </Reveal>

        <div className="relative mt-16 grid gap-6 md:grid-cols-3">
          <div
            className="absolute left-0 right-0 top-9 hidden border-t-2 border-dashed border-sand-300 md:block"
            aria-hidden="true"
          />
          {STEPS.map((step, i) => (
            <Reveal key={step.no} delay={i * 110} className="relative">
              <div className="flex h-full flex-col rounded-3xl border border-sand-200 bg-surface p-7 shadow-soft transition hover:-translate-y-1 hover:shadow-glow-lg">
                <div className="flex items-center justify-between">
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sand-100 text-3xl">
                    {step.emoji}
                  </span>
                  <span className="font-display text-3xl font-medium text-sand-400">
                    {step.no}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Domains() {
  return (
    <section id="domains" className="scroll-mt-24 bg-surface py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <SectionHeading
            eyebrow="What we track"
            title={
              <>
                Five areas of growth, <span className="text-gradient italic">watched with care</span>
              </>
            }
            description="Every check-in looks gently across the five developmental domains that matter most in the first six years."
          />
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {DOMAINS.map((domain, i) => (
            <Reveal key={domain.name} delay={i * 80}>
              <div className="group flex h-full flex-col rounded-3xl border border-sand-200 bg-sand-50 p-7 transition hover:-translate-y-1 hover:border-transparent hover:bg-surface hover:shadow-glow-lg">
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ring-1 ${domain.accent}`}
                >
                  {domain.emoji}
                </span>
                <h3 className="mt-5 text-lg font-semibold text-ink">{domain.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{domain.blurb}</p>
              </div>
            </Reveal>
          ))}

          <Reveal delay={DOMAINS.length * 80}>
            <Link
              href="/register"
              className="group flex h-full min-h-44 flex-col justify-between rounded-3xl bg-primary-500 p-7 text-white shadow-glow-primary transition hover:-translate-y-1 hover:bg-primary-600 hover:shadow-float"
            >
              <span className="text-2xl">🌈</span>
              <div>
                <h3 className="text-lg font-semibold">See it for your child</h3>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-primary-100">
                  Start your first check-in
                  <ArrowRightIcon
                    width={16}
                    height={16}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </p>
              </div>
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function ResultSpotlight() {
  const breakdown = [
    { label: 'Communication', zone: 'On Track', tone: 'bg-teal-50 text-teal-700', width: 'w-[92%]', bar: 'bg-teal-500' },
    { label: 'Gross Motor', zone: 'On Track', tone: 'bg-teal-50 text-teal-700', width: 'w-[88%]', bar: 'bg-teal-500' },
    { label: 'Fine Motor', zone: 'Keep Watching', tone: 'bg-gold-400/15 text-gold-600', width: 'w-[58%]', bar: 'bg-gold-500' },
    { label: 'Problem Solving', zone: 'On Track', tone: 'bg-teal-50 text-teal-700', width: 'w-[80%]', bar: 'bg-teal-500' },
  ];

  return (
    <section className="py-24">
      <div className="mx-auto grid max-w-6xl gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
        <Reveal>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
            Results that guide
          </span>
          <h2 className="mt-3 font-display text-3xl font-medium leading-tight tracking-tight text-ink sm:text-4xl">
            Clear answers, never alarm bells
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-muted">
            Namo translates ASQ scoring into three calm, parent-friendly zones —
            so a result feels like a next step, not a verdict.
          </p>

          <ul className="mt-8 space-y-4">
            {[
              {
                badge: 'On Track',
                tone: 'bg-teal-50 text-teal-700',
                text: 'Your child is developing as expected — keep enjoying everyday play together.',
              },
              {
                badge: 'Keep Watching',
                tone: 'bg-gold-400/15 text-gold-600',
                text: 'A few areas are worth gentle attention, with simple activities to try at home.',
              },
              {
                badge: 'Needs Support',
                tone: 'bg-clay-400/15 text-clay-600',
                text: 'Namo suggests sharing results with a pediatrician, and what to ask about.',
              },
            ].map((item) => (
              <li key={item.badge} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${item.tone}`}
                >
                  {item.badge}
                </span>
                <p className="text-sm leading-relaxed text-ink-muted">{item.text}</p>
              </li>
            ))}
          </ul>

          <Link href="/register" className={`mt-9 ${PRIMARY_CTA}`}>
            Try your first check-in
            <ArrowRightIcon
              width={18}
              height={18}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>
        </Reveal>

        <Reveal delay={120}>
          <div className="relative">
            <div
              className="absolute -inset-6 rounded-[2.6rem] bg-teal-200/30 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative rounded-3xl border border-sand-200 bg-surface p-7 shadow-float">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
                    Check-in complete
                  </p>
                  <p className="mt-1 text-lg font-semibold text-ink">Liam · 9 months</p>
                </div>
                <span className="rounded-full bg-teal-50 px-3.5 py-1.5 text-xs font-semibold text-teal-700">
                  On Track
                </span>
              </div>

              <div className="mt-5 rounded-2xl bg-sand-100 px-5 py-4 text-center">
                <p className="font-display text-4xl font-medium text-ink">
                  248<span className="text-xl text-ink-soft"> / 300</span>
                </p>
                <p className="mt-1 text-xs text-ink-muted">Overall developmental score</p>
              </div>

              <div className="mt-5 space-y-3.5">
                {breakdown.map((row) => (
                  <div key={row.label}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-sm font-medium text-ink">{row.label}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold ${row.tone}`}>
                        {row.zone}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-sand-200">
                      <div className={`h-full rounded-full ${row.bar} ${row.width}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function WhyNamo() {
  return (
    <section id="why" className="scroll-mt-24 bg-surface py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <SectionHeading
            eyebrow="Why Namo"
            title={<>Built for trust, designed for warmth</>}
            description="Every decision in Namo balances clinical reliability with the emotional reassurance that parents truly need."
          />
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {VALUES.map((value, i) => (
            <Reveal key={value.title} delay={i * 70}>
              <div className="flex h-full flex-col rounded-3xl border border-sand-200 bg-sand-50 p-7 transition hover:-translate-y-1 hover:border-transparent hover:bg-surface hover:shadow-glow-lg">
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${value.tone}`}
                >
                  <value.Icon width={22} height={22} />
                </span>
                <h3 className="mt-5 text-base font-semibold text-ink">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{value.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <SectionHeading
            eyebrow="Loved by families"
            title={<>Calm for parents, clarity for clinicians</>}
          />
        </Reveal>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {TESTIMONIALS.map((item, i) => (
            <Reveal key={item.name} delay={i * 100}>
              <figure className="flex h-full flex-col rounded-3xl border border-sand-200 bg-surface p-7 shadow-soft">
                <QuoteIcon width={30} height={30} className="text-primary-200" />
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-ink">
                  “{item.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-sand-200 pt-5">
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold ${item.avatar}`}
                  >
                    {item.initials}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{item.name}</p>
                    <p className="text-xs text-ink-muted">{item.role}</p>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 bg-surface py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Reveal>
          <SectionHeading
            eyebrow="Good questions"
            title={<>Everything you might be wondering</>}
          />
        </Reveal>

        <div className="mt-12 space-y-3">
          {FAQS.map((faq, i) => (
            <Reveal key={faq.q} delay={i * 50}>
              <details className="group rounded-2xl border border-sand-200 bg-sand-50 px-5 py-1 transition open:bg-surface open:shadow-soft">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-semibold text-ink marker:hidden">
                  {faq.q}
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sand-200 text-ink-muted transition group-open:rotate-45 group-open:bg-primary-100 group-open:text-primary-700">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </summary>
                <p className="pb-5 pr-10 text-sm leading-relaxed text-ink-muted">{faq.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="px-4 py-24 sm:px-6">
      <Reveal className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-primary-600 px-6 py-16 text-center sm:px-12">
          <div className="namo-dots absolute inset-0 opacity-50" aria-hidden="true" />
          <div
            className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-primary-400/50 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-gold-400/30 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative">
            <span className="text-3xl">🌷</span>
            <h2 className="mx-auto mt-4 max-w-2xl font-display text-3xl font-medium leading-tight tracking-tight text-white sm:text-4xl">
              Give your child the gift of early support
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-primary-100">
              Create a free account and complete your first gentle check-in in
              about ten minutes. No milestone should go unnoticed.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="group inline-flex h-13 items-center justify-center gap-2 rounded-full bg-surface px-8 text-sm font-semibold text-primary-700 shadow-glow-lg transition hover:-translate-y-0.5 hover:bg-sand-50"
              >
                Create your free account
                <ArrowRightIcon
                  width={18}
                  height={18}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-13 items-center justify-center rounded-full border border-primary-300/60 px-8 text-sm font-semibold text-white transition hover:bg-primary-500"
              >
                I already have an account
              </Link>
            </div>

            <p className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-primary-100">
              <span className="inline-flex items-center gap-1.5">
                <CheckIcon width={14} height={14} /> Free to start
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckIcon width={14} height={14} /> No card required
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckIcon width={14} height={14} /> Private &amp; secure
              </span>
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
