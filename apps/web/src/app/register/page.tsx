'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ApiError } from '@namo/api-client';
import { Alert, Button, Field, Input } from '@namo/ui';
import { registerSchema, type RegisterInput } from '@namo/validation';
import { AuthShell } from '@/components/auth-shell';
import { useAuth } from '@/lib/auth';

export default function RegisterPage() {
  const { register: registerAccount } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      // An empty phone field should be omitted rather than sent as "".
      await registerAccount({ ...values, phone: values.phone?.trim() || undefined });
      router.push('/dashboard');
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
      );
    }
  });

  return (
    <AuthShell
      title="Create your account"
      subtitle="A gentle, reliable way to follow your child's development."
      footer={
        <>
          Already have an account?{' '}
          <Link className="font-medium text-primary-600 hover:text-primary-700" href="/login">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {formError && <Alert variant="error">{formError}</Alert>}
        <Field label="Full name" htmlFor="fullName" error={errors.fullName?.message}>
          <Input
            id="fullName"
            autoComplete="name"
            placeholder="Your name"
            invalid={Boolean(errors.fullName)}
            {...register('fullName')}
          />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            invalid={Boolean(errors.email)}
            {...register('email')}
          />
        </Field>
        <Field
          label="Phone"
          htmlFor="phone"
          hint="Optional — for assessment reminders."
          error={errors.phone?.message}
        >
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+971 ..."
            invalid={Boolean(errors.phone)}
            {...register('phone')}
          />
        </Field>
        <Field
          label="Password"
          htmlFor="password"
          hint="At least 8 characters."
          error={errors.password?.message}
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            invalid={Boolean(errors.password)}
            {...register('password')}
          />
        </Field>
        <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
