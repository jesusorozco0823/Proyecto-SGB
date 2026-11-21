"use client";

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Copy, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';

function secretFromOtpauth(url: string) {
  const query = url.split('?')[1] ?? '';
  return new URLSearchParams(query).get('secret') ?? '';
}

function groupedSecret(secret: string) {
  return secret.replace(/(.{4})/g, '$1 ').trim();
}

export function TotpSetup({ otpauthUrl }: { otpauthUrl: string }) {
  const [manual, setManual] = useState(false);
  const [copied, setCopied] = useState(false);
  const secret = secretFromOtpauth(otpauthUrl);

  const copySecret = async () => {
    if (!secret) return;
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="mx-auto w-fit rounded-2xl bg-white p-4">
        <QRCodeSVG
          value={otpauthUrl}
          size={196}
          level="M"
          bgColor="#ffffff"
          fgColor="#1c1917"
          title="Código QR para activar el segundo factor"
        />
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Ábrelo con Google Authenticator, Authy o Microsoft Authenticator y escanea el código.
      </p>
      <Button type="button" variant="outline" className="w-full" onClick={() => setManual((open) => !open)}>
        <KeyRound className="mr-2 h-4 w-4" />
        {manual ? 'Ocultar clave manual' : 'No puedo escanearlo'}
      </Button>
      {manual && (
        <div className="space-y-3 rounded-2xl border bg-secondary/60 p-4">
          <p className="text-sm text-muted-foreground">
            En la app elige ingreso manual. El emisor es SGB Barberías y la clave es esta.
          </p>
          <p className="break-all text-center font-mono text-sm tracking-widest">{groupedSecret(secret)}</p>
          <Button type="button" variant="secondary" className="w-full" onClick={copySecret}>
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied ? 'Clave copiada' : 'Copiar clave'}
          </Button>
        </div>
      )}
    </div>
  );
}
