/**
 * Moteur IA Comptable Universel - Headless Accounting System
 * Système automatisé piloté par langage naturel pour ScarWrite Rapport
 */

import type { CurrencyCode, BusinessModel, LegalForm, AccountingStandard } from "@/types/report";

// ============================================================================
// TYPES ET INTERFACES DU MOTEUR COMPTABLE
// ============================================================================

export interface AccountMapping {
  debitAccount: string;
  debitLabel: string;
  creditAccount: string;
  creditLabel: string;
}

export interface StockMovement {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  totalValue: number;
  movementType: "IN" | "OUT";
  valuationMethod: "CUMP" | "FIFO";
}

export interface SubscriptionRevenue {
  subscriptionId: string;
  customerName: string;
  totalAmount: number;
  startDate: string;
  endDate: string;
  monthlyRecognition: number;
  deferredRevenue: number;
  recognizedRevenue: number;
}

export interface ProductionCost {
  productId: string;
  productName: string;
  rawMaterials: number;
  directLabor: number;
  overhead: number;
  totalCost: number;
  unitsProduced: number;
  unitCost: number;
}

export interface BudgetCommitment {
  commitmentId: string;
  budgetLine: string;
  amount: number;
  stage: "ENGAGEMENT" | "LIQUIDATION" | "ORDONNANCEMENT" | "PAIEMENT";
  availableCredit: number;
  isBlocked: boolean;
  blockReason?: string;
}

export interface ProfitAllocation {
  netIncome: number;
  legalReserve: number;
  distributableProfit: number;
  dividendsPayable: number;
  retainedEarnings: number;
  partnerCurrentAccounts: { partner: string; amount: number }[];
}

export interface ProformaDocument {
  proformaId: string;
  customerId: string;
  customerName: string;
  items: { description: string; quantity: number; unitPrice: number; total: number }[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  validityDate: string;
  status: "DRAFT" | "SENT" | "ACCEPTED" | "CONVERTED" | "EXPIRED";
}

export interface ReceiptDocument {
  receiptId: string;
  saleId: string;
  customerId: string;
  customerName: string;
  items: { description: string; quantity: number; unitPrice: number; total: number }[];
  paymentMethod: string;
  totalAmount: number;
  issuedAt: string;
}

export interface AnalyzedTransaction {
  // Données brutes extraites
  rawDescription: string;
  detectedAmount: number;
  detectedCurrency: CurrencyCode;
  detectedDate: string;
  
  // Analyse contextuelle
  businessModelDetected: BusinessModel;
  transactionCategory: 
    | "SALE" 
    | "PURCHASE" 
    | "EXPENSE" 
    | "SUBSCRIPTION" 
    | "PRODUCTION" 
    | "PAYROLL" 
    | "TAX" 
    | "TRANSFER"
    | "DIVIDEND"
    | "BUDGET_COMMITMENT";
  
  // Mapping comptable automatique
  accountMapping: AccountMapping;
  
  // Modules spécifiques activés
  stockMovement?: StockMovement;
  subscriptionRevenue?: SubscriptionRevenue;
  productionCost?: ProductionCost;
  budgetCommitment?: BudgetCommitment;
  profitAllocation?: ProfitAllocation;
  proformaDocument?: ProformaDocument;
  receiptDocument?: ReceiptDocument;
  
