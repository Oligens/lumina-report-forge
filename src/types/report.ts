export type FilterPeriod =
  | "semaine"
  | "mois"
  | "trimestre"
  | "semestre"
  | "annee"
  | "global";

export type CurrencyCode = "USD" | "EUR" | "HTG";
export type SourceType = "TEXT" | "VOICE_NOTE" | "OCR_RECEIPT";
export type AnomalyBadge = "NORMAL" | "HIGH_EXPENDITURE" | "DUPLICATE_RISK";

export interface ReportItem {
  id: string;
  report_id: string;
  user_id?: string;
  date_complete: string;
  jour: number;
  mois: string;
  annee: number;
  semaine_numero: number;
  trimestre: "Q1" | "Q2" | "Q3" | "Q4";
  semestre: "S1" | "S2";
  type: string;
  categorie: string;
  description: string;
  quantite: number;
  prix_unitaire: number;
  montant_total: number;
  currency_original: CurrencyCode;
  exchange_rate: number;
  montant_converted_usd: number;
  anomaly_badge: AnomalyBadge;
  anomaly_explanation?: string;
  source_type: SourceType;
  created_at: string;
  synced?: boolean;
}

export interface ReportSession {
  id: string;
  user_id?: string;
  title: string;
  period_group: FilterPeriod;
  currency_reference: CurrencyCode;
  executive_summary?: string;
  created_at: string;
  synced?: boolean;
}

export interface ReportSummary {
  totalVentes: number;
  totalDepenses: number;
  soldeNet: number;
}

export type MachineState = "idle" | "processing" | "parsing" | "ready" | "error";

export type AccountingStandard =
  | "SYSCOHADA"
  | "IFRS"
  | "US_GAAP"
  | "DGI_LOCAL"
  | "US GAAP"
  | "PCG"
  | "Norme Nationale Locale";

export type BusinessModel =
  | "COMMERCIAL"
  | "INDUSTRY"
  | "SAAS"
  | "PUBLIC"
  | "MOBILE_MONEY"
  | "Commerce de détail / Restaurant"
  | "SaaS / Abonnement"
  | "Industrie / Manufacturing"
  | "Comptabilité Publique"
  | "Prestataire de Services"
  | "Société de Conseil"
  | "Organisme à but non lucratif";

export type LegalForm =
  | "Société Anonyme (SA)"
  | "SARL"
  | "Entreprise Individuelle"
  | "Société Civile"
  | "Société par Actions Simplifiée (SAS)"
  | "Comptabilité Publique";

export interface CompanyProfile {
  id: string;
  nom: string;
  adresse: string;
  telephone: string;
  patente: string;
  nif: string;
  registre_commerce: string;
  logo_data_url?: string;
  devise_presentation: CurrencyCode;
  norme_comptable: AccountingStandard;
  type_activite: BusinessModel;
  forme_juridique: LegalForm;
  capital_social: number;
  tresorerie_initiale: number;
  prelevements_dividendes: number;
  inclure_n1: boolean;
  revenus_n1: number;
  charges_n1: number;
  actifs_n1: number;
  passifs_n1: number;
  // Modules comptables avancés
  stock_valuation_method?: "CUMP" | "FIFO";
  budget_available_credit?: number; // Pour entités publiques
  updated_at: string;
}

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export interface FinancialStatements {
  complete: boolean;
  question?: string;
  bilan?: {
    actifs_immobilises: { libelle: string; montant: number }[];
    actifs_circulants: { libelle: string; montant: number }[];
    passifs: { libelle: string; montant: number }[];
    capitaux_propres: { libelle: string; montant: number }[];
  };
  resultat?: {
    produits: { libelle: string; montant: number }[];
    charges: { libelle: string; montant: number }[];
    resultat_exploitation: number;
    resultat_financier: number;
    resultat_net: number;
  };
  tresorerie?: {
    exploitation: { libelle: string; montant: number }[];
    investissement: { libelle: string; montant: number }[];
    financement: { libelle: string; montant: number }[];
  };
  capitaux?: { libelle: string; montant: number }[];
  notes?: string[];
  comparatif?: { libelle: string; n: number; n1: number }[];
}

// RBAC - Gestion des Accès Multi-Utilisateurs
export type UserRole = "SUPER_ADMIN" | "COMPTABLE_SAISIEUR" | "LECTURE_SEULE";

export interface UserPermission {
  canWriteTransactions: boolean;
  canModifyCompanySettings: boolean;
  canViewReports: boolean;
  canGenerateTokens: boolean;
  canInviteUsers: boolean;
  canExportData: boolean;
  canAccessStudio: boolean;
  canUseVoiceDictation: boolean;
  canUseOCR: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, UserPermission> = {
  SUPER_ADMIN: {
    canWriteTransactions: true,
    canModifyCompanySettings: true,
    canViewReports: true,
    canGenerateTokens: true,
    canInviteUsers: true,
    canExportData: true,
    canAccessStudio: true,
    canUseVoiceDictation: true,
    canUseOCR: true,
  },
  COMPTABLE_SAISIEUR: {
    canWriteTransactions: true,
    canModifyCompanySettings: false,
    canViewReports: true,
    canGenerateTokens: false,
    canInviteUsers: false,
    canExportData: true,
    canAccessStudio: true,
    canUseVoiceDictation: true,
    canUseOCR: true,
  },
  LECTURE_SEULE: {
    canWriteTransactions: false,
    canModifyCompanySettings: false,
    canViewReports: true,
    canGenerateTokens: false,
    canInviteUsers: false,
    canExportData: false,
    canAccessStudio: false,
    canUseVoiceDictation: false,
    canUseOCR: false,
  },
};

export interface InvitationToken {
  id: string;
  token: string; // Format: SCAR-TOKEN-XXXX-ROLE
  companyId: string;
  roleName: UserRole;
  createdBy: string; // userId du SUPER_ADMIN
  createdAt: string;
  expiresAt?: string;
  maxUses?: number;
  currentUses: number;
  isActive: boolean;
}

export interface CompanyMember {
  id: string;
  userId: string;
  companyId: string;
  email: string;
  displayName: string;
  role: UserRole;
  joinedAt: string;
  avatarUrl?: string;
  lastActiveAt?: string;
}

// Journal Comptable - Écritures comptables
export interface JournalEntry {
  id: string;
  date: string;
  libelle: string;
  compteDebit: string;
  compteCredit: string;
  montant: number;
  currency: CurrencyCode;
  normeComptable: AccountingStandard;
  modeleEntreprise: BusinessModel;
  statut: 'EN_ATTENTE' | 'VALIDE' | 'BLOQUE';
  createdBy: string;
  createdAt: string;
}
