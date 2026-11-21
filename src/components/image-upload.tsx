'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { cloudinaryConfig, uploadImage, type ImageKind } from '@/lib/upload-image';

export function ImageUpload({
  id,
  value,
  onChange,
  kind,
  disabled,
  onBusy,
}: {
  id: string;
  value: string;
  onChange: (url: string) => void;
  kind: ImageKind;
  disabled?: boolean;
  onBusy?: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const ready = cloudinaryConfig() !== null;

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    onBusy?.(true);
    setError('');
    try {
      onChange(await uploadImage(file, kind));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo subir la foto.');
    } finally {
      setBusy(false);
      onBusy?.(false);
    }
  };

  return (
    <div className="space-y-2">
      {value ? <img src={value} alt="Vista previa de la foto" className="h-16 w-16 rounded-md border object-cover" /> : null}
      <Input
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={disabled || busy || !ready}
        onChange={(event) => {
          void pick(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
      {busy ? <p className="text-xs text-muted-foreground">Subiendo foto…</p> : null}
      {!ready ? <p className="text-xs text-muted-foreground">Falta el nombre de la nube y el preset de Cloudinary en el entorno.</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
