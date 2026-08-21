'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { dateTime } from '../../../lib/format';
import type { AuditEntry } from '../../../lib/types';
import { EmptyState, Table, TD, TH, THead, TR } from '../../../components/ui';

export default function AuditPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['audit'],
    queryFn: () => api.get<AuditEntry[]>('/audit'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Audit log</h1>
        <p className="text-sm text-zinc-500">Important actions recorded across the system.</p>
      </div>

      <Table>
        <THead>
          <TR>
            <TH>Action</TH>
            <TH>Entity</TH>
            <TH>Entity id</TH>
            <TH>When</TH>
          </TR>
        </THead>
        <tbody>
          {(data ?? []).map((a) => (
            <TR key={a.id}>
              <TD className="font-medium text-zinc-100">{a.action}</TD>
              <TD>{a.entityType}</TD>
              <TD className="font-mono text-xs text-zinc-400">
                {a.entityId ? `${a.entityId.slice(0, 8)}…` : '—'}
              </TD>
              <TD>{dateTime(a.createdAt)}</TD>
            </TR>
          ))}
        </tbody>
      </Table>
      {!isLoading && (data ?? []).length === 0 && <EmptyState>No audit entries yet.</EmptyState>}
    </div>
  );
}
