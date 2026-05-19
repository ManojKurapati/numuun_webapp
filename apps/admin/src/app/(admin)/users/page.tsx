'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ApiError } from '@namo/api-client';
import { USER_ROLES } from '@namo/types';
import { Alert, Badge, Button, Card, CardBody, Field, Input, PageHeader, Select, Skeleton } from '@namo/ui';
import { adminCreateUserSchema, type AdminCreateUserInput } from '@namo/validation';
import { api } from '@/lib/api';
import { formatDate, humanize } from '@/lib/format';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: () => api().listUsers({ pageSize: 100 }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdminCreateUserInput>({
    resolver: zodResolver(adminCreateUserSchema),
    defaultValues: { role: 'PARENT' },
  });

  const createMutation = useMutation({
    mutationFn: (input: AdminCreateUserInput) =>
      api().createUser({ ...input, phone: input.phone?.trim() || undefined }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      reset({ role: 'PARENT', email: '', password: '', fullName: '', phone: '' });
      setShowForm(false);
    },
    onError: (error) =>
      setFormError(error instanceof ApiError ? error.message : 'Could not create the user.'),
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    createMutation.mutate(values);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Parents, clinicians and administrators."
        actions={
          <Button onClick={() => setShowForm((open) => !open)} variant={showForm ? 'ghost' : 'primary'}>
            {showForm ? 'Cancel' : 'Add user'}
          </Button>
        }
      />

      {showForm && (
        <Card>
          <CardBody>
            <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
              {formError && (
                <div className="sm:col-span-2">
                  <Alert variant="error">{formError}</Alert>
                </div>
              )}
              <Field label="Full name" htmlFor="fullName" required error={errors.fullName?.message}>
                <Input id="fullName" invalid={Boolean(errors.fullName)} {...register('fullName')} />
              </Field>
              <Field label="Email" htmlFor="email" required error={errors.email?.message}>
                <Input id="email" type="email" invalid={Boolean(errors.email)} {...register('email')} />
              </Field>
              <Field label="Role" htmlFor="role" required error={errors.role?.message}>
                <Select id="role" invalid={Boolean(errors.role)} {...register('role')}>
                  {USER_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {humanize(role)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Phone" htmlFor="phone" error={errors.phone?.message}>
                <Input id="phone" type="tel" invalid={Boolean(errors.phone)} {...register('phone')} />
              </Field>
              <Field
                label="Temporary password"
                htmlFor="password"
                required
                hint="At least 8 characters."
                error={errors.password?.message}
              >
                <Input
                  id="password"
                  type="text"
                  invalid={Boolean(errors.password)}
                  {...register('password')}
                />
              </Field>
              <div className="flex items-end">
                <Button type="submit" loading={createMutation.isPending} fullWidth>
                  Create user
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {usersQuery.isLoading && <Skeleton className="h-64" />}
      {usersQuery.isError && <Alert variant="error">We couldn&apos;t load users.</Alert>}

      {usersQuery.data && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sand-200 text-left text-xs uppercase tracking-wide text-ink-soft">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Role</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {usersQuery.data.items.map((user) => (
                  <tr key={user.id} className="border-b border-sand-200 last:border-0">
                    <td className="px-6 py-4 font-medium text-ink">{user.fullName}</td>
                    <td className="px-6 py-4 text-ink-muted">{user.email}</td>
                    <td className="px-6 py-4">
                      <Badge tone="neutral">{humanize(user.role)}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge tone={user.isActive ? 'teal' : 'clay'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-ink-muted">{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