  // Métadonnées IA
  confidenceScore: number;
  requiresValidation: boolean;
  validationReasons: string[];
  suggestedNarrative: string;
}

// ============================================================================
// PROMPTS SPÉCIALISÉS PAR MODULE
// ============================================================================

const BASE_ACCOUNTING_PROMPT = `Tu es le moteur IA comptable universel ScarWrite, un expert-comptable automatisé qui transforme le langage naturel en écritures comptables structurées.

RÈGLES FONDAMENTALES :
1. Identifie automatiquement le modèle économique (Commercial, SaaS, Industrie, Public/IPSAS, Société à Associés)
2. Génère les écritures comptables complètes avec comptes Débit/Crédit appropriés
3. Applique les normes comptables selon le profil (SYSCOHADA, IFRS, US GAAP, PCG, IPSAS)
4. Ne jamais inventer de chiffres - extraire uniquement ce qui est explicitement stated ou clairement impliqué
5. Retourne UNIQUEMENT du JSON valide sans texte conversationnel

Schéma de réponse JSON attendu :
{
  "transactions": [{
    "rawDescription": "string",
    "detectedAmount": number,
    "detectedCurrency": "USD|EUR|HTG",
    "detectedDate": "YYYY-MM-DD",
    "businessModelDetected": "Commerce de détail / Restaurant|SaaS / Abonnement|Industrie / Manufacturing|Prestataire de Services|Société de Conseil|Organisme à but non lucratif",
    "transactionCategory": "SALE|PURCHASE|EXPENSE|SUBSCRIPTION|PRODUCTION|PAYROLL|TAX|TRANSFER|DIVIDEND|BUDGET_COMMITMENT",
    "accountMapping": {
      "debitAccount": "string",
      "debitLabel": "string",
      "creditAccount": "string", 
      "creditLabel": "string"
    },
    "confidenceScore": number (0-100),
    "requiresValidation": boolean,
    "validationReasons": ["string"],
    "suggestedNarrative": "string"
  }]
}`;

const COMMERCIAL_MODULE_PROMPT = `
MODULE COMMERCIAL ACTIVÉ - Règles spécifiques :

1. PROFORMA : Quand l'utilisateur dit "Génère un proforma" ou similaire :
   - Créer un document proforma avec items, sous-total, taxes, total
   - AUCUN impact comptable immédiat (document commercial préliminaire)
   - Statut initial : "DRAFT" ou "SENT"

2. CONVERSION PROFORMA → VENTE/REÇU :
   - Débiter : Compte Client (411) ou Banque/Caisse (512/53) selon paiement
   - Créditer : Compte Ventes de marchandises (701) ou Produits de services (706)
   - Générer SORTIE DE STOCK automatique
   - Créer Reçu de Vente officiel

3. VALORISATION DES STOCKS :
   - CUMP (Coût Unitaire Moyen Pondéré) : (Valeur Stock Initial + Valeur Achats) / (Qté Stock Initial + Qté Achetée)
   - FIFO (First In First Out) : Premier entré, premier sorti
   - Sortie de stock : Débiter COGS (603), Créditer Stock de marchandises (311)

Exemples de plans comptables commerciaux :
- 311 : Stock de marchandises
- 411 : Clients
- 4457 : TVA collectée
- 512 : Banque
- 53 : Caisse
- 603 : Variation de stocks
- 701 : Ventes de marchandises`;

const SAAS_MODULE_PROMPT = `
MODULE SAAS & ABONNEMENTS ACTIVÉ (IFRS 15 / ASC 606) - Règles spécifiques :

1. ABONNEMENT PAYÉ D'AVANCE (annuel, trimestriel, etc.) :
   - À la souscription : Débiter Banque (512), Créditer "Produits Constatés d'Avance" (487/Passif)
   - Reconnaissance mensuelle : Débiter "Produits Constatés d'Avance", Créditer "Chiffre d'Affaires - Abonnements" (706)
   - Montant mensuel = Total / Nombre de mois

2. MÉTRIQUES SaaS :
   - MRR (Monthly Recurring Revenue) : Revenu récurrent mensuel
   - ARR (Annual Recurring Revenue) : MRR × 12
   - Churn Rate : Taux de résiliation
   - LTV : Lifetime Value client

3. TABLEAU DE RECONNAISSANCE :
   - Générer un échéancier de reconnaissance sur la durée du contrat
   - Suivre le solde de produits différés restant

Exemples de plans comptables SaaS :
- 487 : Produits constatés d'avance (Passif circulant)
- 706 : Prestations de services / Abonnements
- 512 : Banque`;

const INDUSTRIE_MODULE_PROMPT = `
MODULE INDUSTRIE & PRODUCTION ACTIVÉ - Règles spécifiques :

1. CALCUL DU COÛT DE REVIENT UNITAIRE :
   Coût de Revient = Matières Premières + Main-d'Œuvre Directe + Charges Indirectes d'Atelier
   
2. MOUVEMENTS DE STOCK INDUSTRIE :
   - Achat matières premières : Débiter "Achats de MP" (601), Créditer Fournisseur (401) ou Banque (512)
   - Consommation MP : Débiter "Production - MP consommées" (711 variation), Créditer "Stock de MP" (311)
   - Main-d'œuvre : Débiter "Production - MOD" (641), Créditer "Salaires à payer" (421)
   - Frais indirects : Débiter "Frais atelier" (61/62), Créditer Fournisseur/Banque
   - Entrée produits finis : Débiter "Stock de PF" (35), Créditer "Production transférée" (71)

3. SORTIE DE STOCK PRODUITS FINIS (vente) :
   - Débiter COGS (6037), Créditer Stock de Produits Finis (35)

Exemples de plans comptables industrie :
- 31 : Stocks de matières premières
- 35 : Stocks de produits finis
- 401 : Fournisseurs
- 421 : Personnel - Rémunérations dues
- 601 : Achats stockés - Matières premières
- 603 : Variation de stocks
- 641 : Rémunérations du personnel
- 71 : Production stockée (ou déstockage)`;

const PUBLIC_MODULE_PROMPT = `
MODULE COMPTABILITÉ PUBLIQUE & NORMES IPSAS ACTIVÉ - Règles spécifiques :

1. SÉPARATION ORDONNATEUR / COMPTABLE :
   Workflow obligatoire à 4 étapes :
   a) ENGAGEMENT : Réservation de crédit budgétaire
      - Vérifier disponibilité des crédits
      - Si insuffisant → BLOQUER avec alerte "Dépassement de Crédit Budgétaire"
   
   b) LIQUIDATION : Vérification du service fait et calcul du montant exact
   
   c) ORDONNANCEMENT / MANDAT : Ordre de payer émis par l'ordonnateur
   
   d) PAIEMENT : Exécution par le comptable public (décaissement effectif)

2. SUIVI BUDGÉTAIRE IPSAS :
   - Mettre à jour simultanément :
     * Bilan Patrimonial (Engagement - approche accrual)
     * Exécution du Budget Voté (Encaissement/Décaissement - approche cash)
   
3. ALERTES DE CONTRÔLE :
   - "Dépassement de Crédit Budgétaire" : Bloquer si crédits < engagement
   - "Service Non Fait" : Bloquer liquidation si preuve insuffisante
   - "Mandat Irrégulier" : Vérifier conformité juridique

Exemples de comptes publics :
- Classe 1 : Comptes de dotations et fonds
- Classe 2 : Immobilisations
- Classe 3 : Stocks
- Classe 4 : Tiers (fournisseurs, clients)
- Classe 5 : Comptes financiers
- Comptes budgétaires : Engagement, Liquidation, Ordonnancement, Paiement`;

const ASSOCIES_MODULE_PROMPT = `
MODULE HAUT DE BILAN & ASSOCIÉS ACTIVÉ - Règles spécifiques :

1. AFFECTATION DES BÉNÉFICES :
   Bénéfice Distribuable = Résultat Net 
                          - Réserve Légale (5% jusqu'à 10% du capital social)
                          + Report à Nouveau (solde antérieur)
   
2. RÉSERVE LÉGALE :
   - Obligatoire pour sociétés commerciales (SA, SARL, SAS)
   - 5% du bénéfice net jusqu'à atteindre 10% du capital social
   - Compte 1061 : Réserve légale

3. DIVIDENDES :
   - Décision en Assemblée Générale
   - Comptabilisation : Débiter "Dividendes à payer" (457), Créditer "Associés - Créances" (456)
   - Paiement : Débiter 457, Créditer Banque (512)

4. COMPTES COURANTS D'ASSOCIÉS :
   - Apports en compte courant : Créditer 455 "Associés - Comptes courants"
   - Remboursements : Débiter 455, Créditer Banque
   - Intérêts sur comptes courants : Charges financières (661) / Produits financiers (761)

Exemples de comptes associés :
- 101 : Capital social
- 1061 : Réserve légale
- 11 : Report à nouveau
- 455 : Associés - Comptes courants
- 456 : Associés - Créances
- 457 : Associés - Dividendes à payer
- 661 : Charges d'intérêts
- 761 : Produits d'intérêts`;

// ============================================================================
// FONCTIONS UTILITAIRES DU MOTEUR
// ============================================================================

/**
 * Construit le prompt complet selon le modèle économique détecté
 */
export function buildAccountingPrompt(
  userInput: string,
  businessModel: BusinessModel,
  accountingStandard: AccountingStandard,
  currency: CurrencyCode,
): string {
  let modulePrompt = "";
  
  switch (businessModel) {
    case "Commerce de détail / Restaurant":
      modulePrompt = COMMERCIAL_MODULE_PROMPT;
      break;
    case "SaaS / Abonnement":
      modulePrompt = SAAS_MODULE_PROMPT;
      break;
    case "Industrie / Manufacturing":
      modulePrompt = INDUSTRIE_MODULE_PROMPT;
      break;
    case "Organisme à but non lucratif":
      // Utilise prompts spécifiques selon besoins
      modulePrompt = BASE_ACCOUNTING_PROMPT;
      break;
    default:
      modulePrompt = BASE_ACCOUNTING_PROMPT;
  }
  
  // Ajout contexte norme comptable
  let standardContext = "";
  switch (accountingStandard) {
    case "IFRS":
      standardContext = "\n\nNORME APPLICABLE : IFRS (International Financial Reporting Standards)\n- Privilégier la juste valeur\n- Reconnaissance du revenu selon IFRS 15\n- Information sectorielle IFRS 8";
      break;
    case "US GAAP":
      standardContext = "\n\nNORME APPLICABLE : US GAAP (Generally Accepted Accounting Principles)\n- ASC 606 pour reconnaissance du revenu\n- Principe du coût historique\n- Rules-based approach";
      break;
    case "SYSCOHADA":
      standardContext = "\n\nNORME APPLICABLE : SYSCOHADA (Système Comptable Ouest Africain)\n- Plan comptable OHADA\n- Principe de prudence\n- Image fidèle du patrimoine";
      break;
    case "PCG":
      standardContext = "\n\nNORME APPLICABLE : PCG (Plan Comptable Général Français)\n- ANC (Autorité des Normes Comptables)\n- Principes comptables fondamentaux\n- Comptabilité d'engagement";
      break;
  }
  
  return `${BASE_ACCOUNTING_PROMPT}${modulePrompt}${standardContext}

DEVISE DE RÉFÉRENCE : ${currency}

ENTRÉE UTILISATEUR : "${userInput}"

Analyse cette saisie et retourne les transactions comptables structurées en JSON.`;
}

/**
 * Nettoie et valide la réponse JSON de l'IA
 */
export function parseAccountingResponse(content: string): AnalyzedTransaction[] {
  const cleaned = content
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  
  try {
    const parsed = JSON.parse(cleaned);
    return parsed.transactions || [];
  } catch (error) {
    console.error("Erreur parsing réponse IA comptable:", error);
    throw new Error("Réponse du moteur comptable illisible. Reformulez votre saisie.");
  }
}

/**
 * Calcule le CUMP (Coût Unitaire Moyen Pondéré)
 */
export function calculateCUMP(
  initialStockValue: number,
  initialStockQuantity: number,
  purchaseValue: number,
  purchaseQuantity: number,
): number {
  const totalQuantity = initialStockQuantity + purchaseQuantity;
  if (totalQuantity === 0) return 0;
  
  const totalValue = initialStockValue + purchaseValue;
  return totalValue / totalQuantity;
}

/**
 * Calcule la valorisation FIFO pour une sortie de stock
 */
export function calculateFIFOOut(
  batches: { quantity: number; unitCost: number; date: string }[],
  outQuantity: number,
): { totalCost: number; remainingBatches: typeof batches } {
  let remaining = outQuantity;
  let totalCost = 0;
  const remainingBatches = batches.map(b => ({ ...b }));
  
  for (let i = 0; i < remainingBatches.length && remaining > 0; i++) {
    const batch = remainingBatches[i];
    const taken = Math.min(remaining, batch.quantity);
    totalCost += taken * batch.unitCost;
    batch.quantity -= taken;
    remaining -= taken;
  }
  
  return {
    totalCost,
    remainingBatches: remainingBatches.filter(b => b.quantity > 0),
  };
}

/**
 * Calcule l'affectation du bénéfice selon règles légales
 */
export function calculateProfitAllocation(
  netIncome: number,
  shareCapital: number,
  existingLegalReserve: number,
  retainedEarningsPrior: number,
): ProfitAllocation {
  // Réserve légale : 5% du bénéfice net jusqu'à 10% du capital
  const maxLegalReserve = shareCapital * 0.10;
  const legalReserveContribution = Math.min(
    netIncome * 0.05,
    maxLegalReserve - existingLegalReserve,
  );
  
  const legalReserve = existingLegalReserve + legalReserveContribution;
  
  // Bénéfice distribuable
  const distributableProfit = netIncome - legalReserveContribution + retainedEarningsPrior;
  
  // Par défaut, on suppose pas de dividendes déclarés immédiatement
  const dividendsPayable = 0;
  const retainedEarnings = distributableProfit;
  
  return {
    netIncome,
    legalReserve,
    distributableProfit,
    dividendsPayable,
    retainedEarnings,
    partnerCurrentAccounts: [],
  };
}

/**
 * Génère le tableau de reconnaissance de revenu pour abonnement SaaS
 */
export function generateSubscriptionSchedule(
  totalAmount: number,
  startDate: string,
  durationMonths: number,
): SubscriptionRevenue {
  const monthlyRecognition = totalAmount / durationMonths;
  const start = new Date(startDate);
  const end = new Date(start);
  end.setMonth(end.getMonth() + durationMonths);
  
  return {
    subscriptionId: crypto.randomUUID(),
    customerName: "",
    totalAmount,
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
    monthlyRecognition,
    deferredRevenue: totalAmount, // Au départ, tout est différé
    recognizedRevenue: 0,
  };
}

/**
 * Vérifie la disponibilité budgétaire pour entité publique
 */
export function checkBudgetAvailability(
  availableCredit: number,
  commitmentAmount: number,
): BudgetCommitment {
  const isBlocked = commitmentAmount > availableCredit;
  
  return {
    commitmentId: crypto.randomUUID(),
    budgetLine: "",
    amount: commitmentAmount,
    stage: "ENGAGEMENT",
    availableCredit,
    isBlocked,
    blockReason: isBlocked 
      ? `Dépassement de Crédit Budgétaire : ${commitmentAmount.toFixed(2)} > ${availableCredit.toFixed(2)} (écart: ${(commitmentAmount - availableCredit).toFixed(2)})`
      : undefined,
  };
}
