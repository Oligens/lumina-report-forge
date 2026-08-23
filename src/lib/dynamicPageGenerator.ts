/**
 * Moteur IA de Génération Dynamique de Pages & Multi-Normes
 * ScarWrite Rapport - Dynamic Page Generator & Accounting Standards Adapter
 */

import type { BusinessModel, AccountingStandard, JournalEntry } from '../types/report';
import { parseAccountingResponse, buildAccountingPrompt } from './accountingEngine';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface DynamicPageConfig {
  businessModel: BusinessModel;
  accountingStandard: AccountingStandard;
  pageSchema: PageSchema;
  kpiCards: KPIConfig[];
  journalColumns: JournalColumn[];
  calculationRules: CalculationRule[];
}

export interface PageSchema {
  pageId: string;
  pageTitle: string;
  components: string[];
  dataSources: string[];
  actions: PageAction[];
}

export interface PageAction {
  actionId: string;
  label: string;
  icon: string;
  handler: string;
  permissions: string[];
}

export interface KPIConfig {
  kpiId: string;
  label: string;
  formula: string;
  format: 'currency' | 'percentage' | 'number' | 'date';
  sourceField: string;
}

export interface JournalColumn {
  field: string;
  label: string;
  type: 'text' | 'number' | 'currency' | 'date' | 'select' | 'account';
  required: boolean;
  editable: boolean;
  validation?: string;
}

export interface CalculationRule {
  ruleId: string;
  name: string;
  formula: string;
  appliesTo: BusinessModel[];
  standard?: AccountingStandard;
}

// ============================================================================
// CONFIGURATIONS PAR MODÈLE D'ENTREPRISE
// ============================================================================

