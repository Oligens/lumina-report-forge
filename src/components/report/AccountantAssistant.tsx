import { useEffect, useRef, useState } from "react";
import { Loader2, Send, X, Mic, Square, FileDown, Calculator, BookOpen, Lightbulb, History } from "lucide-react";
import { ScarWriteLogo } from "@/components/ScarWriteLogo";
import type { AssistantMessage } from "@/types/report";

interface Props {
  open: boolean;
  onClose: () => void;
  messages: AssistantMessage[];
  onSend: (text: string) => void;
  loading: boolean;
  ready: boolean;
  onExport: () => void;
}

export function AccountantAssistant({
  open,
  onClose,
  messages,
  onSend,
  loading,
  ready,
  onExport,
}: Props) {
  const [draft, setDraft] = useState("");
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open, loading]);

  const submit = () => {
    if (!draft.trim() || loading) return;
    onSend(draft.trim());
    setDraft("");
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => chunks.push(event.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = String(reader.result).split(",")[1] ?? "";
          if (base64.length > 100) {
            // Handle transcription here if needed
          }
        };
        reader.readAsDataURL(new Blob(chunks, { type: mimeType }));
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

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-royal/20 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col rounded-l-2xl p-5 transition-transform duration-500 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          background: "linear-gradient(180deg, rgba(9, 19, 46, 0.98) 0%, rgba(15, 32, 72, 0.96) 100%)",
          backdropFilter: "blur(20px) saturate(180%)",
          borderLeft: "1px solid rgba(212, 175, 55, 0.3)",
        }}
      >
        {/* En-tête */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse rounded-full bg-gold/20 blur-lg" />
              <ScarWriteLogo className="relative size-12" />
            </div>
            <div>
              <h2 className="font-serif text-base font-semibold text-gold-deep">
                Assistant Expert-Comptable
              </h2>
              <p className="mt-0.5 text-[0.55rem] font-medium uppercase tracking-[0.18em] text-white/70">
                ScarWrite IA · Wizard normes comptables
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            aria-label="Fermer l'assistant" 
            className="text-white/60 hover:text-gold-deep"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Interface de Chat */}
        <div className="flex-1 space-y-3 overflow-auto rounded-xl border border-gold/25 bg-white/5 p-3">
          {messages.length === 0 ? (
            <div className="px-2 py-8 text-center">
              <div className="mx-auto mb-3 size-16 rounded-full bg-gradient-gold p-3 shadow-gold">
                <ScarWriteLogo watermark className="size-full" />
              </div>
              <p className="text-xs leading-relaxed text-white/70">
                Posez votre question comptable ou demandez la génération du bilan officiel.
                L'assistant vous guide pas à pas, en langage simple.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => onSend("Exemple de calcul d'amortissement linéaire ?")}
                  className="rounded-full border border-gold/30 bg-white/10 px-3 py-1.5 text-[0.6rem] text-gold-deep transition-all hover:bg-gold/20"
                >
                  Exemple de calcul ?
                </button>
                <button
                  type="button"
                  onClick={() => onSend("Qu'est-ce qu'un amortissement dégressif ?")}
                  className="rounded-full border border-gold/30 bg-white/10 px-3 py-1.5 text-[0.6rem] text-gold-deep transition-all hover:bg-gold/20"
                >
                  Définitions
                </button>
              </div>
            </div>
          ) : null}
          
          {messages.map((message, index) =>
            message.role === "assistant" ? (
              <div key={index} className="flex gap-2">
                <ScarWriteLogo className="mt-0.5 size-6 shrink-0" />
                <div className="max-w-[85%] rounded-xl border border-gold/25 bg-gradient-to-br from-royal/90 to-royal-soft/90 px-3 py-2 shadow-gold">
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-white">
                    {message.content}
                  </p>
                </div>
              </div>
            ) : (
              <div key={index} className="flex justify-end">
                <p className="max-w-[85%] whitespace-pre-wrap rounded-xl bg-gradient-gold px-3 py-2 text-xs leading-relaxed text-gold-foreground shadow-gold">
                  {message.content}
                </p>
              </div>
            ),
          )}
          
          {loading ? (
            <p className="animate-pulse text-xs font-medium text-gold-deep">
              L'expert-comptable réfléchit…
            </p>
          ) : null}
          <div ref={endRef} />
        </div>

        {/* Bouton Export PDF */}
        {ready ? (
          <button
            type="button"
            onClick={onExport}
            className="btn-royal-gold mt-3 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em]"
          >
            <FileDown className="size-4" /> Télécharger le Bilan & États Financiers PDF
          </button>
        ) : null}

        {/* Barre d'entrée */}
        <div className="mt-3 flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
            rows={2}
            placeholder="Posez votre question comptable..."
            className="flex-1 resize-none rounded-xl border border-gold/25 bg-white/10 px-3 py-2 text-xs text-white outline-none transition-all placeholder:text-white/40 focus:border-gold focus:ring-2 focus:ring-gold/25"
          />
          <button
            type="button"
            onClick={recording ? stopRecording : startRecording}
            aria-label="Dictée vocale"
            className={`rounded-xl p-2.5 transition-all ${
              recording 
                ? "bg-destructive/20 text-destructive" 
                : "border border-gold/30 bg-white/10 text-gold-deep hover:bg-gold/20"
            }`}
          >
            {recording ? <Square className="size-4" /> : <Mic className="size-4" />}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={loading || !draft.trim()}
            aria-label="Envoyer"
            className="rounded-xl bg-gradient-gold p-2.5 text-gold-foreground shadow-gold transition-all hover:brightness-110 disabled:opacity-40"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </button>
        </div>

        {/* Raccourcis bas de page */}
        <div className="mt-3 grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => onSend("Calculer un amortissement")}
            className="flex flex-col items-center gap-1 rounded-lg border border-gold/20 bg-white/5 p-2 text-[0.55rem] text-white/70 transition-all hover:border-gold/40 hover:bg-gold/10"
          >
            <Calculator className="size-4" />
            Calculateur
          </button>
          <button
            type="button"
            onClick={() => onSend("Définition comptable")}
            className="flex flex-col items-center gap-1 rounded-lg border border-gold/20 bg-white/5 p-2 text-[0.55rem] text-white/70 transition-all hover:border-gold/40 hover:bg-gold/10"
          >
            <BookOpen className="size-4" />
            Définitions
          </button>
          <button
            type="button"
            onClick={() => onSend("Conseil fiscal")}
            className="flex flex-col items-center gap-1 rounded-lg border border-gold/20 bg-white/5 p-2 text-[0.55rem] text-white/70 transition-all hover:border-gold/40 hover:bg-gold/10"
          >
            <Lightbulb className="size-4" />
            Conseils
          </button>
          <button
            type="button"
            onClick={() => onSend("Historique des questions")}
            className="flex flex-col items-center gap-1 rounded-lg border border-gold/20 bg-white/5 p-2 text-[0.55rem] text-white/70 transition-all hover:border-gold/40 hover:bg-gold/10"
          >
            <History className="size-4" />
            Historique
          </button>
        </div>
      </aside>
    </>
  );
}
