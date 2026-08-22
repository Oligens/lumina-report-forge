/**
 * RBAC - Système de Gestion des Accès Multi-Utilisateurs par Tokens d'Invitation
 * ScarWrite Rapport - Headless Accounting System
 */

import { v4 as uuidv4 } from 'uuid';
import type { UserRole, UserPermission, InvitationToken, CompanyMember, CompanyProfile } from '@/types/report';
import { ROLE_PERMISSIONS } from '@/types/report';

// Stockage local pour les tokens et membres (simulation backend)
const TOKENS_STORAGE_KEY = 'scarwrite_invitation_tokens';
const MEMBERS_STORAGE_KEY = 'scarwrite_company_members';
const CURRENT_USER_KEY = 'scarwrite_current_user_role';
const CURRENT_COMPANY_KEY = 'scarwrite_current_company_id';

/**
 * Génère un token d'invitation sécurisé
 * Format: SCAR-TOKEN-XXXX-ROLE
 */
export function generateInvitationToken(
  companyId: string,
  roleName: UserRole,
  createdBy: string,
  expiresAt?: string,
  maxUses?: number
): InvitationToken {
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  const token = `SCAR-TOKEN-${randomPart}-${roleName}`;
  
  const newToken: InvitationToken = {
    id: uuidv4(),
    token,
    companyId,
    roleName,
    createdBy,
    createdAt: new Date().toISOString(),
    expiresAt,
    maxUses,
    currentUses: 0,
    isActive: true,
  };
  
  // Sauvegarder dans le localStorage
  const tokens = getAllTokens();
  tokens.push(newToken);
  localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(tokens));
  
  return newToken;
}

/**
 * Récupère tous les tokens stockés
 */
export function getAllTokens(): InvitationToken[] {
  const stored = localStorage.getItem(TOKENS_STORAGE_KEY);
  if (!stored) return [];
  return JSON.parse(stored);
}

/**
 * Valide et utilise un token d'invitation
 * Retourne null si le token est invalide ou expiré
 */
export function validateAndUseToken(tokenCode: string): { success: boolean; role: UserRole; companyId: string; error?: string } | null {
  const tokens = getAllTokens();
  const tokenIndex = tokens.findIndex(t => t.token === tokenCode);
  
  if (tokenIndex === -1) {
    return { success: false, role: 'LECTURE_SEULE', companyId: '', error: 'Token invalide' };
  }
  
  const token = tokens[tokenIndex];
  
  // Vérifier si le token est actif
  if (!token.isActive) {
    return { success: false, role: 'LECTURE_SEULE', companyId: '', error: 'Token désactivé' };
  }
  
  // Vérifier l'expiration
  if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
    token.isActive = false;
    tokens[tokenIndex] = token;
    localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(tokens));
    return { success: false, role: 'LECTURE_SEULE', companyId: '', error: 'Token expiré' };
  }
  
  // Vérifier le nombre maximal d'utilisations
  if (token.maxUses && token.currentUses >= token.maxUses) {
    token.isActive = false;
    tokens[tokenIndex] = token;
    localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(tokens));
    return { success: false, role: 'LECTURE_SEULE', companyId: '', error: 'Token a atteint le nombre maximal d\'utilisations' };
  }
  
  // Incrémenter le compteur d'utilisations
  token.currentUses += 1;
  tokens[tokenIndex] = token;
  localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(tokens));
  
  return {
    success: true,
    role: token.roleName,
    companyId: token.companyId,
  };
}

/**
 * Révoque un token d'invitation
 */
export function revokeToken(tokenId: string): boolean {
  const tokens = getAllTokens();
  const tokenIndex = tokens.findIndex(t => t.id === tokenId);
  
  if (tokenIndex === -1) return false;
  
  tokens[tokenIndex].isActive = false;
  localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(tokens));
  return true;
}

/**
 * Gère les membres de l'entreprise
 */
export function addCompanyMember(member: Omit<CompanyMember, 'id' | 'joinedAt'>): CompanyMember {
  const members = getAllMembers();
  const newMember: CompanyMember = {
    ...member,
    id: uuidv4(),
    joinedAt: new Date().toISOString(),
  };
  
  members.push(newMember);
  localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(members));
  return newMember;
}

