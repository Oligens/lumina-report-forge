/**
 * Module d'Ingénierie Financière - Mobile Money & Transferts Internationaux
 * Gestion stricte des impacts de caisses (Cash vs Wallet) et isolation des honoraires
 * 
 * Normes: IFRS, SYSCOHADA, Gestion de Trésorerie Multi-Devises
 */

import type { CurrencyCode, BusinessModel } from '../types/report';

// ============================================================================
// TYPES DE DONNÉES
// ============================================================================

export type MobileMoneyService = 
  | 'MonCash'
  | 'Natcash'
  | 'Western Union'
  | 'MoneyGram'
  | 'Ria'
  | 'CAM Transfer'
  | 'QuickPay'
  | 'Autre';

export type TransactionType = 'DEPOT' | 'RETRAIT';

export interface CommissionGrid {
  service: MobileMoneyService;
  currency: CurrencyCode;
  depositRate: number; // % commission agent sur dépôt
  withdrawalRate: number; // % commission agent sur retrait
  clientFeeFixed: number; // Frais fixes client
  clientFeePercent: number; // % frais client
}

export interface MobileMoneyWallet {
  service: MobileMoneyService;
  currency: CurrencyCode;
  balance: number; // Solde actuel dans la devise du wallet
}

export interface CashBox {
  currency: CurrencyCode;
  balance: number; // Solde actuel dans la devise
}

export interface MobileMoneyTransaction {
  id: string;
  date: string;
  service: MobileMoneyService;
  type: TransactionType;
  amount: number; // Montant de la transaction (principal)
  currency: CurrencyCode; // Devise de la transaction
  clientFee: number; // Frais payés par le client (en cash généralement)
  operatorCommission: number; // Commission opérateur (dans la devise du wallet)
  
  // Calculs automatiques stricts
  cashImpact: number; // Impact exact sur la caisse cash (+/-)
  walletImpact: number; // Impact exact sur le wallet (+/-)
  netHonorarium: number; // Honoraire net encaissé (Frais Client + Commission)
  netHonorariumBaseCurrency: number; // Honoraire converti en devise de base
  
  // Références
  exchangeRate: number; // Taux de change utilisé
  baseCurrency: CurrencyCode;
}

export interface DailyReconciliation {
  date: string;
  service: MobileMoneyService;
  declaredCommission: number; // Commission réelle déclarée en fin de journée
  systemCommission: number; // Commission calculée par le système
  adjustment: number; // Ajustement (Déclaré - Système)
  adjustedWalletBalance: number; // Solde wallet après ajustement
}

export interface MobileMoneyDashboard {
  // Soldes actuels
  cashBoxes: Record<CurrencyCode, number>;
  wallets: Record<MobileMoneyService, number>;
  
  // Totaux de la période
  totalDeposits: number;
  totalWithdrawals: number;
  totalHonorariums: number;
  totalHonorariumsBaseCurrency: number;
  
  // Transactions
  transactions: MobileMoneyTransaction[];
  
  // Réconciliations
  reconciliations: DailyReconciliation[];
}

// ============================================================================
// MOTEUR DE CALCUL STRICT DES IMPACTS DE CAISSE
// ============================================================================

/**
 * Calcule les impacts EXACTS selon les formules strictes fournies
 * 
 * FORMULES OFFICIELLES:
 * 
 * DÉPÔT / TRANSFERT SORTANT:
 * - Caisse Cash Finale = Cash Actuel + Montant Transféré + Frais Client
 * - Caisse Numérique Finale = Numérique Actuel - Montant Transféré + Commission Opérateur
 * - Honoraire Net = Frais Client + Commission Opérateur
 * 
 * RETRAIT / RÉCEPTION:
 * - Caisse Cash Finale = Cash Actuel - Montant Remis au Client
 * - Caisse Numérique Finale = Numérique Actuel + Montant Transféré + Commissions/Frais
 * - Honoraire Net = Commissions / Frais Reçus dans le Wallet
 */
