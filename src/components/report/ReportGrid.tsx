import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, Filter, Table2 } from "lucide-react";
import type {
  FilterPeriod,
  ParsedReport,
  ReportItem,
  ReportSummary,
} from "@/types/report";
import { formatValue, groupKeyFor } from "@/lib/reportParser";

const PERIODS: { key: FilterPeriod; label: string }[] = [
  { key: "global", label: "Global" },
  { key: "semaine", label: "Semaine" },
  { key: "mois", label: "Mois" },
  { key: "trimestre", label: "Trimestre" },
  { key: "semestre", label: "Semestre" },
  { key: "annee", label: "Année" },
];

interface Props {
  report: ParsedReport | null;
  summary: ReportSummary;
  period: FilterPeriod;
  onPeriodChange: (period: FilterPeriod) => void;
  groupFilter: string;
  onGroupFilterChange: (value: string) => void;
  onCellEdit: (rowId: string, key: string, value: string) => void;
  busy: boolean;
}

export function ReportGrid({
  report,
  summary,
  period,
  onPeriodChange,
  groupFilter,
  onGroupFilterChange,
  onCellEdit,
  busy,
}: Props) {
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const columns = report?.columns ?? [];
  const currency = report?.currency ?? "";

  const groups = useMemo(() => {
    if (!report || period === "global") return [];
    return Array.from(new Set(report.items.map((item) => groupKeyFor(item, period))));
  }, [report, period]);

  const rows = useMemo(() => {
    if (!report) return [] as ReportItem[];
    let list = report.items;

    if (period !== "global" && groupFilter !== "all") {
      list = list.filter((item) => groupKeyFor(item, period) === groupFilter);
    }

    for (const [key, term] of Object.entries(filters)) {
      if (!term) continue;
      const lower = term.toLowerCase();
      list = list.filter((item) => String(item[key] ?? "").toLowerCase().includes(lower));
    }

    if (sort) {
      list = [...list].sort((a, b) => {
        const av = a[sort.key];
        const bv = b[sort.key];
        const numeric = typeof av === "number" && typeof bv === "number";
        const cmp = numeric
          ? (av as number) - (bv as number)
          : String(av ?? "").localeCompare(String(bv ?? ""), "fr");
        return sort.dir === "asc" ? cmp : -cmp;
      });
    }
    return list;
  }, [report, period, groupFilter, filters, sort]);

  const columnTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const column of columns) {
      if (column.type !== "number" && column.type !== "currency") continue;
      totals[column.key] = rows.reduce(
        (sum, row) => sum + (Number(row[column.key]) || 0),
        0,
      );
    }
    return totals;
  }, [columns, rows]);

  const kpis = [
    { label: "Total Ventes", value: summary.totalVentes },
    { label: "Total Dépenses", value: summary.totalAchats + summary.totalDepenses },
    { label: "Solde Nette", value: summary.soldeNette },
  ];

  return (
    <section className="flex h-full min-h-[520px] flex-col overflow-hidden rounded-xl border border-border bg-background shadow-elevated">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gold/40 px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-royal">
            {report?.title ?? "Feuille Dynamique"}
          </h2>
          <p className="text-[0.68rem] uppercase tracking-[0.2em] text-muted-foreground">
            {rows.length} ligne{rows.length > 1 ? "s" : ""}
            {currency ? ` · ${currency}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {PERIODS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                onPeriodChange(item.key);
                onGroupFilterChange("all");
              }}
              className={`rounded-full border px-3 py-1.5 text-[0.68rem] font-medium transition-all ${
                period === item.key
                  ? "border-gold bg-accent text-gold-deep shadow-gold"
                  : "border-royal/20 text-royal hover:border-gold/60 hover:bg-accent"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {period !== "global" && groups.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">
          <span className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
            Regroupement
          </span>
          <select
            value={groupFilter}
            onChange={(event) => onGroupFilterChange(event.target.value)}
            className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-royal outline-none focus:border-gold"
          >
            <option value="all">Tous</option>
            {groups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="flex-1 overflow-auto">
        {!report || rows.length === 0 ? (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="rounded-full border border-gold/50 p-4 shadow-gold">
              <Table2 className="size-6 text-gold-deep" />
            </div>
            <p className="font-serif text-lg text-royal">
              {busy ? "Structuration des données en cours…" : "Aucune donnée à afficher"}
            </p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Saisissez vos enregistrements bruts dans le studio d&apos;entrée, puis
              générez le rapport pour alimenter cette grille.
            </p>
          </div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-background">
              <tr className="border-b-2 border-gold">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="border-r border-[var(--grid-line)] px-3 py-3 text-left align-top last:border-r-0"
                  >
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setSort((previous) =>
                            previous?.key === column.key
                              ? { key: column.key, dir: previous.dir === "asc" ? "desc" : "asc" }
                              : { key: column.key, dir: "asc" },
                          )
                        }
                        className="flex items-center gap-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-royal transition-colors hover:text-gold-deep"
                      >
                        {column.label}
                        {sort?.key === column.key ? (
                          sort.dir === "asc" ? (
                            <ArrowUp className="size-3" />
                          ) : (
                            <ArrowDown className="size-3" />
                          )
                        ) : (
                          <ChevronsUpDown className="size-3 opacity-40" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenFilter((prev) => (prev === column.key ? null : column.key))
                        }
                        className={`transition-colors ${filters[column.key] ? "text-gold-deep" : "text-royal/45 hover:text-gold-deep"}`}
                        aria-label={`Filtrer ${column.label}`}
                      >
                        <Filter className="size-3" />
                      </button>
                    </div>
                    {openFilter === column.key ? (
                      <input
                        autoFocus
                        value={filters[column.key] ?? ""}
                        onChange={(event) =>
                          setFilters((prev) => ({ ...prev, [column.key]: event.target.value }))
                        }
                        placeholder="Filtrer…"
                        className="mt-2 w-full rounded border border-input bg-background px-2 py-1 text-xs font-normal outline-none focus:border-gold"
                      />
                    ) : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[var(--grid-line)] transition-colors hover:bg-[var(--gold-tint)]"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="border-r border-[var(--grid-line)] px-1 py-0.5 last:border-r-0"
                    >
                      <input
                        value={String(row[column.key] ?? "")}
                        onChange={(event) =>
                          onCellEdit(row.id, column.key, event.target.value)
                        }
                        className={`numeric w-full rounded bg-transparent px-2 py-2 text-sm outline-none transition-all focus:bg-background focus:ring-2 focus:ring-gold/40 ${
                          column.type === "currency" || column.type === "number"
                            ? "text-right font-medium"
                            : ""
                        }`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t-2 border-gold bg-card">
                {columns.map((column, index) => (
                  <td
                    key={column.key}
                    className="numeric border-r border-[var(--grid-line)] px-3 py-3 text-sm font-semibold text-royal last:border-r-0"
                  >
                    {index === 0
                      ? "TOTAL GÉNÉRAL"
                      : columnTotals[column.key] !== undefined
                        ? formatValue(columnTotals[column.key], column.type, currency)
                        : ""}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        )}
      </div>

      <div className="grid gap-3 border-t border-border p-4 sm:grid-cols-3">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-lg border border-gold/45 bg-card px-4 py-3 shadow-gold"
          >
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-royal">
              {kpi.label}
            </p>
            <p className="numeric mt-1 text-lg font-semibold text-gold-deep">
              {kpi.value.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}{" "}
              <span className="text-xs text-muted-foreground">{currency}</span>
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
