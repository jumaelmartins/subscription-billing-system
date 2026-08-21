'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { dateTime } from '../../../lib/format';
import type { WebhookEvent } from '../../../lib/types';
import { Badge, EmptyState, Table, TD, TH, THead, TR } from '../../../components/ui';

export default function WebhooksPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => api.get<WebhookEvent[]>('/webhooks'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Webhooks</h1>
        <p className="text-sm text-zinc-500">
          Received provider events. Duplicates are ignored by the idempotency key.
        </p>
      </div>

      <Table>
        <THead>
          <TR>
            <TH>Event</TH>
            <TH>Provider event id</TH>
            <TH>Status</TH>
            <TH>Received</TH>
          </TR>
        </THead>
        <tbody>
          {(data ?? []).map((w) => (
            <TR key={w.id}>
              <TD className="font-medium text-zinc-100">{w.eventType}</TD>
              <TD className="font-mono text-xs text-zinc-400">{w.providerEventId.slice(0, 12)}…</TD>
              <TD>
                <Badge value={w.status} />
              </TD>
              <TD>{dateTime(w.createdAt)}</TD>
            </TR>
          ))}
        </tbody>
      </Table>
      {!isLoading && (data ?? []).length === 0 && <EmptyState>No webhooks received yet.</EmptyState>}
    </div>
  );
}
