import { FileText, LogOut, ShieldCheck, User, Globe2 } from "lucide-react";
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
  assistantOpen: boolean;
  onToggleAssistant: () => void;
  onOpenWorldEconomy: () => void;
}

export function TopBar({ onExportPDF, disabled, currency, onCurrencyChange, userEmail, onSignIn, onSignOut, syncing, assistantOpen, onToggleAssistant, onOpenWorldEconomy }: Props) {
  const currencyFlags: Record<CurrencyCode, string> = { USD: "🇺🇸", EUR: "🇪🇺", HTG: "🇭🇹" };
  return <header className="sticky top-0 z-30 px-4 pt-4 sm:px-6"><div className="mx-auto flex max-w-[1920px] items-center justify-between gap-4 rounded-2xl border border-gold/30 bg-white/75 px-5 py-3 shadow-gold backdrop-blur-xl">
    <div className="flex items-center gap-3"><ScarWriteLogo className="size-12 shrink-0" /><div><h1 className="text-gradient-gold font-serif text-xl font-semibold tracking-tight">ScarWrite Rapport</h1><p className="mt-0.5 text-[0.55rem] font-medium uppercase tracking-[0.25em] text-royal">AI Precision Ledger & World Economy Suite</p></div></div>
    <div className="flex items-center gap-2"><span className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-green-700"><ShieldCheck className="size-3.5 text-green-600" />{userEmail ? (syncing ? "Cloud Sync…" : "Cloud Synced") : "Offline-First Active"}</span>
      <select value={currency} onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)} className="rounded-lg border border-royal/25 bg-white/50 px-3 py-2 text-xs font-semibold uppercase text-royal" aria-label="Devise d'affichage">{CURRENCIES.map((code) => <option key={code} value={code}>{code} {currencyFlags[code]}</option>)}</select>
      <button type="button" onClick={onOpenWorldEconomy} className="inline-flex items-center gap-2 rounded-lg border border-gold bg-gradient-gold px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-gold-foreground shadow-gold"><Globe2 className="size-4" /> Économie mondiale</button>
      <button type="button" onClick={onToggleAssistant} className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.1em] ${assistantOpen ? "border-gold bg-gradient-gold text-gold-foreground shadow-gold" : "border-royal/30 bg-white/50 text-royal"}`}><User className="size-3.5" /> Assistant IA</button>
      {userEmail ? <button type="button" onClick={onSignOut} title={userEmail} className="inline-flex items-center gap-2 rounded-lg border border-royal/30 bg-white/50 px-3.5 py-2 text-xs font-semibold uppercase text-royal"><LogOut className="size-3.5" /> Sortir</button> : <button type="button" onClick={onSignIn} className="bg-gradient-gold inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold uppercase text-gold-foreground shadow-gold">Connexion Google</button>}
      <button type="button" onClick={onExportPDF} disabled={disabled} className="inline-flex items-center gap-2 rounded-lg border border-gold/40 bg-gradient-to-r from-royal to-royal-soft px-4 py-2.5 text-xs font-semibold uppercase text-white shadow-gold disabled:opacity-40"><FileText className="size-3.5" /> Bilan PDF Luxury</button>
    </div>
  </div></header>;
}