const BUSINESS_MODEL_CONFIGS: Record<BusinessModel, Omit<DynamicPageConfig, 'accountingStandard'>> = {
  COMMERCIAL: {
    businessModel: 'COMMERCIAL',
    pageSchema: {
      pageId: 'retail-operations',
      pageTitle: 'Opérations Commerciales & Retail',
      components: ['CashRegister', 'StockManager', 'SalesDirect', 'DiscountManager'],
      dataSources: ['sales', 'inventory', 'cashFlow', 'customers'],
      actions: [
        { actionId: 'new-sale', label: 'Nouvelle Vente', icon: 'shopping-cart', handler: 'createSale', permissions: ['SUPER_ADMIN', 'COMPTABLE_SAISSEUR'] },
        { actionId: 'stock-adjustment', label: 'Ajustement Stock', icon: 'package', handler: 'adjustStock', permissions: ['SUPER_ADMIN'] },
        { actionId: 'generate-invoice', label: 'Générer Facture', icon: 'file-text', handler: 'createInvoice', permissions: ['SUPER_ADMIN', 'COMPTABLE_SAISSEUR'] }
      ]
    },
    kpiCards: [
      { kpiId: 'daily-sales', label: 'Ventes du Jour', formula: 'SUM(sales.amount) WHERE date = TODAY', format: 'currency', sourceField: 'sales.amount' },
      { kpiId: 'gross-margin', label: 'Marge Brute %', formula: '(sales.amount - cogs) / sales.amount * 100', format: 'percentage', sourceField: 'margin.percent' },
      { kpiId: 'stock-value', label: 'Valeur Stock', formula: 'SUM(inventory.quantity * inventory.unitCost)', format: 'currency', sourceField: 'inventory.value' },
      { kpiId: 'avg-ticket', label: 'Panier Moyen', formula: 'AVG(sales.amount)', format: 'currency', sourceField: 'sales.average' }
    ],
    journalColumns: [
      { field: 'date', label: 'Date', type: 'date', required: true, editable: true },
      { field: 'reference', label: 'Référence', type: 'text', required: false, editable: true },
      { field: 'customer', label: 'Client', type: 'text', required: false, editable: true },
      { field: 'accountDebit', label: 'Compte Débit', type: 'account', required: true, editable: true },
      { field: 'accountCredit', label: 'Compte Crédit', type: 'account', required: true, editable: true },
      { field: 'amount', label: 'Montant', type: 'currency', required: true, editable: true },
      { field: 'taxRate', label: 'Taux TVA %', type: 'number', required: false, editable: true, validation: '0-100' },
      { field: 'status', label: 'Statut', type: 'select', required: true, editable: false }
    ],
    calculationRules: [
      { ruleId: 'cump-calc', name: 'Calcul CUMP', formula: '(stockInitial.value + purchases.value) / (stockInitial.qty + purchases.qty)', appliesTo: ['COMMERCIAL'] },
      { ruleId: 'fifo-out', name: 'Sortie FIFO', formula: 'FIRST_IN_FIRST_OUT', appliesTo: ['COMMERCIAL'] },
      { ruleId: 'discount-calc', name: 'Calcul Remise', formula: 'amount * (discountPercent / 100)', appliesTo: ['COMMERCIAL'] }
    ]
  },

  INDUSTRY: {
    businessModel: 'INDUSTRY',
    pageSchema: {
      pageId: 'production-operations',
      pageTitle: 'Production & Coût de Revient',
      components: ['CostCalculator', 'RawMaterialTracker', 'TransformationSheet', 'GrossMarginAnalyzer'],
      dataSources: ['production', 'rawMaterials', 'labor', 'overhead', 'finishedGoods'],
      actions: [
        { actionId: 'new-production', label: 'Nouvelle Production', icon: 'factory', handler: 'createProduction', permissions: ['SUPER_ADMIN', 'COMPTABLE_SAISSEUR'] },
        { actionId: 'cost-analysis', label: 'Analyse Coûts', icon: 'bar-chart', handler: 'analyzeCosts', permissions: ['SUPER_ADMIN'] },
        { actionId: 'transformation-sheet', label: 'Fiche Transformation', icon: 'clipboard', handler: 'createTransformationSheet', permissions: ['SUPER_ADMIN', 'COMPTABLE_SAISSEUR'] }
      ]
    },
    kpiCards: [
      { kpiId: 'unit-cost', label: 'Coût de Revient Unitaire', formula: '(materials + labor + overhead) / unitsProduced', format: 'currency', sourceField: 'production.unitCost' },
      { kpiId: 'gross-margin-industry', label: 'Marge Brute Industrielle', formula: '(revenue - productionCost) / revenue * 100', format: 'percentage', sourceField: 'margin.industrial' },
      { kpiId: 'material-consumption', label: 'Consommation Matières', formula: 'SUM(rawMaterials.used)', format: 'currency', sourceField: 'materials.consumed' },
      { kpiId: 'labor-efficiency', label: 'Efficacité Main-d\'Œuvre', formula: 'standardHours / actualHours * 100', format: 'percentage', sourceField: 'labor.efficiency' }
    ],
    journalColumns: [
      { field: 'date', label: 'Date', type: 'date', required: true, editable: true },
      { field: 'productionOrder', label: 'Ordre de Fabrication', type: 'text', required: true, editable: true },
      { field: 'product', label: 'Produit', type: 'text', required: true, editable: true },
      { field: 'rawMaterials', label: 'Matières Premières', type: 'text', required: true, editable: true },
      { field: 'directLabor', label: 'Main-d\'Œuvre Directe', type: 'currency', required: true, editable: true },
      { field: 'overhead', label: 'Charges Indirectes', type: 'currency', required: true, editable: true },
      { field: 'totalCost', label: 'Coût Total', type: 'currency', required: true, editable: false },
      { field: 'unitsProduced', label: 'Unités Produites', type: 'number', required: true, editable: true },
      { field: 'unitCost', label: 'Coût Unitaire', type: 'currency', required: true, editable: false }
    ],
    calculationRules: [
      { ruleId: 'cost-of-goods-manufactured', name: 'Coût de Production', formula: 'materials + directLabor + manufacturingOverhead', appliesTo: ['INDUSTRY'] },
      { ruleId: 'unit-cost-calc', name: 'Coût Unitaire', formula: 'totalProductionCost / unitsProduced', appliesTo: ['INDUSTRY'] },
      { ruleId: 'material-variance', name: 'Écart Matières', formula: '(actualQty - standardQty) * standardPrice', appliesTo: ['INDUSTRY'] }
    ]
  },

  SAAS: {
    businessModel: 'SAAS',
    pageSchema: {
      pageId: 'saas-subscriptions',
      pageTitle: 'Abonnements & Revenus Différés (IFRS 15)',
      components: ['SubscriptionManager', 'DeferredRevenueTracker', 'MRRCalculator', 'RecurringBilling'],
      dataSources: ['subscriptions', 'deferredRevenue', 'mrr', 'arr', 'churn'],
      actions: [
        { actionId: 'new-subscription', label: 'Nouvel Abonnement', icon: 'user-plus', handler: 'createSubscription', permissions: ['SUPER_ADMIN', 'COMPTABLE_SAISSEUR'] },
        { actionId: 'recognize-revenue', label: 'Reconnaître Revenu', icon: 'trending-up', handler: 'recognizeRevenue', permissions: ['SUPER_ADMIN'] },
        { actionId: 'mrr-analysis', label: 'Analyse MRR', icon: 'activity', handler: 'analyzeMRR', permissions: ['SUPER_ADMIN'] }
      ]
    },
    kpiCards: [
      { kpiId: 'mrr', label: 'Revenu Récurrent Mensuel (MRR)', formula: 'SUM(activeSubscriptions.monthlyValue)', format: 'currency', sourceField: 'subscriptions.mrr' },
      { kpiId: 'arr', label: 'Revenu Récurrent Annuel (ARR)', formula: 'MRR * 12', format: 'currency', sourceField: 'subscriptions.arr' },
      { kpiId: 'deferred-revenue', label: 'Revenus Constatés d\'Avance', formula: 'SUM(unearnedRevenue.balance)', format: 'currency', sourceField: 'deferred.balance' },
      { kpiId: 'churn-rate', label: 'Taux de Désabonnement', formula: 'churnedCustomers / totalCustomers * 100', format: 'percentage', sourceField: 'churn.rate' },
      { kpiId: 'ltv', label: 'Valeur Vie Client (LTV)', formula: 'ARPU * averageLifespan', format: 'currency', sourceField: 'customer.ltv' }
    ],
    journalColumns: [
      { field: 'date', label: 'Date', type: 'date', required: true, editable: true },
      { field: 'subscriptionId', label: 'ID Abonnement', type: 'text', required: true, editable: true },
      { field: 'customer', label: 'Client', type: 'text', required: true, editable: true },
      { field: 'plan', label: 'Formule', type: 'select', required: true, editable: true },
      { field: 'billingPeriod', label: 'Période', type: 'select', required: true, editable: true },
      { field: 'totalAmount', label: 'Montant Total', type: 'currency', required: true, editable: true },
      { field: 'recognizedThisMonth', label: 'Reconnu ce Mois', type: 'currency', required: true, editable: false },
      { field: 'deferredAmount', label: 'Différé', type: 'currency', required: true, editable: false },
      { field: 'accountDebit', label: 'Compte Débit', type: 'account', required: true, editable: true },
      { field: 'accountCredit', label: 'Compte Crédit', type: 'account', required: true, editable: true }
    ],
    calculationRules: [
      { ruleId: 'monthly-recognition', name: 'Reconnaissance Mensuelle', formula: 'totalAmount / contractMonths', appliesTo: ['SAAS'] },
      { ruleId: 'deferred-initial', name: 'Différé Initial', formula: 'totalAmount - recognizedThisMonth', appliesTo: ['SAAS'] },
      { ruleId: 'mrr-calc', name: 'Calcul MRR', formula: 'SUM(allActiveSubscriptions.normalizedMonthly)', appliesTo: ['SAAS'] }
    ]
  },

  PUBLIC: {
    businessModel: 'PUBLIC',
    pageSchema: {
      pageId: 'public-budget-execution',
      pageTitle: 'Exécution Budgétaire & IPSAS',
      components: ['BudgetCommitmentTracker', 'AppropriationManager', 'FundAccounting', 'AuditTrail'],
      dataSources: ['budget', 'commitments', 'appropriations', 'funds', 'expenditures'],
      actions: [
        { actionId: 'new-commitment', label: 'Nouvel Engagement', icon: 'file-check', handler: 'createCommitment', permissions: ['SUPER_ADMIN', 'COMPTABLE_SAISSEUR'] },
        { actionId: 'liquidation', label: 'Liquidation', icon: 'check-square', handler: 'processLiquidation', permissions: ['SUPER_ADMIN'] },
        { actionId: 'payment-order', label: 'Ordonnancement', icon: 'send', handler: 'createPaymentOrder', permissions: ['SUPER_ADMIN'] },
        { actionId: 'budget-check', label: 'Vérification Crédits', icon: 'shield', handler: 'checkBudgetCredits', permissions: ['SUPER_ADMIN', 'COMPTABLE_SAISSEUR'] }
      ]
    },
    kpiCards: [
      { kpiId: 'budget-execution', label: 'Taux d\'Exécution Budgétaire', formula: 'actualExpenditures / approvedBudget * 100', format: 'percentage', sourceField: 'budget.executionRate' },
      { kpiId: 'committed-funds', label: 'Crédits Engagés', formula: 'SUM(commitments.amount)', format: 'currency', sourceField: 'commitments.total' },
      { kpiId: 'available-credits', label: 'Crédits Disponibles', formula: 'approvedBudget - commitments - expenditures', format: 'currency', sourceField: 'budget.available' },
      { kpiId: 'fund-balance', label: 'Solde des Fonds Affectés', formula: 'SUM(funds.balance)', format: 'currency', sourceField: 'funds.totalBalance' }
    ],
    journalColumns: [
      { field: 'date', label: 'Date', type: 'date', required: true, editable: true },
      { field: 'budgetLine', label: 'Ligne Budgétaire', type: 'text', required: true, editable: true },
      { field: 'commitmentRef', label: 'Réf. Engagement', type: 'text', required: false, editable: true },
      { field: 'phase', label: 'Phase', type: 'select', required: true, editable: true, validation: 'engagement|liquidation|ordonnancement|paiement' },
      { field: 'creditor', label: 'Créancier', type: 'text', required: true, editable: true },
      { field: 'accountDebit', label: 'Compte Débit', type: 'account', required: true, editable: true },
      { field: 'accountCredit', label: 'Compte Crédit', type: 'account', required: true, editable: true },
      { field: 'amount', label: 'Montant', type: 'currency', required: true, editable: true },
      { field: 'budgetAvailable', label: 'Crédit Disponible', type: 'currency', required: true, editable: false },
      { field: 'status', label: 'Statut', type: 'select', required: true, editable: false }
    ],
    calculationRules: [
      { ruleId: 'budget-availability', name: 'Disponibilité Budgétaire', formula: 'approvedBudget - commitments - actualExpenditures', appliesTo: ['PUBLIC'] },
      { ruleId: 'commitment-block', name: 'Blocage Dépassement', formula: 'IF(commitment > available) THEN BLOCK', appliesTo: ['PUBLIC'] },
      { ruleId: 'four-phase-workflow', name: 'Workflow 4 Phases', formula: 'engagement -> liquidation -> ordonnancement -> paiement', appliesTo: ['PUBLIC'] }
    ]
  },

  MOBILE_MONEY: {
    businessModel: 'MOBILE_MONEY',
    pageSchema: {
      pageId: 'mobile-money-transfers',
      pageTitle: 'Mobile Money & Transferts Internationaux',
      components: ['MultiCurrencyCashManager', 'WalletTracker', 'CommissionIsolator', 'ReconciliationTool'],
      dataSources: ['cashDrawer', 'wallets', 'transactions', 'commissions', 'exchangeRates'],
      actions: [
        { actionId: 'new-deposit', label: 'Nouveau Dépôt', icon: 'arrow-down-circle', handler: 'createDeposit', permissions: ['SUPER_ADMIN', 'COMPTABLE_SAISSEUR'] },
        { actionId: 'new-withdrawal', label: 'Nouveau Retrait', icon: 'arrow-up-circle', handler: 'createWithdrawal', permissions: ['SUPER_ADMIN', 'COMPTABLE_SAISSEUR'] },
        { actionId: 'end-day-reconciliation', label: 'Clôture Journalière', icon: 'check-circle', handler: 'reconcileDay', permissions: ['SUPER_ADMIN'] },
        { actionId: 'rate-update', label: 'Maj Taux Change', icon: 'refresh-cw', handler: 'updateExchangeRate', permissions: ['SUPER_ADMIN'] }
      ]
    },
    kpiCards: [
      { kpiId: 'cash-balance', label: 'Caisse Cash Active', formula: 'initialCash + SUM(deposits.cashIn) - SUM(withdrawals.cashOut)', format: 'currency', sourceField: 'cash.balance' },
      { kpiId: 'wallet-balance', label: 'Caisse Numérique Active', formula: 'initialWallet - SUM(deposits.walletOut) + SUM(withdrawals.walletIn)', format: 'currency', sourceField: 'wallet.balance' },
      { kpiId: 'isolated-commissions', label: 'Total Honoraires Isolés', formula: 'SUM(clientFees + operatorCommissions)', format: 'currency', sourceField: 'commissions.total' },
      { kpiId: 'transaction-volume', label: 'Volume Transactions', formula: 'COUNT(transactions)', format: 'number', sourceField: 'transactions.count' },
      { kpiId: 'fx-exposure', label: 'Exposition Devises', formula: 'USD_balance * exchangeRate', format: 'currency', sourceField: 'forex.exposure' }
    ],
    journalColumns: [
      { field: 'date', label: 'Date', type: 'date', required: true, editable: true },
      { field: 'service', label: 'Service', type: 'select', required: true, editable: true },
      { field: 'transactionType', label: 'Type', type: 'select', required: true, editable: true, validation: 'depot|retrait' },
      { field: 'clientAmount', label: 'Montant Client', type: 'currency', required: true, editable: true },
      { field: 'clientFees', label: 'Frais Client (Cash)', type: 'currency', required: true, editable: true },
      { field: 'operatorCommission', label: 'Commission Opérateur', type: 'currency', required: true, editable: true },
      { field: 'cashImpact', label: 'Impact Cash Exact', type: 'currency', required: true, editable: false },
      { field: 'walletImpact', label: 'Impact Wallet Exact', type: 'currency', required: true, editable: false },
      { field: 'netCommission', label: 'Honoraire Net Gagné', type: 'currency', required: true, editable: false },
      { field: 'newCashBalance', label: 'Nouveau Solde Cash', type: 'currency', required: true, editable: false },
      { field: 'newWalletBalance', label: 'Nouveau Solde Numérique', type: 'currency', required: true, editable: false }
    ],
    calculationRules: [
      { ruleId: 'deposit-cash-flow', name: 'Flux Cash Dépôt', formula: 'cashFinal = cashInitial + clientAmount + clientFees', appliesTo: ['MOBILE_MONEY'] },
      { ruleId: 'deposit-wallet-flow', name: 'Flux Wallet Dépôt', formula: 'walletFinal = walletInitial - clientAmount + operatorCommission', appliesTo: ['MOBILE_MONEY'] },
      { ruleId: 'withdrawal-cash-flow', name: 'Flux Cash Retrait', formula: 'cashFinal = cashInitial - clientAmount', appliesTo: ['MOBILE_MONEY'] },
      { ruleId: 'withdrawal-wallet-flow', name: 'Flux Wallet Retrait', formula: 'walletFinal = walletInitial + clientAmount + commissions', appliesTo: ['MOBILE_MONEY'] },
      { ruleId: 'commission-isolation', name: 'Isolement Honoraires', formula: 'netCommission = clientFees + operatorCommission (UNIQUE REVENUE)', appliesTo: ['MOBILE_MONEY'] }
    ]
  }
};

