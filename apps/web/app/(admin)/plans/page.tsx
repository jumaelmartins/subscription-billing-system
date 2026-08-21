'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { api } from '../../../lib/api';
import { money } from '../../../lib/format';
import type { Plan } from '../../../lib/types';
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  Table,
  TD,
  TH,
  THead,
  TR,
} from '../../../components/ui';

interface PlanForm {
  name: string;
  description: string;
  priceDollars: string;
  billingCycle: 'monthly' | 'yearly';
}

export default function PlansPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ['plans'], queryFn: () => api.get<Plan[]>('/plans') });
  const { register, handleSubmit, reset } = useForm<PlanForm>({
    defaultValues: { name: '', description: '', priceDollars: '', billingCycle: 'monthly' },
  });

  const create = useMutation({
    mutationFn: (v: PlanForm) =>
      api.post('/plans', {
        name: v.name,
        description: v.description || undefined,
        price: Math.round(Number(v.priceDollars) * 100),
        billingCycle: v.billingCycle,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plans'] });
      reset();
      setOpen(false);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Plans</h1>
          <p className="text-sm text-zinc-500">Commercial plans customers can subscribe to.</p>
        </div>
        <Button onClick={() => setOpen(true)}>New plan</Button>
      </div>

      <Table>
        <THead>
          <TR>
            <TH>Name</TH>
            <TH>Price</TH>
            <TH>Cycle</TH>
            <TH>Status</TH>
          </TR>
        </THead>
        <tbody>
          {(data ?? []).map((p) => (
            <TR key={p.id}>
              <TD className="font-medium text-zinc-100">{p.name}</TD>
              <TD>{money(p.price)}</TD>
              <TD>{p.billingCycle}</TD>
              <TD>
                <Badge value={p.status} />
              </TD>
            </TR>
          ))}
        </tbody>
      </Table>
      {!isLoading && (data ?? []).length === 0 && <EmptyState>No plans yet.</EmptyState>}

      <Modal open={open} onClose={() => setOpen(false)} title="New plan">
        <form onSubmit={handleSubmit((v) => create.mutate(v))} className="space-y-4">
          <Field label="Name">
            <Input {...register('name', { required: true })} />
          </Field>
          <Field label="Price (USD)">
            <Input type="number" step="0.01" min="0" {...register('priceDollars', { required: true })} />
          </Field>
          <Field label="Billing cycle">
            <Select {...register('billingCycle')}>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </Select>
          </Field>
          <Field label="Description (optional)">
            <Input {...register('description')} />
          </Field>
          {create.isError && <p className="text-sm text-red-400">Could not create plan.</p>}
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