export function calculateMobileMoneyImpacts(
  params: {
    type: TransactionType;
    amount: number; // Montant principal de la transaction
    clientFee: number; // Frais client (généralement en cash)
    operatorCommission: number; // Commission opérateur (dans la devise du wallet)
    currentCashBalance: number;
    currentWalletBalance: number;
    exchangeRate: number; // Pour conversion vers devise de base
    baseCurrency: CurrencyCode;
    transactionCurrency: CurrencyCode;
  }
): {
  newCashBalance: number;
  newWalletBalance: number;
  cashImpact: number;
  walletImpact: number;
  netHonorarium: number;
  netHonorariumBaseCurrency: number;
} {
  const {
    type,
    amount,
    clientFee,
    operatorCommission,
    currentCashBalance,
    currentWalletBalance,
    exchangeRate,
    baseCurrency,
    transactionCurrency
  } = params;

  let newCashBalance: number;
  let newWalletBalance: number;
  let cashImpact: number;
  let walletImpact: number;
  let netHonorarium: number;

  if (type === 'DEPOT') {
    // === CAS DÉPÔT / TRANSFERT SORTANT ===
    // Formule: Cash Final = Cash Actuel + Montant Transféré + Frais Client
    newCashBalance = currentCashBalance + amount + clientFee;
    cashImpact = +(amount + clientFee);

    // Formule: Wallet Final = Wallet Actuel - Montant Transféré + Commission Opérateur
    newWalletBalance = currentWalletBalance - amount + operatorCommission;
    walletImpact = -amount + operatorCommission;

    // Honoraire Net = Frais Client + Commission Opérateur
    netHonorarium = clientFee + operatorCommission;
  } else {
    // === CAS RETRAIT / RÉCEPTION ===
    // Formule: Cash Final = Cash Actuel - Montant Remis au Client
    newCashBalance = currentCashBalance - amount;
    cashImpact = -amount;

    // Formule: Wallet Final = Wallet Actuel + Montant Transféré + Commissions/Frais
    newWalletBalance = currentWalletBalance + amount + operatorCommission;
    walletImpact = +(amount + operatorCommission);

    // Honoraire Net = Commissions / Frais Reçus dans le Wallet
    netHonorarium = operatorCommission;
  }

  // Conversion de l'honoraire en devise de base si nécessaire
  const isBaseCurrency = transactionCurrency === baseCurrency;
  const netHonorariumBaseCurrency = isBaseCurrency
    ? netHonorarium
    : netHonorarium * exchangeRate;

  return {
    newCashBalance,
    newWalletBalance,
    cashImpact,
    walletImpact,
    netHonorarium,
    netHonorariumBaseCurrency
  };
}

/**
 * Crée une transaction Mobile Money avec tous les calculs automatiques
 */
