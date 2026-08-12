import { Loader2, Sparkles } from "lucide-react";
import type { MachineState } from "@/types/report";

const TEMPLATES = [
  { label: "Rapport des Ventes", text: "Ventes du jour : " },
  { label: "Journal de Dépenses", text: "Dépenses enregistrées : " },
  { label: "Flux d'Achat", text: "Achats fournisseurs : " },
];

interface Props {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  state: MachineState;
  error: string | null;
}

const STATE_LABEL: Record<MachineState, string> = {
  idle: "En attente",
  processing: "Traitement du prompt…",
  parsing: "Analyse du JSON…",
  ready: "Rapport prêt",
  error: "Erreur",
};

export function InputStudio({ value, onChange, onGenerate, state, error }: Props) {
  const busy = state === "processing" || state === "parsing";

  return (
    <section className="flex h-full flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-elevated">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-royal">Prompt &amp; Source Data</h2>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-royal/25 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-royal">
          <span
            className={`size-1.5 rounded-full ${busy ? "animate-pulse bg-gold" : state === "error" ? "bg-destructive" : "bg-royal"}`}
          />
          {STATE_LABEL[state]}
        </span>
      </div>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={`Collez ici vos données brutes non structurées…\n\nEx : ventes, achats, dépenses, mouvements d'inventaire, factures, notes de caisse. Le moteur IA déduit automatiquement les colonnes, les dates et les montants.`}
        className="min-h-[280px] flex-1 resize-none rounded-lg border border-input bg-background p-4 text-sm leading-relaxed text-foreground outline-none transition-all placeholder:text-muted-foreground/70 focus:border-gold focus:ring-2 focus:ring-gold/25"
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
        onClick={onGenerate}
        disabled={busy || !value.trim()}
        className="bg-gradient-gold inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-gold-foreground shadow-gold transition-all duration-200 hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Sparkles className="size-4" />
        )}
        Générer le Rapport
      </button>
    </section>
  );
}
