'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { api } from '../../../lib/api';
import { shortDate } from '../../../lib/format';
import type { Customer } from '../../../lib/types';
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Modal,
  Table,
  TD,
  TH,
  THead,
  TR,
} from '../../../components/ui';

export default function CustomersPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get<Customer[]>('/customers'),
  });
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { name: '', email: '', document: '' },
  });

  const create = useMutation({
    mutationFn: (v: { name: string; email: string; document: string }) =>
      api.post('/customers', { name: v.name, email: v.email, document: v.document || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      reset();
      setOpen(false);
    },
  });
  const deactivate = useMutation({
    mutationFn: (id: string) => api.post(`/customers/${id}/deactivate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Customers</h1>
          <p className="text-sm text-zinc-500">Companies subscribing to your plans.</p>
        </div>
        <Button onClick={() => setOpen(true)}>New customer</Button>
      </div>

      <Table>
        <THead>
          <TR>
            <TH>Name</TH>
            <TH>Email</TH>
            <TH>Status</TH>
            <TH>Created</TH>
            <TH>{''}</TH>
          </TR>
        </THead>
        <tbody>
          {(data ?? []).map((c) => (
            <TR key={c.id}>
              <TD className="font-medium text-zinc-100">{c.name}</TD>
              <TD>{c.email}</TD>
              <TD>
                <Badge value={c.status} />
              </TD>
              <TD>{shortDate(c.createdAt)}</TD>
              <TD>
                {c.status === 'active' && (
                  <Button variant="ghost" onClick={() => deactivate.mutate(c.id)}>
                    Deactivate
                  </Button>
                )}
              </TD>
            </TR>
          ))}
        </tbody>
      </Table>
      {!isLoading && (data ?? []).length === 0 && <EmptyState>No customers yet.</EmptyState>}

      <Modal open={open} onClose={() => setOpen(false)} title="New customer">
        <form onSubmit={handleSubmit((v) => create.mutate(v))} className="space-y-4">
          <Field label="Name">
            <Input {...register('name', { required: true })} />
          </Field>
          <Field label="Email">
            <Input type="email" {...register('email', { required: true })} />
          </Field>
          <Field label="Document (optional)">
            <Input {...register('document')} />
          </Field>
          {create.isError && <p className="text-sm text-red-400">Could not create customer.</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? 'Saving…' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