// ============================================================================
// CONFIGURATIONS PAR NORME COMPTABLE
// ============================================================================

const ACCOUNTING_STANDARD_CONFIGS: Record<AccountingStandard, {
  chartOfAccountsPrefix: string;
  balanceSheetStructure: string[];
  incomeStatementStructure: string[];
  taxConfiguration: any;
  specificColumns: JournalColumn[];
}> = {
  SYSCOHADA: {
    chartOfAccountsPrefix: 'OHADA',
    balanceSheetStructure: [
      'ACTIF IMMOBILISE', 'ACTIF CIRCULANT', 'TRESORERIE-ACTIF',
      'CAPITAUX PROPRES', 'DETTES FINANCIERES', 'DETTES CIRCULANTES', 'TRESORERIE-PASSIF'
    ],
    incomeStatementStructure: [
      'PRODUITS EXPLOITATION', 'CHARGES EXPLOITATION',
      'PRODUITS FINANCIERS', 'CHARGES FINANCIERES',
      'PRODUITS HORS ACTIVITE', 'CHARGES HORS ACTIVITE',
      'IMPOTS SUR BENEFICES'
    ],
    taxConfiguration: {
      defaultTaxAccount: '443', // État - TVA
      taxRateDefault: 18,
      deductibleExpenses: ['60', '61', '62'],
      nonDeductibleExpenses: ['635', '638']
    },
    specificColumns: [
      { field: 'analyticSection', label: 'Section Analytique', type: 'select', required: false, editable: true },
      { field: 'fiscalYear', label: 'Exercice Fiscal', type: 'text', required: true, editable: false }
    ]
  },

  IFRS: {
    chartOfAccountsPrefix: 'IFRS',
    balanceSheetStructure: [
      'NON-CURRENT ASSETS', 'CURRENT ASSETS',
      'EQUITY', 'NON-CURRENT LIABILITIES', 'CURRENT LIABILITIES'
    ],
    incomeStatementStructure: [
      'REVENUE', 'COST OF SALES',
      'OTHER OPERATING INCOME', 'OTHER OPERATING EXPENSES',
      'FINANCE INCOME', 'FINANCE COSTS',
      'SHARE OF PROFIT OF ASSOCIATES', 'INCOME TAX'
    ],
    taxConfiguration: {
      deferredTaxRequired: true,
      impairmentTesting: true,
      fairValueMeasurement: true,
      revenueRecognitionStandard: 'IFRS 15'
    },
    specificColumns: [
      { field: 'fairValueAdjustment', label: 'Ajustement Juste Valeur', type: 'currency', required: false, editable: true },
      { field: 'impairmentIndicator', label: 'Indice Dépréciation', type: 'select', required: false, editable: true }
    ]
  },

  US_GAAP: {
    chartOfAccountsPrefix: 'GAAP',
    balanceSheetStructure: [
      'CURRENT ASSETS', 'PROPERTY PLANT EQUIPMENT', 'OTHER ASSETS',
      'CURRENT LIABILITIES', 'LONG-TERM DEBT', 'STOCKHOLDERS EQUITY'
    ],
    incomeStatementStructure: [
      'NET SALES', 'COST OF GOODS SOLD',
      'OPERATING EXPENSES', 'OTHER INCOME (EXPENSE)',
      'INCOME BEFORE TAXES', 'PROVISION FOR INCOME TAXES', 'NET INCOME'
    ],
    taxConfiguration: {
      asc606Compliance: true,
      leaseAccountingASC842: true,
      creditLossesASC326: true
    },
    specificColumns: [
      { field: 'segmentReporting', label: 'Segment Reporting', type: 'select', required: false, editable: true },
      { field: 'gaapAdjustment', label: 'Ajustement GAAP', type: 'currency', required: false, editable: true }
    ]
  },

  DGI_LOCAL: {
    chartOfAccountsPrefix: 'DGI',
    balanceSheetStructure: [
      'ACTIF LONG TERME', 'ACTIF COURT TERME',
      'CAPITAUX PROPRES', 'PASSIF LONG TERME', 'PASSIF COURT TERME'
    ],
    incomeStatementStructure: [
      'CHIFFRE AFFAIRES', 'ACHATS CONSOMMES',
      'CHARGES EXTERNES', 'CHARGES PERSONNEL',
      'IMPOTS TAXES', 'RESULTAT FINANCIER',
      'RESULTAT EXCEPTIONNEL', 'IMPOT SOCIETES'
    ],
    taxConfiguration: {
      localTaxRate: 30,
      withholdingTaxRequired: true,
      patentiRequired: true,
      declarationMensuelle: true
    },
    specificColumns: [
      { field: 'taxWithholding', label: 'Retenue à la Source', type: 'currency', required: false, editable: true },
      { field: 'declarationRef', label: 'Réf. Déclaration', type: 'text', required: false, editable: true }
    ]
  }
};

