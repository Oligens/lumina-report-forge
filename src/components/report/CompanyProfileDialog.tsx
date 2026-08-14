import { useEffect, useState } from "react";
import { Building2, X, Upload } from "lucide-react";
import type {
  AccountingStandard,
  BusinessModel,
  CompanyProfile,
  CurrencyCode,
  LegalForm,
} from "@/types/report";
import { CURRENCIES } from "@/lib/currency";

const STANDARDS: AccountingStandard[] = [
  "SYSCOHADA",
  "IFRS",
  "US GAAP",
  "PCG",
  "Norme Nationale Locale",
];
const MODELS: BusinessModel[] = [
  "SaaS / Abonnement",
  "Commerce de détail / Restaurant",
  "Industrie / Manufacturing",
  "Prestataire de Services",
  "Société de Conseil",
  "Organisme à but non lucratif",
];
const FORMS: LegalForm[] = [
  "Société Anonyme (SA)",
  "SARL",
  "Entreprise Individuelle",
  "Société Civile",
  "Société par Actions Simplifiée (SAS)",
  "Comptabilité Publique",
];

export const emptyProfile = (): CompanyProfile => ({
  id: "company",
  nom: "",
  adresse: "",
  telephone: "",
  patente: "",
  nif: "",
  registre_commerce: "",
  devise_presentation: "USD",
  norme_comptable: "SYSCOHADA",
  type_activite: "Commerce de détail / Restaurant",
  forme_juridique: "SARL",
  capital_social: 0,
  tresorerie_initiale: 0,
  prelevements_dividendes: 0,
  inclure_n1: false,
  revenus_n1: 0,
  charges_n1: 0,
  actifs_n1: 0,
  passifs_n1: 0,
  updated_at: new Date().toISOString(),
});

interface Props {
  open: boolean;
  profile: CompanyProfile | null;
  onClose: () => void;
  onSave: (profile: CompanyProfile) => void;
}

const field =
  "w-full rounded-lg border border-royal/20 bg-white/70 px-3 py-2 text-sm text-foreground outline-none transition-all focus:border-gold focus:ring-2 focus:ring-gold/25";
const label =
  "mb-1 block text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground";

