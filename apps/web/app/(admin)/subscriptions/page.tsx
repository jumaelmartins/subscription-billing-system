'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { api } from '../../../lib/api';
import { shortDate } from '../../../lib/format';
import type { Customer, Plan, Subscription } from '../../../lib/types';
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Modal,
  Select,
  Table,
  TD,
  TH,
  THead,
  TR,
} from '../../../components/ui';

export default function SubscriptionsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const subs = useQuery({ queryKey: ['subscriptions'], queryFn: () => api.get<Subscription[]>('/subscriptions') });
  const customers = useQuery({ queryKey: ['customers'], queryFn: () => api.get<Customer[]>('/customers') });
  const plans = useQuery({ queryKey: ['plans'], queryFn: () => api.get<Plan[]>('/plans') });

  const custName = (id: string) => customers.data?.find((c) => c.id === id)?.name ?? `${id.slice(0, 8)}…`;
  const planName = (id: string) => plans.data?.find((p) => p.id === id)?.name ?? `${id.slice(0, 8)}…`;

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { customerId: '', planId: '', trial: false },
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['subscriptions'] });

  const create = useMutation({
    mutationFn: (v: { customerId: string; planId: string; trial: boolean }) =>
      api.post('/subscriptions', { customerId: v.customerId, planId: v.planId, trial: v.trial }),
    onSuccess: () => {
      invalidate();
      reset();
      setOpen(false);
    },
  });
  const cancel = useMutation({
    mutationFn: (id: string) => api.post(`/subscriptions/${id}/cancel`, {}),
    onSuccess: invalidate,
  });
  const reactivate = useMutation({
    mutationFn: (id: string) => api.post(`/subscriptions/${id}/reactivate`),
    onSuccess: invalidate,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Subscriptions</h1>
          <p className="text-sm text-zinc-500">Customer subscriptions and their lifecycle.</p>
        </div>
        <Button onClick={() => setOpen(true)}>New subscription</Button>
      </div>

      <Table>
        <THead>
          <TR>
            <TH>Customer</TH>
            <TH>Plan</TH>
            <TH>Status</TH>
            <TH>Period ends</TH>
            <TH>{''}</TH>
          </TR>
        </THead>
        <tbody>
          {(subs.data ?? []).map((s) => (
            <TR key={s.id}>
              <TD className="font-medium text-zinc-100">{custName(s.customerId)}</TD>
              <TD>{planName(s.planId)}</TD>
              <TD>
                <Badge value={s.status} />
              </TD>
              <TD>{shortDate(s.currentPeriodEnd)}</TD>
              <TD>
                {s.status === 'canceled' ? (
                  <Button variant="ghost" onClick={() => reactivate.mutate(s.id)}>
                    Reactivate
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={() => cancel.mutate(s.id)}>
                    Cancel
                  </Button>
                )}
              </TD>
            </TR>
          ))}
        </tbody>
      </Table>
      {!subs.isLoading && (subs.data ?? []).length === 0 && (
        <EmptyState>No subscriptions yet.</EmptyState>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New subscription">
        <form onSubmit={handleSubmit((v) => create.mutate(v))} className="space-y-4">
          <Field label="Customer">
            <Select {...register('customerId', { required: true })}>
              <option value="">Select a customer…</option>
              {(customers.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Plan">
            <Select {...register('planId', { required: true })}>
              <option value="">Select a plan…</option>
              {(plans.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" {...register('trial')} className="accent-blue-600" />
            Start with a trial
          </label>
          {create.isError && <p className="text-sm text-red-400">Could not create subscription.</p>}
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
