'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { api, ApiError } from '../../lib/api';
import { Button, Card, Field, Input } from '../../components/ui';

interface FormValues {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: { email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => api.post('/auth/login', values),
    onSuccess: () => router.replace('/'),
  });

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-xl font-semibold">Sign in</h1>
        <p className="mb-5 text-sm text-zinc-500">Subscription Billing admin console</p>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <Field label="Email">
            <Input type="email" autoComplete="username" {...register('email', { required: true })} />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              autoComplete="current-password"
              {...register('password', { required: true })}
            />
          </Field>
          {mutation.isError && (
            <p className="text-sm text-red-400">
              {(mutation.error as ApiError).status === 401 ? 'Invalid credentials' : 'Login failed'}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </Card>
    </main>
  );
}