// ============================================================================
// FONCTIONS PRINCIPALES DU GÉNÉRATEUR DYNAMIQUE
// ============================================================================

/**
 * Génère la configuration complète d'une page dynamique selon le modèle d'entreprise et la norme
 */
export function generateDynamicPageConfig(
  businessModel: BusinessModel,
  accountingStandard: AccountingStandard
): DynamicPageConfig {
  const modelConfig = BUSINESS_MODEL_CONFIGS[businessModel];
  const standardConfig = ACCOUNTING_STANDARD_CONFIGS[accountingStandard];

  // Fusionner les colonnes spécifiques de la norme avec celles du modèle
  const mergedColumns = [
    ...modelConfig.journalColumns,
    ...standardConfig.specificColumns
  ];

  return {
    businessModel,
    accountingStandard,
    pageSchema: modelConfig.pageSchema,
    kpiCards: modelConfig.kpiCards,
    journalColumns: mergedColumns,
    calculationRules: modelConfig.calculationRules
  };
}

/**
 * Analyse le contexte utilisateur et suggère le modèle d'entreprise approprié
 */
export function analyzeBusinessContext(userDescription: string): {
  suggestedModel: BusinessModel;
  confidence: number;
  reasoning: string;
} {
  const keywords: Record<BusinessModel, string[]> = {
    COMMERCIAL: ['vente', 'commerce', 'boutique', 'magasin', 'retail', 'achat', 'revente', 'stock'],
    INDUSTRY: ['production', 'usine', 'fabrication', 'industrie', 'manufacture', 'transformation', 'matières premières'],
    SAAS: ['abonnement', 'saas', 'logiciel', 'service', 'récurrent', 'mensuel', 'digital', 'platforme'],
    PUBLIC: ['public', 'état', 'gouvernement', 'administration', 'ong', 'association', 'budget', 'ipsas'],
    MOBILE_MONEY: ['mobile money', 'transfert', 'moncash', 'natcash', 'western union', 'moneygram', 'envoi', 'retrait']
  };

  let maxScore = 0;
  let suggestedModel: BusinessModel = 'COMMERCIAL';
  let reasoning = '';

  for (const [model, modelKeywords] of Object.entries(keywords) as [BusinessModel, string[]][]) {
    const score = modelKeywords.reduce((acc, keyword) => {
      return acc + (userDescription.toLowerCase().includes(keyword.toLowerCase()) ? 1 : 0);
    }, 0);

    if (score > maxScore) {
      maxScore = score;
      suggestedModel = model;
      reasoning = `Détection basée sur les mots-clés: ${modelKeywords.filter(k => userDescription.toLowerCase().includes(k.toLowerCase())).join(', ')}`;
    }
  }

  const confidence = maxScore > 0 ? Math.min(maxScore * 20, 95) : 60;

  return {
    suggestedModel,
    confidence,
    reasoning: reasoning || 'Modèle par défaut: Commerce/Retail'
  };
}

