"use client";

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { Check, CheckCheck, Send } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

type Contact = {
  id: string;
  displayName: string;
  role: 'client' | 'admin' | 'barber' | 'superadmin';
  incoming: number;
  pending: boolean;
};
type ChatLine = { id: string; body: string; mine: boolean; read: boolean; createdAt: string };

const phrases = [
  'Llega 5 minutos antes.',
  'Tu turno quedó listo.',
  'Hoy no hay hueco; te aviso si cancelan.',
];

function bookingLink(body: string) {
  const match = body.match(/(?:^|\n)(\/dashboard\/book\?[A-Za-z0-9=&%._-]{1,180})$/);
  return match?.[1] ?? null;
}

const roleLabel: Record<Contact['role'], string> = {
  client: 'Cliente',
  barber: 'Barbero',
  admin: 'Administrador',
  superadmin: 'Superadministrador',
};

function Messages() {
  const params = useSearchParams();
  const requested = params.get('with');
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<string | null>(requested);
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let stopped = false;
    let reported = false;
    const load = async () => {
      try {
        const rows = await apiClient.get<Contact[]>('/api/v1/messages');
        if (!stopped) setContacts(rows);
      } catch (error) {
        if (!stopped && !reported) {
          reported = true;
          toast({
            title: 'No se pudieron cargar las conversaciones',
            description: error instanceof Error ? error.message : 'Inténtalo de nuevo.',
            variant: 'destructive',
          });
        }
      }
    };
    void load();
    const timer = window.setInterval(load, 3000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [toast]);

  useEffect(() => {
    if (requested) setSelected(requested);
  }, [requested]);

  useEffect(() => {
    if (!selected) return;
    let stopped = false;
    let reported = false;
    const load = async () => {
      try {
        const result = await apiClient.get<{ messages: ChatLine[] }>(`/api/v1/messages?with=${selected}`);
        if (!stopped) setLines(result.messages);
      } catch (error) {
        if (!stopped && !reported) {
          reported = true;
          setLines([]);
          toast({
            title: 'No se pudo abrir el chat',
            description: error instanceof Error ? error.message : 'Inténtalo de nuevo.',
            variant: 'destructive',
          });
        }
      }
    };
    void load();
    const timer = window.setInterval(load, 3000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [selected, toast]);

  const contact = contacts.find((item) => item.id === selected);
  const needle = query.trim().normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const visible = needle
    ? contacts.filter((person) => person.displayName.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().includes(needle))
    : contacts;

  const sendText = async (body: string) => {
    if (!selected || !body.trim() || sending) return;
    setSending(true);
    try {
      const saved = await apiClient.post<ChatLine>('/api/v1/messages', { recipientId: selected, body: body.trim() });
      setLines((current) => [...current, saved]);
      setDraft('');
    } catch (error) {
      toast({
        title: 'No se pudo enviar',
        description: error instanceof Error ? error.message : 'Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold font-headline">Mensajes</h1>
        <p className="text-muted-foreground">Solo los ven quien escribe y quien recibe. Se borran solos a las 24 horas.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <div className="space-y-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre"
            aria-label="Buscar por nombre"
          />
          {contacts.length === 0 && <p className="text-sm text-muted-foreground">Todavía no tienes con quién escribir.</p>}
          {contacts.length > 0 && visible.length === 0 && <p className="text-sm text-muted-foreground">Nadie coincide con ese nombre.</p>}
          {visible.map((person) => {
            const hot = person.incoming > 0 || person.pending;
            return (
              <button
                key={person.id}
                type="button"
                onClick={() => setSelected(person.id)}
                className={`flex w-full items-center justify-between gap-2 rounded-2xl border px-3 py-3 text-left ${selected === person.id ? 'border-primary bg-secondary' : 'bg-card'} ${hot ? 'bg-accent font-semibold ring-2 ring-primary' : ''}`}
              >
                <span>
                  <span className="block">{person.displayName}</span>
                  <span className="block text-sm font-normal text-muted-foreground">
                    {person.incoming > 0 ? 'Mensaje nuevo' : person.pending ? 'Entregado, sin leer' : roleLabel[person.role]}
                  </span>
                </span>
                {person.incoming > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
                    {person.incoming}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <section className="flex min-h-[24rem] flex-col rounded-2xl border bg-card">
          {!contact && <p className="p-6 text-sm text-muted-foreground">Elige una persona para empezar.</p>}
          {contact && (
            <>
              <header className="border-b px-4 py-3">
                <p className="font-medium">{contact.displayName}</p>
                <p className="text-sm text-muted-foreground">{roleLabel[contact.role]}</p>
              </header>
              <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
                {lines.length === 0 && <p className="text-sm text-muted-foreground">No hay mensajes en las últimas 24 horas.</p>}
                {lines.map((line) => {
                  const link = bookingLink(line.body);
                  const text = link ? line.body.replace(`\n${link}`, '') : line.body;
                  return (
                  <p key={line.id} className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${line.mine && !line.read ? 'ml-auto bg-accent text-accent-foreground ring-2 ring-primary' : line.mine ? 'ml-auto bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                    {text}
                    {link && (
                      <Link href={link} className="mt-2 block rounded-full bg-background px-3 py-1 text-center text-xs font-medium text-foreground">
                        Tomar este turno
                      </Link>
                    )}
                    <span className={`mt-1 flex items-center justify-end gap-1 text-xs ${line.mine && line.read ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      {format(new Date(line.createdAt), 'h:mm a', { locale: es })}
                      {line.mine && (line.read ? <CheckCheck className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />)}
                      {line.mine && (line.read ? 'Leído' : 'Entregado')}
                    </span>
                  </p>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2 border-t px-3 pt-3">
                {phrases.map((phrase) => (
                  <Button key={phrase} type="button" variant="secondary" size="sm" disabled={sending} onClick={() => void sendText(phrase)}>
                    {phrase}
                  </Button>
                ))}
              </div>
              <form
                className="flex items-end gap-2 p-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  void sendText(draft);
                }}
              >
                <Textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Escribe un mensaje"
                  rows={2}
                  maxLength={500}
                  disabled={sending}
                />
                <Button type="submit" disabled={sending || draft.trim().length === 0} aria-label="Enviar">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando mensajes…</p>}>
      <Messages />
    </Suspense>
  );
}
