import {
  forwardRef,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from './cn';

const FIELD_BASE =
  'w-full rounded-lg border bg-surface text-sm text-ink placeholder:text-ink-soft ' +
  'transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary-400/20 ' +
  'disabled:opacity-60';

function borderClass(invalid?: boolean): string {
  return invalid
    ? 'border-clay-500 focus:border-clay-500'
    : 'border-sand-300 focus:border-primary-500';
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('block text-sm font-medium text-ink', className)} {...props} />;
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

/** Soft-inset text input — 16px radius, warm sand border, orange focus glow. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(FIELD_BASE, 'h-12 px-4', borderClass(invalid), className)}
      {...props}
    />
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(FIELD_BASE, 'min-h-24 px-4 py-3', borderClass(invalid), className)}
      {...props}
    />
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, invalid, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(FIELD_BASE, 'h-12 px-4 pr-9', borderClass(invalid), className)}
      {...props}
    />
  );
});

/** Labelled field wrapper with hint and error text. */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
}: {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <Label htmlFor={htmlFor}>
          {label}
          {required && <span className="text-clay-500"> *</span>}
        </Label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-ink-soft">{hint}</p>}
      {error && <p className="text-xs font-medium text-clay-600">{error}</p>}
    </div>
  );
}