/**
 * Génère les écritures comptables adaptées à la norme sélectionnée
 */
export function generateStandardCompliantEntries(
  entries: Partial<JournalEntry>[],
  standard: AccountingStandard,
  businessModel: BusinessModel
): JournalEntry[] {
  const standardConfig = ACCOUNTING_STANDARD_CONFIGS[standard];
  const pageConfig = generateDynamicPageConfig(businessModel, standard);

  return entries.map(entry => {
    const compliantEntry: JournalEntry = {
      id: entry.id || crypto.randomUUID(),
      date: entry.date || new Date().toISOString().split('T')[0],
      description: entry.description || '',
      accountDebit: entry.accountDebit || '',
      accountCredit: entry.accountCredit || '',
      amount: entry.amount || 0,
      currency: entry.currency || 'HTG',
      status: 'pending',
      createdAt: new Date().toISOString(),
      createdBy: entry.createdBy || 'system',
      businessModel,
      accountingStandard: standard,
      metadata: {
        standardSpecific: {}
      }
    };

    // Appliquer les spécificités de la norme
    if (standard === 'IFRS') {
      compliantEntry.metadata!.standardSpecific = {
        fairValueAdjusted: false,
        impairmentTested: false,
        revenueRecognizedAccordingTo15: true
      };
    } else if (standard === 'US_GAAP') {
      compliantEntry.metadata!.standardSpecific = {
        asc606Compliant: true,
        segmentReported: 'default'
      };
    } else if (standard === 'SYSCOHADA') {
      compliantEntry.metadata!.standardSpecific = {
        ohadaSection: 'exploitation',
        fiscalYear: new Date().getFullYear().toString()
      };
    }

    return compliantEntry;
  });
}

