import { useMemo, useState } from "react";
import { AlertTriangle, Copy, Loader2, Sparkles, Trash2 } from "lucide-react";
import type {
  CurrencyCode,
  FilterPeriod,
  ReportItem,
  ReportSession,
} from "@/types/report";
import { computeSummary, groupKeyFor } from "@/lib/reportEngine";
import { convert, formatMoney } from "@/lib/currency";

interface Props {
  session: ReportSession | null;
  items: ReportItem[];
  period: FilterPeriod;
  displayCurrency: CurrencyCode;
  rates: Record<CurrencyCode, number>;
  onCellEdit: (rowId: string, key: keyof ReportItem, value: string) => void;
  onDeleteRow: (rowId: string) => void;
  onGenerateNarrative: () => void;
  narrativeLoading: boolean;
  busy: boolean;
}

const COLUMNS: { key: keyof ReportItem; label: string; numeric?: boolean }[] = [
  { key: "date_complete", label: "Date" },
  { key: "type", label: "Type" },
  { key: "categorie", label: "Catégorie" },
  { key: "description", label: "Description" },
  { key: "quantite", label: "Qté", numeric: true },
  { key: "prix_unitaire", label: "P.U.", numeric: true },
  { key: "montant_total", label: "Montant", numeric: true },
];

export function LedgerPanel({
  session,
  items,
  period,
  displayCurrency,
  rates,
  onCellEdit,
  onDeleteRow,
  onGenerateNarrative,
  narrativeLoading,
  busy,
}: Props) {
  const [groupFilter, setGroupFilter] = useState("all");

  const groups = useMemo(() => {
    const set = new Set(items.map((item) => groupKeyFor(item, period)));
    return Array.from(set);
  }, [items, period]);

  const visible = useMemo(
    () =>
      groupFilter === "all"
        ? items
        : items.filter((item) => groupKeyFor(item, period) === groupFilter),
    [items, period, groupFilter],
  );

  const summary = computeSummary(visible);
  const anomalies = visible.filter((item) => item.anomaly_badge !== "NORMAL");

  const money = (usd: number) => formatMoney(convert(usd, displayCurrency, rates), displayCurrency);

  return (
    <section className="flex h-full min-h-[600px] flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-elevated">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg font-semibold text-royal">
            {session?.title ?? "Registre"}
          </h2>
          <p className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
            {visible.length} écritures cumulées · vue {period}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={groupFilter}
            onChange={(event) => setGroupFilter(event.target.value)}
            className="rounded-md border border-royal/30 bg-background px-2.5 py-1.5 text-xs text-royal outline-none focus:border-gold"
          >
            <option value="all">Toutes les périodes</option>
            {groups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onGenerateNarrative}
            disabled={!visible.length || narrativeLoading}
            className="inline-flex items-center gap-1.5 rounded-md border border-gold/50 px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-gold-deep transition-all hover:bg-accent disabled:opacity-40"
          >
            {narrativeLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            Synthèse Exécutive
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Total Ventes", value: summary.totalVentes, tone: "text-royal" },
          { label: "Total Dépenses", value: summary.totalDepenses, tone: "text-destructive" },
          { label: "Solde Net Cumulé", value: summary.soldeNet, tone: "text-gold-deep" },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-gold/30 bg-background px-4 py-3 shadow-gold"
          >
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {card.label}
            </p>
            <p className={`mt-1 font-serif text-lg font-semibold ${card.tone}`}>
              {money(card.value)}
            </p>
          </div>
        ))}
      </div>

      {session?.executive_summary ? (
        <div className="rounded-lg border border-gold/40 bg-accent/60 px-4 py-3">
          <p className="mb-1 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-gold-deep">
            Synthèse décisionnelle IA
          </p>
          <p className="text-xs leading-relaxed text-foreground">{session.executive_summary}</p>
        </div>
      ) : null}

      {anomalies.length ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2.5">
          <p className="inline-flex items-center gap-2 text-xs font-semibold text-destructive">
            <AlertTriangle className="size-3.5" />
            {anomalies.length} écriture(s) signalée(s) par l'audit IA
          </p>
        </div>
      ) : null}

      <div className="relative flex-1 overflow-auto rounded-lg border border-border">
        {busy ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <Loader2 className="size-6 animate-spin text-gold-deep" />
          </div>
        ) : null}
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 z-[1] bg-royal text-primary-foreground">
            <tr>
              {COLUMNS.map((column) => (
                <th
                  key={String(column.key)}
                  className="whitespace-nowrap px-3 py-2.5 font-semibold uppercase tracking-[0.08em]"
                >
                  {column.label}
                </th>
              ))}
              <th className="px-3 py-2.5 font-semibold uppercase tracking-[0.08em]">Audit</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td
                  colSpan={COLUMNS.length + 2}
                  className="px-4 py-14 text-center text-muted-foreground"
                >
                  Aucune écriture. Ajoutez des données via texte, vocal ou reçu scanné.
                </td>
              </tr>
            ) : null}
            {visible.map((item) => (
              <tr
                key={item.id}
                className={`border-t border-border transition-colors hover:bg-accent/50 ${
                  item.anomaly_badge !== "NORMAL" ? "bg-destructive/5" : ""
                }`}
              >
                {COLUMNS.map((column) => (
                  <td key={String(column.key)} className="px-1 py-1">
                    <input
                      value={String(item[column.key] ?? "")}
                      onChange={(event) =>
                        onCellEdit(item.id, column.key, event.target.value)
                      }
                      className={`w-full rounded border border-transparent bg-transparent px-2 py-1.5 outline-none transition-all focus:border-gold focus:bg-background ${
                        column.numeric ? "text-right tabular-nums" : ""
                      }`}
                    />
                  </td>
                ))}
                <td className="whitespace-nowrap px-3 py-1.5">
                  {item.anomaly_badge === "NORMAL" ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <span
                      title={item.anomaly_explanation}
                      className="inline-flex items-center gap-1 rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-destructive"
                    >
                      {item.anomaly_badge === "DUPLICATE_RISK" ? (
                        <Copy className="size-3" />
                      ) : (
                        <AlertTriangle className="size-3" />
                      )}
                      {item.anomaly_badge === "DUPLICATE_RISK" ? "Doublon" : "Risque élevé"}
                    </span>
                  )}
                </td>
                <td className="px-2 py-1.5">
                  <button
                    type="button"
                    aria-label="Supprimer l'écriture"
                    onClick={() => onDeleteRow(item.id)}
                    className="text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          {visible.length ? (
            <tfoot className="sticky bottom-0 bg-background">
              <tr className="border-t-2 border-gold">
                <td colSpan={6} className="px-3 py-2.5 font-semibold uppercase text-royal">
                  Total consolidé ({displayCurrency})
                </td>
                <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-gold-deep">
                  {money(
                    visible.reduce((sum, i) => sum + (Number(i.montant_converted_usd) || 0), 0),
                  )}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
    </section>
  );
}
