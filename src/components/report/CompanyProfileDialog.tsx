/**
 * Gestionnaire de Profil d'Entreprise & Activation Dynamique des Modules Comptables
 * Composant pour configurer le modèle économique et activer les vues pertinentes
 */

import { useState } from "react";
import { Building2, ShoppingCart, Cloud, Factory, Landmark, Users, Heart, Check } from "lucide-react";
import type { BusinessModel, AccountingStandard, LegalForm, CurrencyCode } from "@/types/report";

interface CompanyProfileConfig {
  nom: string;
  type_activite: BusinessModel;
  forme_juridique: LegalForm;
  norme_comptable: AccountingStandard;
  devise_presentation: CurrencyCode;
  capital_social: number;
}

const BUSINESS_MODELS: { value: BusinessModel; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
  {
    value: "Commerce de détail / Restaurant",
    label: "Commerce / Retail",
    icon: ShoppingCart,
    description: "Ventes de marchandises, gestion de stocks CUMP/FIFO, proformas et reçus",
  },
  {
    value: "SaaS / Abonnement",
    label: "SaaS / Abonnement",
    icon: Cloud,
    description: "Revenus différés IFRS 15/ASC 606, MRR/ARR, facturation récurrente",
  },
  {
    value: "Industrie / Manufacturing",
    label: "Industrie / Production",
    icon: Factory,
    description: "Coûts de revient, stocks MP/PF, main-d'œuvre directe, frais d'atelier",
  },
  {
    value: "Comptabilité Publique",
    label: "Secteur Public",
    icon: Landmark,
    description: "IPSAS, séparation ordonnateur/comptable, exécution budgétaire",
  },
  {
    value: "Prestataire de Services",
    label: "Services / Conseil",
    icon: Building2,
    description: "Facturation de services, suivi de projets, comptabilité générale",
  },
  {
    value: "Société de Conseil",
    label: "Conseil / Expertise",
    icon: Users,
    description: "Honoraires, frais de mission, comptabilité d'exercice",
  },
  {
    value: "Organisme à but non lucratif",
    label: "Association / ONG",
    icon: Heart,
    description: "Subventions, dons, emplois par nature, tableau d'emplois",
  },
];

const LEGAL_FORMS: { value: LegalForm; label: string }[] = [
  { value: "SARL", label: "SARL" },
  { value: "Société Anonyme (SA)", label: "S.A." },
  { value: "Société par Actions Simplifiée (SAS)", label: "SAS" },
  { value: "Entreprise Individuelle", label: "Entreprise Individuelle" },
  { value: "Société Civile", label: "Société Civile" },
  { value: "Comptabilité Publique", label: "Entité Publique" },
];

const ACCOUNTING_STANDARDS: { value: AccountingStandard; label: string; region: string }[] = [
  { value: "SYSCOHADA", label: "SYSCOHADA", region: "Afrique de l'Ouest" },
  { value: "IFRS", label: "IFRS", region: "International" },
  { value: "US GAAP", label: "US GAAP", region: "États-Unis" },
  { value: "PCG", label: "PCG (Plan Comptable Général)", region: "France" },
  { value: "Norme Nationale Locale", label: "Norme Locale", region: "Local" },
];

const CURRENCIES: { value: CurrencyCode; label: string; symbol: string }[] = [
  { value: "USD", label: "Dollar US", symbol: "$" },
  { value: "EUR", label: "Euro", symbol: "€" },
  { value: "HTG", label: "Gourde Haïtienne", symbol: "G" },
];

interface Props {
  initialProfile?: Partial<CompanyProfileConfig>;
  onSave: (profile: CompanyProfileConfig) => void;
  onCancel: () => void;
}