/**
 * Calcule les KPI dynamiques selon le modèle d'entreprise
 */
export function calculateDynamicKPIs(
  businessModel: BusinessModel,
  data: any
): Record<string, number> {
  const config = BUSINESS_MODEL_CONFIGS[businessModel];
  const kpiResults: Record<string, number> = {};

  config.kpiCards.forEach(kpi => {
    try {
      // Évaluation simplifiée des formules (à remplacer par un moteur d'évaluation sécurisé en prod)
      const formula = kpi.formula.replace(/SUM\(/g, 'data.')
                                .replace(/AVG\(/g, 'data.avg_')
                                .replace(/\*/g, '*')
                                .replace(/\//g, '/');
      
      // Simulation de calcul (dans la réalité, utiliser un parser mathématique sécurisé)
      kpiResults[kpi.kpiId] = 0; // Placeholder pour calcul réel
      
      // Exemples de calculs réels selon le modèle
      if (businessModel === 'COMMERCIAL' && kpi.kpiId === 'daily-sales') {
        kpiResults[kpi.kpiId] = data.sales?.reduce((sum: number, s: any) => sum + s.amount, 0) || 0;
      } else if (businessModel === 'SAAS' && kpi.kpiId === 'mrr') {
        kpiResults[kpi.kpiId] = data.subscriptions?.reduce((sum: number, s: any) => sum + (s.monthlyValue || 0), 0) || 0;
      } else if (businessModel === 'MOBILE_MONEY' && kpi.kpiId === 'isolated-commissions') {
        kpiResults[kpi.kpiId] = data.commissions?.reduce((sum: number, c: any) => sum + (c.netCommission || 0), 0) || 0;
      }
    } catch (error) {
      console.error(`Erreur calcul KPI ${kpi.kpiId}:`, error);
      kpiResults[kpi.kpiId] = 0;
    }
  });

  return kpiResults;
}

/**
 * Valide qu'une écriture respecte les règles du modèle et de la norme
 */
export function validateEntryAgainstRules(
  entry: JournalEntry,
  businessModel: BusinessModel,
  accountingStandard: AccountingStandard
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const config = generateDynamicPageConfig(businessModel, accountingStandard);

  // Vérification des champs requis
  config.journalColumns.forEach(col => {
    if (col.required && (entry as any)[col.field] === undefined) {
      errors.push(`Champ requis manquant: ${col.label}`);
    }
  });

  // Application des règles de calcul spécifiques
  config.calculationRules.forEach(rule => {
    if (rule.appliesTo.includes(businessModel)) {
      // Logique de validation spécifique selon la règle
      if (rule.ruleId === 'budget-availability' && businessModel === 'PUBLIC') {
        // Vérification disponibilité budgétaire (à implémenter avec les données réelles)
        warnings.push('Vérification crédits budgétaires requise');
      }
    }
  });

  // Vérifications spécifiques aux normes
  if (accountingStandard === 'IFRS' && entry.amount > 1000000) {
    warnings.push('Montant élevé: test de dépréciation requis selon IFRS');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Exporte la structure de page pour génération React dynamique
 */
export function exportPageSchemaForReact(pageConfig: DynamicPageConfig): string {
  return JSON.stringify({
    pageId: pageConfig.pageSchema.pageId,
    title: pageConfig.pageSchema.pageTitle,
    components: pageConfig.pageSchema.components,
    kpiCards: pageConfig.kpiCards.map(kpi => ({
      id: kpi.kpiId,
      label: kpi.label,
      format: kpi.format
    })),
    columns: pageConfig.journalColumns.map(col => ({
      field: col.field,
      label: col.label,
      type: col.type,
      required: col.required
    })),
    actions: pageConfig.pageSchema.actions
  }, null, 2);
}
