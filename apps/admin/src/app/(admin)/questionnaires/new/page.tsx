'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  useFieldArray,
  useForm,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from 'react-hook-form';
import { z } from 'zod';
import { ApiError } from '@namo/api-client';
import { Alert, Button, Card, CardBody, CardHeader, CardTitle, Field, Input, Textarea } from '@namo/ui';
import { api } from '@/lib/api';

/**
 * Local form schema — all numeric inputs are strings here and converted on
 * submit. The API performs the authoritative validation.
 */
const formSchema = z.object({
  title: z.string().min(1, 'A title is required'),
  description: z.string().optional(),
  ageMinMonths: z.string().min(1, 'Required'),
  ageMaxMonths: z.string().min(1, 'Required'),
  domains: z
    .array(
      z.object({
        name: z.string().min(1, 'A name is required'),
        code: z
          .string()
          .min(1, 'Required')
          .regex(/^[a-z0-9_]+$/, 'Lowercase letters, numbers and underscores only'),
        delayThreshold: z.string().min(1, 'Required'),
        monitoringThreshold: z.string().min(1, 'Required'),
        questions: z
          .array(z.object({ text: z.string().min(1, 'Question text is required') }))
          .min(1, 'Add at least one question'),
      }),
    )
    .min(1, 'Add at least one domain'),
});

type FormValues = z.infer<typeof formSchema>;

const emptyQuestion = { text: '' };
const emptyDomain = {
  name: '',
  code: '',
  delayThreshold: '',
  monitoringThreshold: '',
  questions: [emptyQuestion],
};

export default function NewQuestionnairePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      ageMinMonths: '',
      ageMaxMonths: '',
      domains: [structuredClone(emptyDomain)],
    },
  });

  const domains = useFieldArray({ control, name: 'domains' });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      api().createQuestionnaire({
        title: values.title,
        description: values.description?.trim() || undefined,
        ageMinMonths: Number(values.ageMinMonths),
        ageMaxMonths: Number(values.ageMaxMonths),
        domains: values.domains.map((domain, domainIndex) => ({
          name: domain.name,
          code: domain.code,
          order: domainIndex,
          delayThreshold: Number(domain.delayThreshold),
          monitoringThreshold: Number(domain.monitoringThreshold),
          questions: domain.questions.map((question, questionIndex) => ({
            text: question.text,
            order: questionIndex,
          })),
        })),
      }),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ['questionnaires'] });
      router.push(`/questionnaires/${created.id}`);
    },
    onError: (error) =>
      setFormError(error instanceof ApiError ? error.message : 'Could not create the questionnaire.'),
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    mutation.mutate(values);
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/questionnaires" className="text-sm font-medium text-ink-muted hover:text-ink">
          ← Cancel
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">New questionnaire</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Saved as a draft — you can publish it once it&apos;s ready.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        {formError && <Alert variant="error">{formError}</Alert>}

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <Field label="Title" htmlFor="title" required error={errors.title?.message}>
              <Input id="title" invalid={Boolean(errors.title)} {...register('title')} />
            </Field>
            <Field label="Description" htmlFor="description" error={errors.description?.message}>
              <Textarea id="description" {...register('description')} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Min age (months)"
                htmlFor="ageMinMonths"
                required
                error={errors.ageMinMonths?.message}
              >
                <Input
                  id="ageMinMonths"
                  type="number"
                  min={0}
                  max={72}
                  invalid={Boolean(errors.ageMinMonths)}
                  {...register('ageMinMonths')}
                />
              </Field>
              <Field
                label="Max age (months)"
                htmlFor="ageMaxMonths"
                required
                error={errors.ageMaxMonths?.message}
              >
                <Input
                  id="ageMaxMonths"
                  type="number"
                  min={0}
                  max={72}
                  invalid={Boolean(errors.ageMaxMonths)}
                  {...register('ageMaxMonths')}
                />
              </Field>
            </div>
          </CardBody>
        </Card>

        {domains.fields.map((domainField, domainIndex) => (
          <DomainEditor
            key={domainField.id}
            domainIndex={domainIndex}
            control={control}
            register={register}
            errors={errors}
            removable={domains.fields.length > 1}
            onRemove={() => domains.remove(domainIndex)}
          />
        ))}

        {typeof errors.domains?.message === 'string' && (
          <Alert variant="error">{errors.domains.message}</Alert>
        )}

        <Button
          type="button"
          variant="secondary"
          onClick={() => domains.append(structuredClone(emptyDomain))}
        >
          + Add developmental area
        </Button>

        <div className="flex justify-end gap-3 border-t border-sand-200 pt-6">
          <Link
            href="/questionnaires"
            className="inline-flex h-12 items-center rounded-full px-6 text-sm font-medium text-ink-muted hover:bg-sand-100"
          >
            Cancel
          </Link>
          <Button type="submit" loading={mutation.isPending}>
            Save draft
          </Button>
        </div>
      </form>
    </div>
  );
}