export function createMobileMoneyTransaction(
  params: {
    service: MobileMoneyService;
    type: TransactionType;
    amount: number;
    currency: CurrencyCode;
    clientFee: number;
    operatorCommission: number;
    currentCashBalance: number;
    currentWalletBalance: number;
    exchangeRate: number;
    baseCurrency: CurrencyCode;
  }
): MobileMoneyTransaction {
  const impacts = calculateMobileMoneyImpacts({
    type: params.type,
    amount: params.amount,
    clientFee: params.clientFee,
    operatorCommission: params.operatorCommission,
    currentCashBalance: params.currentCashBalance,
    currentWalletBalance: params.currentWalletBalance,
    exchangeRate: params.exchangeRate,
    baseCurrency: params.baseCurrency,
    transactionCurrency: params.currency
  });

  return {
    id: `MM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    date: new Date().toISOString(),
    service: params.service,
    type: params.type,
    amount: params.amount,
    currency: params.currency,
    clientFee: params.clientFee,
    operatorCommission: params.operatorCommission,
    cashImpact: impacts.cashImpact,
    walletImpact: impacts.walletImpact,
    netHonorarium: impacts.netHonorarium,
    netHonorariumBaseCurrency: impacts.netHonorariumBaseCurrency,
    exchangeRate: params.exchangeRate,
    baseCurrency: params.baseCurrency
  };
}

// ============================================================================
// GESTION DES GRILLES DE COMMISSIONS
// ============================================================================

/**
 * Calcule la commission estimative basée sur la grille configurée
 */
export function calculateEstimatedCommission(
  amount: number,
  grid: CommissionGrid,
  type: TransactionType
): number {
  const rate = type === 'DEPOT' ? grid.depositRate : grid.withdrawalRate;
  return amount * (rate / 100);
}

/**
 * Calcule les frais client basés sur la grille
 */
export function calculateClientFee(
  amount: number,
  grid: CommissionGrid
): number {
  const fixedFee = grid.clientFeeFixed;
  const percentFee = amount * (grid.clientFeePercent / 100);
  return fixedFee + percentFee;
}

// ============================================================================
// RÉCONCILIATION DE FIN DE JOURNÉE
// ============================================================================

/**
 * Traite la réconciliation de fin de journée pour un service donné
 * L'agent déclare le montant réel de commission reçu de l'opérateur
 * Le système ajuste le solde du wallet et recalcule les honoraires nets
 */
export function processDailyReconciliation(
  params: {
    date: string;
    service: MobileMoneyService;
    declaredCommission: number; // Commission réelle déclarée par l'agent
    systemCommission: number; // Commission calculée par le système durant la journée
    currentWalletBalance: number;
  }
): DailyReconciliation {
  const {
    date,
    service,
    declaredCommission,
    systemCommission,
    currentWalletBalance
  } = params;

  // Calcul de l'ajustement (Différence entre réel et système)
  const adjustment = declaredCommission - systemCommission;

  // Ajustement du solde du wallet
  // Si declaredCommission > systemCommission: on ajoute la différence au wallet
  // Si declaredCommission < systemCommission: on retire la différence du wallet
  const adjustedWalletBalance = currentWalletBalance + adjustment;

  return {
    date,
    service,
    declaredCommission,
    systemCommission,
    adjustment,
    adjustedWalletBalance
  };
}

/**
 * Recalcule le total des honoraires nets après réconciliation
 * Cette fonction doit être appelée après toutes les réconciliations de la journée
 */
export function recalculateTotalHonorariums(
  transactions: MobileMoneyTransaction[],
  reconciliations: DailyReconciliation[]
): number {
  // Somme des honoraires nets de toutes les transactions
  let totalFromTransactions = transactions.reduce(
    (sum, tx) => sum + tx.netHonorariumBaseCurrency,
    0
  );

  // Ajustement basé sur les réconciliations
  // Si la commission déclarée est différente de celle du système,
  // on ajuste le total des honoraires
  const totalAdjustment = reconciliations.reduce(
    (sum, rec) => sum + rec.adjustment,
    0
  );

  return totalFromTransactions + totalAdjustment;
}

// ============================================================================
// GÉNÉRATION D'ÉCRITURES COMPTABLES (ISOLEMENT DES HONORAIRES)
// ============================================================================

/**
 * Génère les écritures comptables pour une transaction Mobile Money
 * 
 * RÈGLE CRITIQUE:
 * - Les mouvements de trésorerie (Cash ↔ Wallet) NE SONT PAS des ventes/achats
 * - Ce sont des virements internes de trésorerie
 * - SEULS les "Honoraires Nets Encaissés" sont injectés dans le Compte de Résultat
 */
export function generateAccountingEntries(
  transaction: MobileMoneyTransaction
): {
  entries: Array<{
    account: string;
    label: string;
    debit: number;
    credit: number;
    type: 'ASSET_TRANSFER' | 'REVENUE';
  }>;
  revenueEntry: {
    account: string;
    label: string;
    amount: number;
    currency: CurrencyCode;
  } | null;
} {
  const entries: Array<{
    account: string;
    label: string;
    debit: number;
    credit: number;
    type: 'ASSET_TRANSFER' | 'REVENUE';
  }> = [];

  // Écriture 1: Mouvement de trésorerie (Virement interne - Hors Compte de Résultat)
  if (transaction.type === 'DEPOT') {
    // Dépôt: Cash augmente, Wallet diminue
    entries.push({
      account: '53-CASH',
      label: `Caisse Cash - ${transaction.service} Dépôt`,
      debit: Math.abs(transaction.cashImpact),
      credit: 0,
      type: 'ASSET_TRANSFER'
    });
    
    entries.push({
      account: '58-WALLET',
      label: `Wallet ${transaction.service} - Sortie`,
      debit: 0,
      credit: Math.abs(transaction.walletImpact > 0 ? transaction.walletImpact : -transaction.walletImpact),
      type: 'ASSET_TRANSFER'
    });
  } else {
    // Retrait: Cash diminue, Wallet augmente
    entries.push({
      account: '58-WALLET',
      label: `Wallet ${transaction.service} - Entrée`,
      debit: Math.abs(transaction.walletImpact),
      credit: 0,
      type: 'ASSET_TRANSFER'
    });
    
    entries.push({
      account: '53-CASH',
      label: `Caisse Cash - ${transaction.service} Retrait`,
      debit: 0,
      credit: Math.abs(transaction.cashImpact),
      type: 'ASSET_TRANSFER'
    });
  }

  // Écriture 2: Revenu d'honoraires (SEUL élément injecté au Compte de Résultat)
  let revenueEntry: {
    account: string;
    label: string;
    amount: number;
    currency: CurrencyCode;
  } | null = null;

  if (transaction.netHonorariumBaseCurrency > 0) {
    revenueEntry = {
      account: '706-HONORAIRES',
      label: `Honoraires & Commissions - ${transaction.service} (${transaction.type})`,
      amount: transaction.netHonorariumBaseCurrency,
      currency: transaction.baseCurrency
    };
  }

  return { entries, revenueEntry };
}

// ============================================================================
// TABLEAU DE BORD ET RAPPORTS
// ============================================================================

/**
 * Calcule le tableau de bord complet Mobile Money
 */
export function calculateMobileMoneyDashboard(
  params: {
    initialCashBoxes: Record<CurrencyCode, number>;
    initialWallets: Record<MobileMoneyService, { balance: number; currency: CurrencyCode }>;
    transactions: MobileMoneyTransaction[];
    reconciliations: DailyReconciliation[];
    exchangeRates: Record<CurrencyCode, number>;
    baseCurrency: CurrencyCode;
  }
): MobileMoneyDashboard {
  const {
    initialCashBoxes,
    initialWallets,
    transactions,
    reconciliations,
    exchangeRates,
    baseCurrency
  } = params;

  // Initialisation des soldes
  const cashBoxes = { ...initialCashBoxes };
  const wallets: Record<MobileMoneyService, number> = {};
  
  Object.entries(initialWallets).forEach(([service, wallet]) => {
    wallets[service as MobileMoneyService] = wallet.balance;
  });

  // Application des transactions
  let totalDeposits = 0;
  let totalWithdrawals = 0;
  let totalHonorariums = 0;
  let totalHonorariumsBaseCurrency = 0;

  transactions.forEach(tx => {
    // Mise à jour des soldes
    const cashKey = tx.currency as CurrencyCode;
    
    if (!cashBoxes[cashKey]) {
      cashBoxes[cashKey] = 0;
    }
    
    // Note: Les impacts sont déjà calculés dans la transaction
    // On utilise directement les valeurs de cashImpact et walletImpact
    cashBoxes[cashKey] = cashBoxes[cashKey] !== undefined 
      ? cashBoxes[cashKey] + tx.cashImpact 
      : tx.cashImpact;

    if (wallets[tx.service] !== undefined) {
      wallets[tx.service] += tx.walletImpact;
    } else {
      wallets[tx.service] = tx.walletImpact;
    }

    // Totaux
    if (tx.type === 'DEPOT') {
      totalDeposits += tx.amount;
    } else {
      totalWithdrawals += tx.amount;
    }

    totalHonorariums += tx.netHonorarium;
    totalHonorariumsBaseCurrency += tx.netHonorariumBaseCurrency;
  });

  // Application des réconciliations
  reconciliations.forEach(rec => {
    if (wallets[rec.service] !== undefined) {
      // Ajustement du wallet avec la différence
      const adjustment = rec.declaredCommission - rec.systemCommission;
      wallets[rec.service] += adjustment;
    }
  });

  // Recalcul final des honoraires avec réconciliations
  const finalHonorariums = recalculateTotalHonorariums(transactions, reconciliations);

  return {
    cashBoxes,
    wallets,
    totalDeposits,
    totalWithdrawals,
    totalHonorariums,
    totalHonorariumsBaseCurrency: finalHonorariums,
    transactions,
    reconciliations
  };
}

/**
 * Valide les formules de calcul avec les exemples fournis
 */
export function validateCalculations(): boolean {
  // TEST 1: DÉPÔT
  // Données: Cash=100G, Wallet=100G | Dépôt=25G, Frais=5G, Commission=2G
  // Attendu: Cash=130G, Wallet=77G, Honoraire=7G
  const depositTest = calculateMobileMoneyImpacts({
    type: 'DEPOT',
    amount: 25,
    clientFee: 5,
    operatorCommission: 2,
    currentCashBalance: 100,
    currentWalletBalance: 100,
    exchangeRate: 1,
    baseCurrency: 'HTG',
    transactionCurrency: 'HTG'
  });

  const depositValid = 
    depositTest.newCashBalance === 130 &&
    depositTest.newWalletBalance === 77 &&
    depositTest.netHonorarium === 7;

  // TEST 2: RETRAIT
  // Données: Cash=100G, Wallet=100G | Retrait=25G, Commission=7G
  // Attendu: Cash=75G, Wallet=132G, Honoraire=7G
  const withdrawalTest = calculateMobileMoneyImpacts({
    type: 'RETRAIT',
    amount: 25,
    clientFee: 0,
    operatorCommission: 7,
    currentCashBalance: 100,
    currentWalletBalance: 100,
    exchangeRate: 1,
    baseCurrency: 'HTG',
    transactionCurrency: 'HTG'
  });

  const withdrawalValid = 
    withdrawalTest.newCashBalance === 75 &&
    withdrawalTest.newWalletBalance === 132 &&
    withdrawalTest.netHonorarium === 7;

  return depositValid && withdrawalValid;
}

