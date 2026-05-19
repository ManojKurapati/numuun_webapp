import type { ReactNode, SVGProps } from 'react';

/** Shared props for the hand-drawn-feel stroke icon set. */
type IconProps = SVGProps<SVGSVGElement>;

function Stroke({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function HeartIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M12 20s-7-4.35-9.4-8.45C1.1 8.9 2.8 5 6.4 5 8.7 5 10.6 6.4 12 8.3 13.4 6.4 15.3 5 17.6 5c3.6 0 5.3 3.9 3.8 6.55C19 15.65 12 20 12 20Z" />
    </Stroke>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M12 3.2 5 6v6.1c0 4.6 3 7.7 7 9.1 4-1.4 7-4.5 7-9.1V6l-7-2.8Z" />
      <path d="m9 12 2 2 4-4.2" />
    </Stroke>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M12 3.2 13.9 9 19.6 11 13.9 13 12 18.8 10.1 13 4.4 11 10.1 9 12 3.2Z" />
      <path d="M18.5 16.5 19.3 19 21.8 19.8 19.3 20.6 18.5 23.1 17.7 20.6 15.2 19.8 17.7 19 18.5 16.5Z" />
    </Stroke>
  );
}

export function WifiIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M4.5 10.5a11 11 0 0 1 15 0" />
      <path d="M7.7 13.8a6.4 6.4 0 0 1 8.6 0" />
      <path d="M10.8 17.1a2 2 0 0 1 2.4 0" />
      <circle cx="12" cy="19.4" r="0.4" fill="currentColor" />
    </Stroke>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M3.4 12h17.2M12 3.4c2.4 2.3 3.8 5.4 3.8 8.6S14.4 18.3 12 20.6C9.6 18.3 8.2 15.2 8.2 12S9.6 5.7 12 3.4Z" />
    </Stroke>
  );
}

export function CompassIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="m15.4 8.6-1.6 5.2-5.2 1.6 1.6-5.2 5.2-1.6Z" />
    </Stroke>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="m5 12.5 4.2 4.2L19 6.8" />
    </Stroke>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M4.5 12h14M13 6l6 6-6 6" />
    </Stroke>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M9 6.8c0-.8.9-1.3 1.6-.9l7.6 4.4a1 1 0 0 1 0 1.7l-7.6 4.4c-.7.4-1.6-.1-1.6-.9V6.8Z" />
    </Stroke>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 3.6 14.5 9l5.9.7-4.4 4 1.2 5.8L12 16.7 6.8 19.5 8 13.7 3.6 9.7 9.5 9 12 3.6Z" />
    </svg>
  );
}

export function QuoteIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M9.3 6C6.4 7.3 4.5 10 4.5 13.4c0 2.7 1.6 4.6 3.9 4.6 2 0 3.5-1.5 3.5-3.5 0-1.9-1.4-3.3-3.2-3.3-.3 0-.7 0-.9.1.4-1.5 1.8-2.9 3.6-3.7L9.3 6Zm9 0C15.4 7.3 13.5 10 13.5 13.4c0 2.7 1.6 4.6 3.9 4.6 2 0 3.5-1.5 3.5-3.5 0-1.9-1.4-3.3-3.2-3.3-.3 0-.7 0-.9.1.4-1.5 1.8-2.9 3.6-3.7L18.3 6Z" />
    </svg>
  );
}