function DomainEditor({
  domainIndex,
  control,
  register,
  errors,
  removable,
  onRemove,
}: {
  domainIndex: number;
  control: Control<FormValues>;
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
  removable: boolean;
  onRemove: () => void;
}) {
  const questions = useFieldArray({ control, name: `domains.${domainIndex}.questions` });
  const domainErrors = errors.domains?.[domainIndex];

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Developmental area {domainIndex + 1}</CardTitle>
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            className="text-sm font-medium text-clay-600 hover:text-clay-500"
          >
            Remove
          </button>
        )}
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Area name" required error={domainErrors?.name?.message}>
            <Input
              placeholder="Communication"
              invalid={Boolean(domainErrors?.name)}
              {...register(`domains.${domainIndex}.name`)}
            />
          </Field>
          <Field
            label="Code"
            required
            hint="Lowercase identifier, e.g. communication"
            error={domainErrors?.code?.message}
          >
            <Input
              placeholder="communication"
              invalid={Boolean(domainErrors?.code)}
              {...register(`domains.${domainIndex}.code`)}
            />
          </Field>
          <Field
            label="Delay threshold"
            required
            hint="Scores below this are flagged as a delay."
            error={domainErrors?.delayThreshold?.message}
          >
            <Input
              type="number"
              min={0}
              invalid={Boolean(domainErrors?.delayThreshold)}
              {...register(`domains.${domainIndex}.delayThreshold`)}
            />
          </Field>
          <Field
            label="On-track threshold"
            required
            hint="Scores at or above this are on track."
            error={domainErrors?.monitoringThreshold?.message}
          >
            <Input
              type="number"
              min={0}
              invalid={Boolean(domainErrors?.monitoringThreshold)}
              {...register(`domains.${domainIndex}.monitoringThreshold`)}
            />
          </Field>
        </div>

        <div className="space-y-3 border-t border-sand-200 pt-4">
          <p className="text-sm font-medium text-ink">Questions</p>
          {questions.fields.map((questionField, questionIndex) => (
            <div key={questionField.id} className="flex items-start gap-2">
              <div className="flex-1">
                <Input
                  placeholder={`Question ${questionIndex + 1}`}
                  invalid={Boolean(domainErrors?.questions?.[questionIndex]?.text)}
                  {...register(`domains.${domainIndex}.questions.${questionIndex}.text`)}
                />
                {domainErrors?.questions?.[questionIndex]?.text?.message && (
                  <p className="mt-1 text-xs font-medium text-clay-600">
                    {domainErrors.questions[questionIndex]?.text?.message}
                  </p>
                )}
              </div>
              {questions.fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => questions.remove(questionIndex)}
                  className="flex h-12 w-10 items-center justify-center rounded-lg text-clay-600 hover:bg-sand-100"
                  aria-label="Remove question"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => questions.append(structuredClone(emptyQuestion))}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            + Add question
          </button>
        </div>
      </CardBody>
    </Card>
  );
}
