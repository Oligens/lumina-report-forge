import { FileSpreadsheet, FileText, FileDown } from "lucide-react";

interface Props {
  onExportExcel: () => void;
  onExportPDF: () => void;
  onExportCSV: () => void;
  disabled: boolean;
}

export function AppHeader({ onExportExcel, onExportPDF, onExportCSV, disabled }: Props) {
  const buttons = [
    { label: "Excel", icon: FileSpreadsheet, action: onExportExcel },
    { label: "PDF", icon: FileText, action: onExportPDF },
    { label: "CSV", icon: FileDown, action: onExportCSV },
  ];

  return (
    <header className="sticky top-0 z-30 px-4 pt-4 sm:px-6">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 rounded-xl border border-gold/40 bg-background/85 px-5 py-4 shadow-gold backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-gradient-gold text-2xl font-semibold tracking-tight sm:text-[1.7rem]">
            LUMINA
          </h1>
          <p className="mt-0.5 text-[0.7rem] font-medium uppercase tracking-[0.28em] text-royal">
            AI Precision Report Suite
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {buttons.map(({ label, icon: Icon, action }) => (
            <button
              key={label}
              type="button"
              onClick={action}
              disabled={disabled}
              className="group inline-flex items-center gap-2 rounded-md border border-royal/40 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-gold-deep transition-all duration-200 hover:border-gold hover:bg-accent hover:shadow-gold disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon className="size-3.5 text-royal transition-colors group-hover:text-gold-deep" />
              Export {label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
