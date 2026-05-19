'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ApiError } from '@namo/api-client';
import { GENDERS } from '@namo/types';
import { Alert, Button, Card, CardBody, Field, Input, Select } from '@namo/ui';
import { api } from '@/lib/api';

const GENDER_LABELS: Record<(typeof GENDERS)[number], string> = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
  UNDISCLOSED: 'Prefer not to say',
};

const childFormSchema = z.object({
  firstName: z.string().min(1, 'Please enter a first name').max(80),
  lastName: z.string().max(80).optional(),
  dateOfBirth: z.string().min(1, 'Please enter a date of birth'),
  gender: z.enum(GENDERS),
  gestationalAgeWeeks: z.string().optional(),
});
type ChildForm = z.infer<typeof childFormSchema>;

export default function NewChildPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChildForm>({
    resolver: zodResolver(childFormSchema),
    defaultValues: { gender: 'UNDISCLOSED' },
  });

  const mutation = useMutation({
    mutationFn: (form: ChildForm) =>
      api().createChild({
        firstName: form.firstName,
        lastName: form.lastName?.trim() || undefined,
        dateOfBirth: new Date(form.dateOfBirth),
        gender: form.gender,
        gestationalAgeWeeks: form.gestationalAgeWeeks
          ? Number(form.gestationalAgeWeeks)
          : undefined,
      }),
    onSuccess: async (child) => {
      await queryClient.invalidateQueries({ queryKey: ['children'] });
      router.push(`/children/${child.id}`);
    },
    onError: (error) => {
      setFormError(
        error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
      );
    },
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    mutation.mutate(values);
  });

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link href="/dashboard" className="text-sm font-medium text-ink-muted hover:text-ink">
          ← Back
        </Link>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-ink">
          Add a child
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          We use the date of birth to choose the right check-in for your child&apos;s age.
        </p>
      </div>

      <Card>
        <CardBody>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            {formError && <Alert variant="error">{formError}</Alert>}

            <Field label="First name" htmlFor="firstName" required error={errors.firstName?.message}>
              <Input id="firstName" invalid={Boolean(errors.firstName)} {...register('firstName')} />
            </Field>

            <Field label="Last name" htmlFor="lastName" error={errors.lastName?.message}>
              <Input id="lastName" invalid={Boolean(errors.lastName)} {...register('lastName')} />
            </Field>

            <Field
              label="Date of birth"
              htmlFor="dateOfBirth"
              required
              error={errors.dateOfBirth?.message}
            >
              <Input
                id="dateOfBirth"
                type="date"
                max={today}
                invalid={Boolean(errors.dateOfBirth)}
                {...register('dateOfBirth')}
              />
            </Field>

            <Field label="Gender" htmlFor="gender" error={errors.gender?.message}>
              <Select id="gender" invalid={Boolean(errors.gender)} {...register('gender')}>
                {GENDERS.map((value) => (
                  <option key={value} value={value}>
                    {GENDER_LABELS[value]}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Gestational age at birth (weeks)"
              htmlFor="gestationalAgeWeeks"
              hint="Optional — helps account for premature birth."
              error={errors.gestationalAgeWeeks?.message}
            >
              <Input
                id="gestationalAgeWeeks"
                type="number"
                min={20}
                max={45}
                placeholder="e.g. 40"
                invalid={Boolean(errors.gestationalAgeWeeks)}
                {...register('gestationalAgeWeeks')}
              />
            </Field>

            <div className="flex justify-end gap-3 pt-2">
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center rounded-full px-6 text-sm font-medium text-ink-muted hover:bg-sand-200"
              >
                Cancel
              </Link>
              <Button type="submit" loading={mutation.isPending}>
                Add child
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
