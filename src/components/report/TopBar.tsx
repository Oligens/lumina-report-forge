import { FileSpreadsheet, FileText, FileDown, LogOut, Cloud, CloudOff } from "lucide-react";
import { ScarWriteLogo } from "@/components/ScarWriteLogo";
import type { CurrencyCode } from "@/types/report";
import { CURRENCIES } from "@/lib/currency";

interface Props {
  onExportExcel: () => void;
  onExportPDF: () => void;
  onExportCSV: () => void;
  disabled: boolean;
  currency: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode) => void;
  userEmail: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
  syncing: boolean;
}

export function TopBar({
  onExportExcel,
  onExportPDF,
  onExportCSV,
  disabled,
  currency,
  onCurrencyChange,
  userEmail,
  onSignIn,
  onSignOut,
  syncing,
}: Props) {
  const buttons = [
    { label: "Excel", icon: FileSpreadsheet, action: onExportExcel },
    { label: "PDF", icon: FileText, action: onExportPDF },
    { label: "CSV", icon: FileDown, action: onExportCSV },
  ];

  return (
    <header className="sticky top-0 z-30 px-4 pt-4 sm:px-6">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-4 rounded-xl border border-gold/40 bg-background/85 px-5 py-3.5 shadow-gold backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <ScarWriteLogo className="size-11 shrink-0" />
          <div>
            <h1 className="text-gradient-gold font-serif text-2xl font-semibold tracking-tight">
              ScarWrite Rapport
            </h1>
            <p className="mt-0.5 text-[0.65rem] font-medium uppercase tracking-[0.28em] text-royal">
              Precision Ledger Intelligence
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-royal/25 px-2.5 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-royal">
            {userEmail ? (
              syncing ? (
                <Cloud className="size-3.5 animate-pulse text-gold-deep" />
              ) : (
                <Cloud className="size-3.5 text-gold-deep" />
              )
            ) : (
              <CloudOff className="size-3.5" />
            )}
            {userEmail ? (syncing ? "Sync…" : "Cloud") : "Hors-ligne"}
          </span>

          <select
            value={currency}
            onChange={(event) => onCurrencyChange(event.target.value as CurrencyCode)}
            className="rounded-md border border-royal/30 bg-background px-2.5 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-royal outline-none transition-colors hover:border-gold focus:border-gold"
            aria-label="Devise d'affichage"
          >
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>

          {buttons.map(({ label, icon: Icon, action }) => (
            <button
              key={label}
              type="button"
              onClick={action}
              disabled={disabled}
              className="group inline-flex items-center gap-2 rounded-md border border-royal/40 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-gold-deep transition-all duration-200 hover:border-gold hover:bg-accent hover:shadow-gold disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon className="size-3.5 text-royal transition-colors group-hover:text-gold-deep" />
              {label}
            </button>
          ))}

          {userEmail ? (
            <button
              type="button"
              onClick={onSignOut}
              title={userEmail}
              className="inline-flex items-center gap-2 rounded-md border border-royal/40 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-royal transition-all hover:border-gold hover:bg-accent"
            >
              <LogOut className="size-3.5" />
              Sortir
            </button>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              className="bg-gradient-gold inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-gold-foreground shadow-gold transition-all hover:brightness-105"
            >
              Connexion Google
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
