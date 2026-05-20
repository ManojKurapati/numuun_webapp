import type { HTMLAttributes } from 'react';
import { cn } from './cn';

/** Surface card — frosted glass over the warm page wash. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('namo-glass rounded-2xl shadow-glow', className)} {...props} />;
}

/** Interactive card variant — lifts on hover. */
export function CardLink({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'namo-glass rounded-2xl shadow-glow transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-glow-lg',
        className,
      )}
      {...props}
    />
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 sm:p-8', className)} {...props} />;
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('border-b border-sand-200 px-6 py-5 sm:px-8', className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-lg font-semibold text-ink', className)} {...props} />;
}
