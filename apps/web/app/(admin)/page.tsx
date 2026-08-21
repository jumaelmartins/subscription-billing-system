'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { money } from '../../lib/format';
import type { Summary } from '../../lib/types';
import { Card } from '../../components/ui';

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </Card>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['summary'],
    queryFn: () => api.get<Summary>('/stats/summary'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-zinc-500">Overview of your subscription business.</p>
      </div>

      {isLoading || !data ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Customers" value={data.customers} />
            <Stat label="Active subscriptions" value={data.subscriptions.active} />
            <Stat label="Paid invoices" value={data.invoices.paid} />
            <Stat label="Revenue (simulated)" value={money(data.revenueCents)} />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <div className="text-sm font-medium">Subscriptions</div>
              <div className="mt-2 text-sm text-zinc-400">
                {data.subscriptions.total} total · {data.subscriptions.active} active
              </div>
            </Card>
            <Card>
              <div className="text-sm font-medium">Invoices</div>
              <div className="mt-2 text-sm text-zinc-400">
                {data.invoices.open} open · {data.invoices.paid} paid · {data.invoices.total} total
              </div>
            </Card>
            <Card>
              <div className="text-sm font-medium">Customers</div>
              <div className="mt-2 text-sm text-zinc-400">{data.customers} total</div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
