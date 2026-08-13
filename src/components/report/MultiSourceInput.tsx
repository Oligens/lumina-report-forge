import { useRef, useState } from "react";
import { Loader2, Sparkles, Mic, Square, ScanLine, Keyboard } from "lucide-react";
import type { MachineState, SourceType } from "@/types/report";

const TEMPLATES = [
  { label: "Rapport des Ventes", text: "Ventes du jour : " },
  { label: "Journal de Dépenses", text: "Dépenses enregistrées : " },
  { label: "Flux d'Achat", text: "Achats fournisseurs : " },
];

const STATE_LABEL: Record<MachineState, string> = {
  idle: "En attente",
  processing: "Traitement IA…",
  parsing: "Normalisation…",
  ready: "Ajouté au registre",
  error: "Erreur",
};

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmitText: () => void;
  onSubmitReceipt: (dataUrl: string) => void;
  onTranscribe: (base64: string, format: string) => void;
  state: MachineState;
  error: string | null;
  sourceType: SourceType;
}

export function MultiSourceInput({
  value,
  onChange,
  onSubmitText,
  onSubmitReceipt,
  onTranscribe,
  state,
  error,
  sourceType,
}: Props) {
  const busy = state === "processing" || state === "parsing";
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => chunks.push(event.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunks, { type: mimeType });
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = String(reader.result);
          const base64 = result.split(",")[1] ?? "";
          if (base64.length > 100) {
            onTranscribe(base64, mimeType === "audio/webm" ? "webm" : "m4a");
          }
        };
        reader.readAsDataURL(blob);
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch {
      setRecording(false);
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => onSubmitReceipt(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <section className="flex h-full flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-elevated">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-serif text-lg font-semibold text-royal">Studio Multi-Sources</h2>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-royal/25 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-royal">
          <span
            className={`size-1.5 rounded-full ${
              busy
                ? "animate-pulse bg-gold"
                : state === "error"
                  ? "bg-destructive"
                  : "bg-royal"
            }`}
          />
          {STATE_LABEL[state]}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="flex items-center justify-center gap-1.5 rounded-lg border border-gold/40 bg-accent px-2 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-gold-deep">
          <Keyboard className="size-3.5" /> Texte
        </div>
        <button
          type="button"
          onClick={recording ? stopRecording : startRecording}
          disabled={busy}
          className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.1em] transition-all disabled:opacity-40 ${
            recording
              ? "border-destructive bg-destructive/10 text-destructive"
              : "border-royal/30 text-royal hover:border-gold hover:text-gold-deep"
          }`}
        >
          {recording ? <Square className="size-3.5" /> : <Mic className="size-3.5" />}
          {recording ? "Arrêter" : "Vocal"}
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-royal/30 px-2 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-royal transition-all hover:border-gold hover:text-gold-deep disabled:opacity-40"
        >
          <ScanLine className="size-3.5" /> Reçu OCR
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            handleFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={`Dictez, scannez ou collez vos données brutes…\n\nEx : ventes, achats, dépenses, factures, notes de caisse. Le moteur IA déduit les colonnes, les dates, les devises et les montants — puis les ajoute au registre en cours.`}
        className="min-h-[220px] flex-1 resize-none rounded-lg border border-input bg-background p-4 text-sm leading-relaxed text-foreground outline-none transition-all placeholder:text-muted-foreground/70 focus:border-gold focus:ring-2 focus:ring-gold/25"
      />

      <div className="flex flex-wrap gap-2">
        {TEMPLATES.map((template) => (
          <button
            key={template.label}
            type="button"
            onClick={() => onChange(value ? value : template.text)}
            className="rounded-full border border-royal/25 bg-background px-3 py-1.5 text-[0.7rem] font-medium text-royal transition-all hover:border-gold hover:bg-accent hover:text-gold-deep"
          >
            {template.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onSubmitText}
        disabled={busy || !value.trim()}
        className="bg-gradient-gold inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-gold-foreground shadow-gold transition-all duration-200 hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        Ajouter au registre ({sourceType === "OCR_RECEIPT" ? "OCR" : sourceType === "VOICE_NOTE" ? "Vocal" : "Texte"})
      </button>
    </section>
  );
}
