import { Plus, Trash2, History, FolderOpen } from "lucide-react";
import type { FilterPeriod, ReportSession } from "@/types/report";
import { PERIOD_LABELS } from "@/lib/reportEngine";

interface Props {
  sessions: ReportSession[];
  activeId: string | null;
  counts: Record<string, number>;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  period: FilterPeriod;
  onPeriodChange: (period: FilterPeriod) => void;
}

export function SessionSidebar({
  sessions,
  activeId,
  counts,
  onSelect,
  onCreate,
  onDelete,
  period,
  onPeriodChange,
}: Props) {
  const STORAGE_USED = "1.24 GB";
  const STORAGE_TOTAL = "5 GB";

  return (
    <aside className="glass-strong flex h-full flex-col gap-4 rounded-2xl p-5 shadow-elevated">
      {/* Navigation temporelle */}
      <div>
        <p className="mb-3 text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Navigation Temporelle
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PERIOD_LABELS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => onPeriodChange(option.key)}
              className={`rounded-full border px-3 py-1.5 text-[0.62rem] font-medium transition-all ${
                period === option.key
                  ? "border-gold bg-gradient-gold text-gold-foreground shadow-gold"
                  : "border-royal/20 bg-white/40 text-royal hover:border-gold hover:bg-accent"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bouton CTA Central */}
      <button
        type="button"
        onClick={onCreate}
        className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-royal via-royal-soft to-royal px-4 py-4 text-left shadow-gold transition-all hover:brightness-110"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-all group-hover:via-white/20" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="font-serif text-sm font-semibold text-white">+ Nouveau Rapport / Bilan</p>
            <p className="mt-0.5 text-[0.6rem] uppercase tracking-[0.12em] text-gold-foreground/80">
              Créer une session vierge
            </p>
          </div>
          <Plus className="size-5 text-gold-deep" />
        </div>
      </button>

      {/* Liste des rapports */}
      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        <div className="mb-2 flex items-center gap-2">
          <FolderOpen className="size-4 text-royal" />
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-royal">
            Rapports Enregistrés (Locaux)
          </p>
        </div>

        {sessions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-royal/25 bg-white/30 p-4 text-xs text-muted-foreground">
            Aucun rapport enregistré. Vos données sont stockées localement et restent accessibles hors-ligne.
          </p>
        ) : null}

        {sessions.map((session) => {
          const active = session.id === activeId;
          return (
            <div
              key={session.id}
              className={`group cursor-pointer rounded-xl border px-4 py-3 transition-all ${
                active
                  ? "border-gold bg-gradient-gold/10 shadow-gold"
                  : "border-royal/15 bg-white/40 hover:border-gold hover:bg-accent/50"
              }`}
              onClick={() => onSelect(session.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-serif text-sm font-semibold text-royal">{session.title}</p>
                  <p className="mt-1 text-[0.6rem] uppercase tracking-[0.1em] text-muted-foreground">
                    {new Date(session.created_at).toLocaleDateString("fr-FR")} ·{" "}
                    {counts[session.id] ?? 0} écritures
                  </p>
                  {active && (
                    <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-green-500/40 bg-green-500/10 px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.1em] text-green-700">
                      <span className="size-1.5 rounded-full bg-green-500" />
                      ACTIF
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="Supprimer la session"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(session.id);
                  }}
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Trash2 className="size-4 text-destructive" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Niveau de stockage */}
      <div className="rounded-xl border border-royal/20 bg-white/40 px-4 py-3">
        <p className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Stockage Local
        </p>
        <div className="mt-2 flex items-center justify-between">
          <p className="font-serif text-sm font-semibold text-royal">
            {STORAGE_USED} / {STORAGE_TOTAL}
          </p>
          <div className="h-2 w-24 overflow-hidden rounded-full bg-royal/10">
            <div className="h-full w-[25%] rounded-full bg-gradient-gold" />
          </div>
        </div>
      </div>
    </aside>
  );
}
