import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Providers } from './providers';
import './globals.css';

/**
 * Canonical, absolute base URL for the site — used to resolve Open Graph and
 * Twitter image URLs into absolute links (required by social crawlers).
 * Set `NEXT_PUBLIC_SITE_URL` in production; on Vercel it falls back to the
 * project's production domain.
 */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000');

const TITLE = 'Namo — Watch your child bloom, one milestone at a time';
const DESCRIPTION =
  'Namo turns trusted ASQ developmental screening into warm, 10-minute check-ins for children aged 0–6 — so you always know what to celebrate and when to ask for support.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: '%s · Namo',
  },
  description: DESCRIPTION,
  applicationName: 'Namo',
  category: 'health',
  keywords: [
    'child development',
    'developmental milestones',
    'ASQ',
    'Ages and Stages Questionnaires',
    'early childhood development',
    'pediatric screening',
    'milestone tracker',
    'parenting',
  ],
  authors: [{ name: 'Namo' }],
  creator: 'Namo',
  publisher: 'Namo',
  alternates: { canonical: '/' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: 'website',
    siteName: 'Namo',
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    locale: 'en_US',
    // The og:image is provided automatically by app/opengraph-image.tsx.
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    // The twitter:image is provided automatically by app/opengraph-image.tsx.
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