export function CompanyProfileDialog({ open, profile, onClose, onSave }: Props) {
  const [draft, setDraft] = useState<CompanyProfile>(profile ?? emptyProfile());

  useEffect(() => {
    if (open) setDraft(profile ?? emptyProfile());
  }, [open, profile]);

  if (!open) return null;

  const set = <K extends keyof CompanyProfile>(key: K, value: CompanyProfile[K]) =>
    setDraft((previous) => ({ ...previous, [key]: value }));

  const num = (value: string) => Number(value.replace(",", ".")) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-royal/25 p-4 backdrop-blur-sm">
      <div className="glass-strong my-6 w-full max-w-3xl rounded-2xl p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="glass-royal flex size-10 items-center justify-center rounded-xl">
              <Building2 className="size-5 text-gold" />
            </span>
            <div>
              <h2 className="font-serif text-xl font-semibold text-royal">
                Espace Dédié Entreprise
              </h2>
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-gold-deep">
                Premium · États financiers complets
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="text-royal/60 hover:text-royal">
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-6">
          <fieldset>
            <legend className="mb-3 font-serif text-sm font-semibold text-royal">
              A. Identité d'entreprise
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={label}>Nom officiel</label>
                <input className={field} value={draft.nom} onChange={(e) => set("nom", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Adresse physique complète</label>
                <input className={field} value={draft.adresse} onChange={(e) => set("adresse", e.target.value)} />
              </div>
              <div>
                <label className={label}>Téléphone</label>
                <input className={field} value={draft.telephone} onChange={(e) => set("telephone", e.target.value)} />
              </div>
              <div>
                <label className={label}>Numéro de patente</label>
                <input className={field} value={draft.patente} onChange={(e) => set("patente", e.target.value)} />
              </div>
              <div>
                <label className={label}>NIF</label>
                <input className={field} value={draft.nif} onChange={(e) => set("nif", e.target.value)} />
              </div>
              <div>
                <label className={label}>Registre du commerce</label>
                <input
                  className={field}
                  value={draft.registre_commerce}
                  onChange={(e) => set("registre_commerce", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Logo d'entreprise</label>
                <div className="flex items-center gap-3">
                  {draft.logo_data_url ? (
                    <img src={draft.logo_data_url} alt="Logo entreprise" className="size-12 rounded-lg object-contain" />
                  ) : null}
                  <label className="glass glow-gold inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-royal">
                    <Upload className="size-3.5" /> Importer une image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onloadend = () => set("logo_data_url", String(reader.result));
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                </div>
              </div>
              <div>
                <label className={label}>Devise de présentation</label>
                <select
                  className={field}
                  value={draft.devise_presentation}
                  onChange={(e) => set("devise_presentation", e.target.value as CurrencyCode)}
                >
                  {CURRENCIES.map((code) => (
                    <option key={code}>{code}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label}>Norme comptable applicable</label>
                <select
                  className={field}
                  value={draft.norme_comptable}
                  onChange={(e) => set("norme_comptable", e.target.value as AccountingStandard)}
                >
                  {STANDARDS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label}>Type d'activité</label>
                <select
                  className={field}
                  value={draft.type_activite}
                  onChange={(e) => set("type_activite", e.target.value as BusinessModel)}
                >
                  {MODELS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label}>Forme juridique</label>
                <select
                  className={field}
                  value={draft.forme_juridique}
                  onChange={(e) => set("forme_juridique", e.target.value as LegalForm)}
                >
                  {FORMS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 font-serif text-sm font-semibold text-royal">
              B. Capitaux propres & trésorerie initiale
            </legend>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className={label}>Capital social d'origine</label>
                <input className={field} inputMode="decimal" value={draft.capital_social}
                  onChange={(e) => set("capital_social", num(e.target.value))} />
              </div>
              <div>
                <label className={label}>Trésorerie début de période</label>
                <input className={field} inputMode="decimal" value={draft.tresorerie_initiale}
                  onChange={(e) => set("tresorerie_initiale", num(e.target.value))} />
              </div>
              <div>
                <label className={label}>Prélèvements / dividendes</label>
                <input className={field} inputMode="decimal" value={draft.prelevements_dividendes}
                  onChange={(e) => set("prelevements_dividendes", num(e.target.value))} />
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 font-serif text-sm font-semibold text-royal">
              C. Informations comparatives (N-1)
            </legend>
            <label className="mb-3 inline-flex items-center gap-2 text-xs font-medium text-royal">
              <input
                type="checkbox"
                checked={draft.inclure_n1}
                onChange={(e) => set("inclure_n1", e.target.checked)}
                className="size-4 accent-[#D4AF37]"
              />
              Inclure les chiffres de l'exercice précédent (N-1) pour comparaison
            </label>
            {draft.inclure_n1 ? (
              <div className="grid gap-3 sm:grid-cols-4">
                <div>
                  <label className={label}>Revenus N-1</label>
                  <input className={field} inputMode="decimal" value={draft.revenus_n1}
                    onChange={(e) => set("revenus_n1", num(e.target.value))} />
                </div>
                <div>
                  <label className={label}>Charges N-1</label>
                  <input className={field} inputMode="decimal" value={draft.charges_n1}
                    onChange={(e) => set("charges_n1", num(e.target.value))} />
                </div>
                <div>
                  <label className={label}>Total actifs N-1</label>
                  <input className={field} inputMode="decimal" value={draft.actifs_n1}
                    onChange={(e) => set("actifs_n1", num(e.target.value))} />
                </div>
                <div>
                  <label className={label}>Total passifs N-1</label>
                  <input className={field} inputMode="decimal" value={draft.passifs_n1}
                    onChange={(e) => set("passifs_n1", num(e.target.value))} />
                </div>
              </div>
            ) : null}
          </fieldset>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="glass glow-gold rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-royal">
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onSave({ ...draft, updated_at: new Date().toISOString() })}
            className="btn-royal-gold rounded-lg px-5 py-2 text-xs font-semibold uppercase tracking-[0.12em]"
          >
            Enregistrer le profil
          </button>
        </div>
      </div>
    </div>
  );
}
