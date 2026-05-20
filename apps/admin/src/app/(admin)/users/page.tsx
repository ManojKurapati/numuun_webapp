'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ApiError, type PublicUser } from '@namo/api-client';
import { USER_ROLES } from '@namo/types';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  DataTable,
  Field,
  FilterBar,
  Input,
  KpiStrip,
  KpiTile,
  PageHeader,
  Select,
  type DataColumn,
} from '@namo/ui';
import { adminCreateUserSchema, type AdminCreateUserInput } from '@namo/validation';
import { api } from '@/lib/api';
import { formatDate, humanize } from '@/lib/format';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState('');

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: () => api().listUsers({ pageSize: 200 }),
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
      setFormError(null);
    },
    onError: (error) =>
      setFormError(error instanceof ApiError ? error.message : 'Could not create the user.'),
  });

  const toggleMutation = useMutation({
    mutationFn: (params: { id: string; isActive: boolean }) =>
      api().setUserActive(params.id, params.isActive),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    createMutation.mutate(values);
  });

  const items = usersQuery.data?.items ?? [];
  const filtered = roleFilter ? items.filter((user) => user.role === roleFilter) : items;
  const totals = USER_ROLES.reduce<Record<string, number>>((acc, role) => {
    acc[role] = items.filter((user) => user.role === role).length;
    return acc;
  }, {});

  const columns: DataColumn<PublicUser>[] = [
    {
      key: 'user',
      header: 'User',
      render: (user) => (
        <div>
          <p className="font-medium text-ink">{user.fullName}</p>
          <p className="text-xs text-ink-soft">{user.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (user) => <Badge tone="neutral">{humanize(user.role)}</Badge>,
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (user) => <span className="text-ink-muted">{user.phone ?? '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (user) => (
        <Badge tone={user.isActive ? 'teal' : 'clay'}>{user.isActive ? 'Active' : 'Inactive'}</Badge>
      ),
    },
    {
      key: 'joined',
      header: 'Joined',
      render: (user) => <span className="text-xs text-ink-muted">{formatDate(user.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (user) => (
        <Button
          size="sm"
          variant={user.isActive ? 'ghost' : 'primary'}
          onClick={() => toggleMutation.mutate({ id: user.id, isActive: !user.isActive })}
          loading={toggleMutation.isPending && toggleMutation.variables?.id === user.id}
        >
          {user.isActive ? 'Deactivate' : 'Reactivate'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Users & roles"
        description="Manage administrators, clinicians, parents and partner organisations."
        actions={
          <Button onClick={() => setShowForm((open) => !open)} variant={showForm ? 'ghost' : 'primary'}>
            {showForm ? 'Cancel' : 'Add user'}
          </Button>
        }
      />

      <KpiStrip>
        <KpiTile label="Total users" value={items.length} />
        <KpiTile label="Parents" value={totals.PARENT ?? 0} icon="🧑‍🍼" />
        <KpiTile label="Clinicians" value={totals.PEDIATRICIAN ?? 0} icon="🩺" />
        <KpiTile label="Administrators" value={totals.ADMIN ?? 0} icon="🛡" tone="positive" />
      </KpiStrip>

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

      <FilterBar>
        <Select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
          <option value="">Any role</option>
          {USER_ROLES.map((role) => (
            <option key={role} value={role}>
              {humanize(role)}
            </option>
          ))}
        </Select>
        <div className="ml-auto text-xs text-ink-soft">
          {usersQuery.data ? `${filtered.length} of ${usersQuery.data.total} users` : ' '}
        </div>
      </FilterBar>

      {usersQuery.isError && <Alert variant="error">We couldn&apos;t load users.</Alert>}

      <DataTable<PublicUser>
        columns={columns}
        rows={filtered}
        rowKey={(row) => row.id}
        loading={usersQuery.isLoading}
        empty="No users match these filters."
      />
    </div>
  );
}