/**
 * Récupère tous les membres d'une entreprise
 */
export function getCompanyMembers(companyId: string): CompanyMember[] {
  const members = getAllMembers();
  return members.filter(m => m.companyId === companyId);
}

/**
 * Récupère tous les membres stockés
 */
export function getAllMembers(): CompanyMember[] {
  const stored = localStorage.getItem(MEMBERS_STORAGE_KEY);
  if (!stored) return [];
  return JSON.parse(stored);
}

/**
 * Met à jour le rôle d'un membre
 */
export function updateMemberRole(memberId: string, newRole: UserRole): boolean {
  const members = getAllMembers();
  const memberIndex = members.findIndex(m => m.id === memberId);
  
  if (memberIndex === -1) return false;
  
  members[memberIndex].role = newRole;
  localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(members));
  return true;
}

/**
 * Supprime un membre de l'entreprise
 */
export function removeCompanyMember(memberId: string): boolean {
  const members = getAllMembers();
  const filtered = members.filter(m => m.id !== memberId);
  
  if (filtered.length === members.length) return false;
  
  localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

/**
 * Définit le rôle actuel de l'utilisateur connecté
 */
export function setCurrentUserRole(role: UserRole, companyId: string): void {
  localStorage.setItem(CURRENT_USER_KEY, role);
  localStorage.setItem(CURRENT_COMPANY_KEY, companyId);
}

/**
 * Récupère le rôle actuel de l'utilisateur
 */
export function getCurrentUserRole(): UserRole | null {
  const role = localStorage.getItem(CURRENT_USER_KEY);
  return role ? (role as UserRole) : null;
}

/**
 * Récupère l'ID de l'entreprise actuelle
 */
export function getCurrentCompanyId(): string | null {
  return localStorage.getItem(CURRENT_COMPANY_KEY);
}

/**
 * Déconnecte l'utilisateur courant
 */
export function logoutCurrentUser(): void {
  localStorage.removeItem(CURRENT_USER_KEY);
  localStorage.removeItem(CURRENT_COMPANY_KEY);
}

/**
 * Vérifie les permissions de l'utilisateur actuel
 */
export function checkPermission(permission: keyof UserPermission): boolean {
  const role = getCurrentUserRole();
  if (!role) return false;
  
  const permissions = ROLE_PERMISSIONS[role];
  return permissions[permission] || false;
}

/**
 * Obtient toutes les permissions de l'utilisateur actuel
 */
export function getCurrentUserPermissions(): UserPermission | null {
  const role = getCurrentUserRole();
  if (!role) return null;
  
  return ROLE_PERMISSIONS[role];
}

/**
 * Formate le rôle pour affichage
 */
export function formatRoleForDisplay(role: UserRole): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'Administrateur';
    case 'COMPTABLE_SAISIEUR':
      return 'Saisisseur';
    case 'LECTURE_SEULE':
      return 'Lecture Seule';
    default:
      return role;
  }
}

/**
 * Nettoie les tokens expirés
 */
export function cleanupExpiredTokens(): void {
  const tokens = getAllTokens();
  const now = new Date();
  
  const activeTokens = tokens.filter(token => {
    if (!token.isActive) return false;
    if (token.expiresAt && new Date(token.expiresAt) < now) return false;
    if (token.maxUses && token.currentUses >= token.maxUses) return false;
    return true;
  });
  
  localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(activeTokens));
}

/**
 * Initialise le système RBAC pour une nouvelle entreprise
 */
export function initializeRBACForCompany(companyId: string, ownerId: string, ownerEmail: string): void {
  // Ajouter le propriétaire comme SUPER_ADMIN
  addCompanyMember({
    userId: ownerId,
    companyId,
    email: ownerEmail,
    displayName: 'Propriétaire',
    role: 'SUPER_ADMIN',
  });
  
  // Définir le rôle actuel
  setCurrentUserRole('SUPER_ADMIN', companyId);
}