export function CompanyProfileDialog({ initialProfile, onSave, onCancel }: Props) {
  const [nom, setNom] = useState(initialProfile?.nom ?? "");
  const [type_activite, setTypeActivite] = useState<BusinessModel>(
    initialProfile?.type_activite ?? "Prestataire de Services",
  );
  const [forme_juridique, setFormeJuridique] = useState<LegalForm>(
    initialProfile?.forme_juridique ?? "SARL",
  );
  const [norme_comptable, setNormeComptable] = useState<AccountingStandard>(
    initialProfile?.norme_comptable ?? "SYSCOHADA",
  );
  const [devise_presentation, setDevisePresentation] = useState<CurrencyCode>(
    initialProfile?.devise_presentation ?? "USD",
  );
  const [capital_social, setCapitalSocial] = useState(
    initialProfile?.capital_social ?? 0,
  );

  const handleSubmit = () => {
    onSave({
      nom,
      type_activite,
      forme_juridique,
      norme_comptable,
      devise_presentation,
      capital_social,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-royal/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-auto rounded-2xl glass-strong shadow-elevated">
        {/* Header */}
        <div className="sticky top-0 border-b border-gold/30 bg-gradient-to-r from-royal to-royal-soft px-6 py-4">
          <h2 className="font-serif text-xl font-semibold text-white">
            Configuration du Profil Entreprise
          </h2>
          <p className="mt-1 text-xs text-gold-foreground/80">
            Sélectionnez votre modèle économique pour activer automatiquement les modules comptables pertinents
          </p>
        </div>

        {/* Body */}
        <div className="space-y-6 p-6">
          {/* Nom de l'entreprise */}
          <div>
            <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.1em] text-royal">
              Nom de l'entreprise / entité
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Ma Société SARL, Ministère de..."
              className="w-full rounded-xl border border-royal/25 bg-white/70 px-4 py-3 text-sm outline-none transition-all focus:border-gold focus:ring-2 focus:ring-gold/20"
            />
          </div>

          {/* Modèle économique - Grille de sélection */}
          <div>
            <label className="mb-3 block text-sm font-semibold uppercase tracking-[0.1em] text-royal">
              Modèle Économique (Module Comptable Activé)
            </label>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {BUSINESS_MODELS.map((model) => {
                const Icon = model.icon;
                const selected = type_activite === model.value;
                return (
                  <button
                    key={model.value}
                    type="button"
                    onClick={() => setTypeActivite(model.value)}
                    className={`relative flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                      selected
                        ? "border-gold bg-gradient-gold/10 shadow-gold"
                        : "border-royal/20 bg-white/50 hover:border-gold hover:bg-accent/50"
                    }`}
                  >
                    {selected && (
                      <div className="absolute right-3 top-3 text-gold-deep">
                        <Check className="size-5" />
                      </div>
                    )}
                    <Icon className={`size-8 ${selected ? "text-gold-deep" : "text-royal"}`} />
                    <div>
                      <p className={`font-semibold ${selected ? "text-gold-deep" : "text-royal"}`}>
                        {model.label}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {model.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Forme juridique & Norme comptable */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.1em] text-royal">
                Forme Juridique
              </label>
              <select
                value={forme_juridique}
                onChange={(e) => setFormeJuridique(e.target.value as LegalForm)}
                className="w-full rounded-xl border border-royal/25 bg-white/70 px-4 py-3 text-sm outline-none transition-all focus:border-gold focus:ring-2 focus:ring-gold/20"
              >
                {LEGAL_FORMS.map((form) => (
                  <option key={form.value} value={form.value}>
                    {form.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.1em] text-royal">
                Norme Comptable
              </label>
              <select
                value={norme_comptable}
                onChange={(e) => setNormeComptable(e.target.value as AccountingStandard)}
                className="w-full rounded-xl border border-royal/25 bg-white/70 px-4 py-3 text-sm outline-none transition-all focus:border-gold focus:ring-2 focus:ring-gold/20"
              >
                {ACCOUNTING_STANDARDS.map((standard) => (
                  <option key={standard.value} value={standard.value}>
                    {standard.label} ({standard.region})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Devise & Capital */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.1em] text-royal">
                Devise de Présentation
              </label>
              <select
                value={devise_presentation}
                onChange={(e) => setDevisePresentation(e.target.value as CurrencyCode)}
                className="w-full rounded-xl border border-royal/25 bg-white/70 px-4 py-3 text-sm outline-none transition-all focus:border-gold focus:ring-2 focus:ring-gold/20"
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency.value} value={currency.value}>
                    {currency.symbol} {currency.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.1em] text-royal">
                Capital Social (optionnel)
              </label>
              <input
                type="number"
                value={capital_social}
                onChange={(e) => setCapitalSocial(Number(e.target.value))}
                placeholder="0"
                className="w-full rounded-xl border border-royal/25 bg-white/70 px-4 py-3 text-sm outline-none transition-all focus:border-gold focus:ring-2 focus:ring-gold/20"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Nécessaire pour calculer la réserve légale (sociétés commerciales)
              </p>
            </div>
          </div>

          {/* Résumé des modules activés */}
          <div className="rounded-xl border border-gold/30 bg-gradient-gold/5 p-4">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.1em] text-gold-deep">
              Modules Comptables Activés
            </p>
            <ul className="space-y-1 text-xs text-foreground">
              {type_activite === "Commerce de détail / Restaurant" && (
                <>
                  <li>• Proformas & Reçus de Vente</li>
                  <li>• Registre des Stocks (CUMP/FIFO)</li>
                  <li>• Journal des Ventes & COGS</li>
                  <li>• Sorties de Stock Automatiques</li>
                </>
              )}
              {type_activite === "SaaS / Abonnement" && (
                <>
                  <li>• Revenus Différés (IFRS 15 / ASC 606)</li>
                  <li>• Tableau de Reconnaissance MRR/ARR</li>
                  <li>• Facturation Récurrente</li>
                  <li>• Produits Constatés d'Avance</li>
                </>
              )}
              {type_activite === "Industrie / Manufacturing" && (
                <>
                  <li>• Calcul de Coût de Revient Unitaire</li>
                  <li>• Stocks Matières Premières & Produits Finis</li>
                  <li>• Main-d'Œuvre Directe (MOD)</li>
                  <li>• Frais Indirects d'Atelier</li>
                </>
              )}
              {type_activite === "Comptabilité Publique" && (
                <>
                  <li>• Exécution Budgétaire IPSAS</li>
                  <li>• Séparation Ordonnateur / Comptable</li>
                  <li>• Workflow: Engagement → Liquidation → Ordonnancement → Paiement</li>
                  <li>• Alertes de Dépassement de Crédit</li>
                </>
              )}
              {(type_activite === "Prestataire de Services" || type_activite === "Société de Conseil") && (
                <>
                  <li>• Facturation de Services / Honoraires</li>
                  <li>• Suivi de Projets & Missions</li>
                  <li>• Comptabilité Générale</li>
                </>
              )}
              {type_activite === "Organisme à but non lucratif" && (
                <>
                  <li>• Subventions & Dons</li>
                  <li>• Emplois par Nature</li>
                  <li>• Tableau d'Emplois</li>
                </>
              )}
              {(forme_juridique === "SARL" || forme_juridique === "Société Anonyme (SA)" || forme_juridique === "Société par Actions Simplifiée (SAS)") && (
                <>
                  <li>• Affectation des Bénéfices</li>
                  <li>• Réserve Légale (5% jusqu'à 10% du capital)</li>
                  <li>• Dividendes & Dettes Associés</li>
                  <li>• Comptes Courants d'Associés</li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 border-t border-gold/30 bg-white/80 px-6 py-4 backdrop-blur-sm">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-royal/30 bg-white/50 px-6 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-royal transition-all hover:border-gold hover:bg-accent"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!nom.trim()}
              className="btn-royal-gold rounded-xl px-6 py-3 text-sm font-semibold uppercase tracking-[0.1em] disabled:opacity-40"
            >
              Enregistrer & Activer les Modules
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook utilitaire pour obtenir les modules activés selon le profil
 */
export function useActiveModules(profile: { type_activite: BusinessModel; forme_juridique: LegalForm }) {
  const modules: string[] = [];

  switch (profile.type_activite) {
    case "Commerce de détail / Restaurant":
      modules.push("proforma", "receipts", "inventory_cump_fifo", "sales_journal");
      break;
    case "SaaS / Abonnement":
      modules.push("deferred_revenue", "mrr_arr", "recurring_billing");
      break;
    case "Industrie / Manufacturing":
      modules.push("production_cost", "raw_materials", "finished_goods", "direct_labor");
      break;
    case "Comptabilité Publique":
      modules.push("budget_execution", "ipsas", "commitment_workflow", "credit_alerts");
      break;
    case "Prestataire de Services":
    case "Société de Conseil":
      modules.push("services_billing", "project_tracking");
      break;
    case "Organisme à but non lucratif":
      modules.push("grants", "donations", "nature_expenses");
      break;
  }

  if (["SARL", "Société Anonyme (SA)", "Société par Actions Simplifiée (SAS)"].includes(profile.forme_juridique)) {
    modules.push("profit_allocation", "legal_reserve", "dividends", "partner_accounts");
  }

  return modules;
}
