import { useRef, useState } from "react";
import { Loader2, Sparkles, Mic, Square, ScanLine, Keyboard, CheckCircle, Lock } from "lucide-react";
import type { MachineState, SourceType } from "@/types/report";
import { useRBAC } from "@/hooks/useRBAC";

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
  const { canAccessStudio, canUseVoiceDictation, canUseOCR, roleDisplayName } = useRBAC();
  const busy = state === "processing" || state === "parsing";
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Si l'utilisateur n'a pas accès au studio (LECTURE_SEULE), afficher un message bloquant
  if (!canAccessStudio) {
    return (
      <section className="glass-strong flex h-full flex-col gap-4 rounded-2xl p-5 shadow-elevated">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-lg font-semibold text-royal">Studio Multi-Sources</h2>
          <span className="inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-destructive">
            <Lock className="size-3" />
            Accès Restreint
          </span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <Lock className="size-8 text-destructive" />
          </div>
          <div>
            <h3 className="mb-2 font-serif text-lg font-semibold text-destructive">
              🔒 Mode Lecture Seule
            </h3>
            <p className="text-sm text-muted-foreground">
              Saisie bloquée par l'administrateur
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Rôle actuel : <span className="font-semibold text-royal">{roleDisplayName}</span>
            </p>
          </div>
          <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
            Votre niveau d'accès ne vous permet pas d'ajouter des transactions via le Studio IA.
            Contactez un administrateur pour obtenir les permissions nécessaires.
          </p>
        </div>
      </section>
    );
  }

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
    <section className="glass-strong flex h-full flex-col gap-4 rounded-2xl p-5 shadow-elevated">
      {/* Onglets supérieurs */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-serif text-lg font-semibold text-royal">Studio Multi-Sources</h2>
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.14em] ${
          busy
            ? "border-gold/30 bg-gold/10 text-gold-deep"
            : state === "error"
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-royal/25 bg-white/40 text-royal"
        }`}>
          <span
            className={`size-2 rounded-full ${
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

      {/* Onglets */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex items-center justify-center gap-2 rounded-xl border border-gold/40 bg-gradient-gold/10 px-3 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-gold-deep shadow-gold">
          <Keyboard className="size-4" /> Texte Libre
        </div>
        <button
          type="button"
          onClick={recording ? stopRecording : startRecording}
          disabled={busy || !canUseVoiceDictation}
          className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.1em] transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
            recording
              ? "border-destructive bg-destructive/10 text-destructive"
              : canUseVoiceDictation
                ? "border-royal/25 bg-white/40 text-royal hover:border-gold hover:bg-accent"
                : "border-muted/25 bg-muted/10 text-muted cursor-not-allowed"
          }`}
        >
          {recording ? <Square className="size-4" /> : <Mic className="size-4" />}
          {recording ? "Arrêter" : "Dictée Vocale IA"}
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy || !canUseOCR}
          className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.1em] transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
            canUseOCR
              ? "border-royal/25 bg-white/40 text-royal hover:border-gold hover:bg-accent"
              : "border-muted/25 bg-muted/10 text-muted cursor-not-allowed"
          }`}
        >
          <ScanLine className="size-4" /> Scan Reçu / OCR
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

      {/* Zone de saisie */}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={`Dictez, scannez ou collez vos données brutes…

Ex : ventes, achats, dépenses, factures, notes de caisse. Le moteur IA déduit les colonnes, les dates, les devises et les montants — puis les ajoute au registre en cours.`}
        className="min-h-[180px] flex-1 resize-none rounded-xl border border-royal/20 bg-white/50 p-4 text-sm leading-relaxed text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-gold focus:bg-white/70 focus:ring-2 focus:ring-gold/20 disabled:cursor-not-allowed disabled:bg-muted/10 disabled:text-muted"
        disabled={!canAccessStudio}
      />

      {/* Analyse IA en temps réel */}
      {state === "ready" && (
        <div className="rounded-xl border border-gold/30 bg-gradient-gold/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle className="size-4 text-green-600" />
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-gold-deep">
              Analyse IA en Temps Réel
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-[0.55rem] uppercase tracking-[0.12em] text-muted-foreground">Type d'opération</p>
              <p className="font-medium text-royal">Vente / Achat</p>
            </div>
            <div>
              <p className="text-[0.55rem] uppercase tracking-[0.12em] text-muted-foreground">Compte Débit</p>
              <p className="font-medium text-royal">512 - Banque</p>
            </div>
            <div>
              <p className="text-[0.55rem] uppercase tracking-[0.12em] text-muted-foreground">Compte Crédit</p>
              <p className="font-medium text-royal">701 - Ventes</p>
            </div>
            <div>
              <p className="text-[0.55rem] uppercase tracking-[0.12em] text-muted-foreground">Montant</p>
              <p className="font-medium text-royal">Auto-détecté</p>
            </div>
          </div>
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-[0.55rem] uppercase tracking-[0.12em] text-muted-foreground">Confiance IA</p>
              <p className="text-[0.6rem] font-semibold text-gold-deep">98%</p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-royal/10">
              <div className="h-full w-[98%] rounded-full bg-gradient-gold" />
            </div>
          </div>
        </div>
      )}

      {/* Boutons templates */}
      <div className="flex flex-wrap gap-2">
        {TEMPLATES.map((template) => (
          <button
            key={template.label}
            type="button"
            onClick={() => onChange(value ? value : template.text)}
            disabled={!canAccessStudio}
            className="rounded-full border border-royal/20 bg-white/40 px-3 py-1.5 text-[0.65rem] font-medium text-royal transition-all hover:border-gold hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {template.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onSubmitText}
        disabled={busy || !value.trim() || !canAccessStudio}
        className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-royal via-royal-soft to-royal px-5 py-3.5 text-left shadow-gold transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-all group-hover:via-white/20" />
        <div className="relative flex items-center justify-center gap-2">
          {busy ? <Loader2 className="size-4 animate-spin text-gold-deep" /> : <Sparkles className="size-4 text-gold-deep" />}
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-white">
            Injecter au Journal Courant - Validation & Intégration Automatique
          </span>
        </div>
      </button>

      {/* Pied de colonne - Sources récentes */}
      <div className="rounded-xl border border-royal/20 bg-white/40 px-4 py-3">
        <p className="mb-2 text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Sources Récentes
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-lg border border-royal/15 bg-white/50 px-3 py-2">
            <Mic className="size-3.5 text-royal" />
            <div className="flex-1">
              <p className="truncate text-[0.6rem] font-medium text-royal">Note vocale #1</p>
              <p className="text-[0.5rem] text-muted-foreground">Il y a 2 min</p>
            </div>
            <CheckCircle className="size-3.5 text-green-600" />
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-royal/15 bg-white/50 px-3 py-2">
            <ScanLine className="size-3.5 text-royal" />
            <div className="flex-1">
              <p className="truncate text-[0.6rem] font-medium text-royal">Reçu OCR #3</p>
              <p className="text-[0.5rem] text-muted-foreground">Il y a 15 min</p>
            </div>
            <CheckCircle className="size-3.5 text-green-600" />
          </div>
        </div>
      </div>
    </section>
  );
}
