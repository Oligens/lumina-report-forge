import { useEffect, useRef, useState } from "react";
import { Loader2, Send, X, Mic, Square, FileDown } from "lucide-react";
import { ScarWriteLogo } from "@/components/ScarWriteLogo";
import type { AssistantMessage } from "@/types/report";

interface Props {
  open: boolean;
  onClose: () => void;
  messages: AssistantMessage[];
  onSend: (text: string) => void;
  onTranscribe?: (base64: string, format: string) => void;
  loading: boolean;
  ready: boolean;
  onExport: () => void;
}

export function AccountantAssistant({
  open,
  onClose,
  messages,
  onSend,
  onTranscribe,
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
    if (!onTranscribe) return;
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
          if (base64.length > 100) onTranscribe(base64, mimeType === "audio/webm" ? "webm" : "m4a");
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
        className={`glass-strong fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col rounded-l-2xl p-5 transition-transform duration-500 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <ScarWriteLogo className="size-10" />
            <div>
              <h2 className="font-serif text-base font-semibold text-royal">
                Assistant Expert-Comptable
              </h2>
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-gold-deep">
                ScarWrite · Wizard normes comptables
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer l'assistant" className="text-royal/60 hover:text-royal">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-auto rounded-xl border border-gold/25 bg-white/40 p-3">
          {messages.length === 0 ? (
            <p className="px-2 py-8 text-center text-xs leading-relaxed text-muted-foreground">
              Posez votre question comptable ou demandez la génération du bilan officiel.
              L'assistant vous guide pas à pas, en langage simple.
            </p>
          ) : null}
          {messages.map((message, index) =>
            message.role === "assistant" ? (
              <div key={index} className="flex gap-2">
                <ScarWriteLogo className="mt-0.5 size-6 shrink-0" />
                <p className="whitespace-pre-wrap text-xs leading-relaxed text-foreground">
                  {message.content}
                </p>
              </div>
            ) : (
              <div key={index} className="flex justify-end">
                <p className="max-w-[85%] whitespace-pre-wrap rounded-xl bg-primary px-3 py-2 text-xs leading-relaxed text-primary-foreground">
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

        {ready ? (
          <button
            type="button"
            onClick={onExport}
            className="btn-royal-gold mt-3 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em]"
          >
            <FileDown className="size-4" /> Télécharger le Bilan & États Financiers PDF
          </button>
        ) : null}

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
            placeholder="Ex : c'est quoi un amortissement ?"
            className="flex-1 resize-none rounded-xl border border-royal/20 bg-white/70 px-3 py-2 text-xs outline-none transition-all focus:border-gold focus:ring-2 focus:ring-gold/25"
          />
          {onTranscribe ? (
            <button
              type="button"
              onClick={recording ? stopRecording : startRecording}
              aria-label="Dictée vocale"
              className={`glass glow-gold rounded-xl p-2.5 ${recording ? "text-destructive" : "text-royal"}`}
            >
              {recording ? <Square className="size-4" /> : <Mic className="size-4" />}
            </button>
          ) : null}
          <button
            type="button"
            onClick={submit}
            disabled={loading || !draft.trim()}
            aria-label="Envoyer"
            className="btn-royal-gold rounded-xl p-2.5 disabled:opacity-40"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </button>
        </div>
      </aside>
    </>
  );
}
