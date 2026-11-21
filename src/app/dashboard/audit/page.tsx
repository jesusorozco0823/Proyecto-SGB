"use client";

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Entry = { id: string; at: string; actor: string; action: string; resource: string };

export default function AuditPage() {
  const [rows, setRows] = useState<Entry[]>([]);

  useEffect(() => {
    apiClient.get<Entry[]>('/api/v1/audit').then(setRows).catch(() => setRows([]));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Bitácora</h1>
        <p className="text-muted-foreground">Últimas acciones de administración.</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cuándo</TableHead>
            <TableHead>Quién</TableHead>
            <TableHead>Acción</TableHead>
            <TableHead>Recurso</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{new Date(row.at).toLocaleString('es-CO')}</TableCell>
              <TableCell>{row.actor}</TableCell>
              <TableCell>{row.action}</TableCell>
              <TableCell>{row.resource}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
