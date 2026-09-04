'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { api } from '../../../lib/api';
import { money, shortDate } from '../../../lib/format';
import type { Invoice, Subscription } from '../../../lib/types';
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

export default function InvoicesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const invoices = useQuery({ queryKey: ['invoices'], queryFn: () => api.get<Invoice[]>('/invoices') });
  const subs = useQuery({ queryKey: ['subscriptions'], queryFn: () => api.get<Subscription[]>('/subscriptions') });
  const { register, handleSubmit, reset } = useForm({ defaultValues: { subscriptionId: '' } });

  // Processing is async (worker); refetch shortly after to reflect the new state.
  const refetchSoon = () => setTimeout(() => qc.invalidateQueries({ queryKey: ['invoices'] }), 1500);

  const generate = useMutation({
    mutationFn: (v: { subscriptionId: string }) => api.post('/invoices', v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      reset();
      setOpen(false);
    },
  });
  const simulatePay = useMutation({
    mutationFn: (id: string) => api.post(`/invoices/${id}/simulate-payment`),
    onSuccess: refetchSoon,
  });
  const simulateFail = useMutation({
    mutationFn: (id: string) => api.post(`/invoices/${id}/simulate-failure`),
    onSuccess: refetchSoon,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Invoices</h1>
          <p className="text-sm text-zinc-500">
            Generate invoices and simulate provider payments through the webhook pipeline.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>Generate invoice</Button>
      </div>

      <Table>
        <THead>
          <TR>
            <TH>Invoice</TH>
            <TH>Amount</TH>
            <TH>Status</TH>
            <TH>Due</TH>
            <TH>{''}</TH>
          </TR>
        </THead>
        <tbody>
          {(invoices.data ?? []).map((i) => (
            <TR key={i.id}>
              <TD className="font-mono text-xs text-zinc-300">{i.number}</TD>
              <TD className="font-medium text-zinc-100">{money(i.amount)}</TD>
              <TD>
                <Badge value={i.status} />
              </TD>
              <TD>{shortDate(i.dueDate)}</TD>
              <TD>
                {i.status === 'open' && (
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => simulatePay.mutate(i.id)}>
                      Simulate payment
                    </Button>
                    <Button variant="ghost" onClick={() => simulateFail.mutate(i.id)}>
                      Simulate failure
                    </Button>
                  </div>
                )}
              </TD>
            </TR>
          ))}
        </tbody>
      </Table>
      {!invoices.isLoading && (invoices.data ?? []).length === 0 && (
        <EmptyState>No invoices yet.</EmptyState>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Generate invoice">
        <form onSubmit={handleSubmit((v) => generate.mutate(v))} className="space-y-4">
          <Field label="Subscription">
            <Select {...register('subscriptionId', { required: true })}>
              <option value="">Select a subscription…</option>
              {(subs.data ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id.slice(0, 8)}… · {s.status}
                </option>
              ))}
            </Select>
          </Field>
          {generate.isError && <p className="text-sm text-red-400">Could not generate invoice.</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={generate.isPending}>
              {generate.isPending ? 'Generating…' : 'Generate'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
