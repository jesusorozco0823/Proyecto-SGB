"use client";

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Reminder = { id: string; client: string; phone: string | null; service: string; message: string; whatsapp: string | null };

export default function RemindersPage() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [date, setDate] = useState(tomorrow.toISOString().slice(0, 10));
  const [rows, setRows] = useState<Reminder[]>([]);

  useEffect(() => {
    apiClient.get<Reminder[]>(`/api/v1/reminders?date=${date}`).then(setRows).catch(() => setRows([]));
  }, [date]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Recordatorios</h1>
        <p className="text-muted-foreground">Solo las citas que todavía no confirman. Ábreles WhatsApp una vez.</p>
      </div>
      <Input className="max-w-xs" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      <div className="space-y-3">
        {rows.map((row) => (
          <Card key={row.id}>
            <CardHeader>
              <CardTitle>{row.client} · {row.service}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{row.message}</p>
              {row.whatsapp && <Button asChild variant="secondary"><a href={row.whatsapp} target="_blank" rel="noreferrer">Abrir WhatsApp</a></Button>}
            </CardContent>
          </Card>
        ))}
        {rows.length === 0 && <p className="text-sm text-muted-foreground">No hay citas para ese día.</p>}
      </div>
    </div>
  );
}
