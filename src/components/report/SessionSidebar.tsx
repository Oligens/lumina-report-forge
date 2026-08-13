import { Plus, Trash2, History } from "lucide-react";
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
  return (
    <aside className="flex h-full flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-elevated">
      <div className="flex items-center justify-between gap-2">
        <h2 className="inline-flex items-center gap-2 font-serif text-base font-semibold text-royal">
          <History className="size-4 text-gold-deep" />
          Historique des sessions
        </h2>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-1 rounded-md border border-gold/50 px-2 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-gold-deep transition-all hover:bg-accent"
        >
          <Plus className="size-3" />
          Nouveau
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {sessions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-royal/25 p-4 text-xs text-muted-foreground">
            Aucune session enregistrée. Vos rapports sont stockés localement et restent
            accessibles hors-ligne.
          </p>
        ) : null}

        {sessions.map((session) => {
          const active = session.id === activeId;
          return (
            <div
              key={session.id}
              className={`group cursor-pointer rounded-lg border px-3 py-2.5 transition-all ${
                active
                  ? "border-gold bg-accent shadow-gold"
                  : "border-border bg-background hover:border-royal/40"
              }`}
              onClick={() => onSelect(session.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-royal">{session.title}</p>
                  <p className="mt-0.5 text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">
                    {new Date(session.created_at).toLocaleDateString("fr-FR")} ·{" "}
                    {counts[session.id] ?? 0} écritures
                  </p>
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
                  <Trash2 className="size-3.5 text-destructive" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <p className="mb-2 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Navigation temporelle
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PERIOD_LABELS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => onPeriodChange(option.key)}
              className={`rounded-full border px-2.5 py-1 text-[0.65rem] font-medium transition-all ${
                period === option.key
                  ? "border-gold bg-gradient-gold text-gold-foreground"
                  : "border-royal/25 bg-background text-royal hover:border-gold"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
