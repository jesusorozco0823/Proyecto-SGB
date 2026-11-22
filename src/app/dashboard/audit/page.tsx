"use client";

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Entry = { id: string; at: string; actor: string; action: string; resource: string };

export default function AuditPage() {
  const [rows, setRows] = useState<Entry[]>([]);
  const [query, setQuery] = useState('');
  const [action, setAction] = useState('todas');

  useEffect(() => {
    apiClient.get<Entry[]>('/api/v1/audit').then(setRows).catch(() => setRows([]));
  }, []);

  const actions = ['todas', ...Array.from(new Set(rows.map((row) => row.action)))];
  const visible = rows.filter((row) => {
    const text = `${row.actor} ${row.action} ${row.resource}`.toLowerCase();
    const matchesQuery = !query.trim() || text.includes(query.trim().toLowerCase());
    return matchesQuery && (action === 'todas' || row.action === action);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Bitácora</h1>
        <p className="text-muted-foreground">Últimas acciones de administración.</p>
      </div>
      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-3">
        <Input className="h-10 rounded-full" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar persona, acción o recurso" aria-label="Buscar en la bitácora" />
        <div className="flex flex-wrap gap-2">
          {actions.map((item) => (
            <Button key={item} type="button" variant={action === item ? 'default' : 'outline'} className="h-10 rounded-full px-4" onClick={() => setAction(item)}>
              {item === 'todas' ? 'Todas' : item}
            </Button>
          ))}
        </div>
      </div>
      <div className="mx-auto w-full max-w-3xl space-y-3">
        {visible.map((row) => (
          <article key={row.id} className="rounded-2xl border bg-card p-4">
            <p className="font-medium">{row.action}</p>
            <p className="mt-1 text-sm text-muted-foreground">{row.actor} · {new Date(row.at).toLocaleString('es-CO')}</p>
            <p className="mt-2 text-sm">{row.resource}</p>
          </article>
        ))}
        {rows.length > 0 && visible.length === 0 && <p className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">Nada coincide con ese filtro.</p>}
        {rows.length === 0 && <p className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">Todavía no hay acciones registradas.</p>}
      </div>
    </div>
  );
}
