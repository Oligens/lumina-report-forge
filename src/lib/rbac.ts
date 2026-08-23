/**
 * RBAC - Système de Gestion des Accès Multi-Utilisateurs par Tokens d'Invitation
 * ScarWrite Rapport - Headless Accounting System
 */

import { v4 as uuidv4 } from 'uuid';
import type { UserRole, UserPermission, InvitationToken, CompanyMember } from '@/types/report';
import { ROLE_PERMISSIONS } from '@/types/report';

const TOKENS_STORAGE_KEY = 'scarwrite_invitation_tokens';
const MEMBERS_STORAGE_KEY = 'scarwrite_company_members';
const CURRENT_USER_KEY = 'scarwrite_current_user_role';
const CURRENT_COMPANY_KEY = 'scarwrite_current_company_id';
const DEFAULT_COMPANY_ID = 'default-company';

export function generateInvitationToken(companyId: string, roleName: UserRole, createdBy: string, expiresAt?: string, maxUses?: number): InvitationToken {
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  const token = `SCAR-TOKEN-${randomPart}-${roleName}`;
  const newToken: InvitationToken = { id: uuidv4(), token, companyId, roleName, createdBy, createdAt: new Date().toISOString(), expiresAt, maxUses, currentUses: 0, isActive: true };
  const tokens = getAllTokens();
  tokens.push(newToken);
  localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(tokens));
  return newToken;
}

export function getAllTokens(): InvitationToken[] {
  const stored = localStorage.getItem(TOKENS_STORAGE_KEY);
  if (!stored) return [];
  return JSON.parse(stored);
}

export function validateAndUseToken(tokenCode: string): { success: boolean; role: UserRole; companyId: string; error?: string } | null {
  const tokens = getAllTokens();
  const tokenIndex = tokens.findIndex(t => t.token === tokenCode);
  if (tokenIndex === -1) return { success: false, role: 'LECTURE_SEULE', companyId: '', error: 'Token invalide' };
  const token = tokens[tokenIndex];
  if (!token.isActive) return { success: false, role: 'LECTURE_SEULE', companyId: '', error: 'Token désactivé' };
  if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
    token.isActive = false;
    tokens[tokenIndex] = token;
    localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(tokens));
    return { success: false, role: 'LECTURE_SEULE', companyId: '', error: 'Token expiré' };
  }
  if (token.maxUses && token.currentUses >= token.maxUses) {
    token.isActive = false;
    tokens[tokenIndex] = token;
    localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(tokens));
    return { success: false, role: 'LECTURE_SEULE', companyId: '', error: "Token a atteint le nombre maximal d'utilisations" };
  }
  token.currentUses += 1;
  tokens[tokenIndex] = token;
  localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(tokens));
  return { success: true, role: token.roleName, companyId: token.companyId };
}

export function revokeToken(tokenId: string): boolean {
  const tokens = getAllTokens();
  const tokenIndex = tokens.findIndex(t => t.id === tokenId);
  if (tokenIndex === -1) return false;
  tokens[tokenIndex].isActive = false;
  localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(tokens));
  return true;
}

export function addCompanyMember(member: Omit<CompanyMember, 'id' | 'joinedAt'>): CompanyMember {
  const members = getAllMembers();
  const newMember: CompanyMember = { ...member, id: uuidv4(), joinedAt: new Date().toISOString() };
  members.push(newMember);
  localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(members));
  return newMember;
}

export function getCompanyMembers(companyId: string): CompanyMember[] {
  return getAllMembers().filter(m => m.companyId === companyId);
}

export function getAllMembers(): CompanyMember[] {
  const stored = localStorage.getItem(MEMBERS_STORAGE_KEY);
  if (!stored) return [];
  return JSON.parse(stored);
}

export function updateMemberRole(memberId: string, newRole: UserRole): boolean {
  const members = getAllMembers();
  const memberIndex = members.findIndex(m => m.id === memberId);
  if (memberIndex === -1) return false;
  members[memberIndex].role = newRole;
  localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(members));
  return true;
}

export function removeCompanyMember(memberId: string): boolean {
  const members = getAllMembers();
  const filtered = members.filter(m => m.id !== memberId);
  if (filtered.length === members.length) return false;
  localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

export function setCurrentUserRole(role: UserRole, companyId: string): void {
  localStorage.setItem(CURRENT_USER_KEY, role);
  localStorage.setItem(CURRENT_COMPANY_KEY, companyId);
}

/**
 * Studio local : SUPER_ADMIN est le rôle effectif par défaut et force l'accès complet.
 * Cela neutralise les anciens rôles LECTURE_SEULE stockés localement qui pouvaient
 * maintenir l'interface en mode lecture seule après une mise à jour de l'application.
 */
export function getCurrentUserRole(): UserRole {
  localStorage.setItem(CURRENT_USER_KEY, 'SUPER_ADMIN');
  if (!localStorage.getItem(CURRENT_COMPANY_KEY)) localStorage.setItem(CURRENT_COMPANY_KEY, DEFAULT_COMPANY_ID);
  return 'SUPER_ADMIN';
}

export function getCurrentCompanyId(): string {
  const companyId = localStorage.getItem(CURRENT_COMPANY_KEY);
  if (companyId) return companyId;
  localStorage.setItem(CURRENT_COMPANY_KEY, DEFAULT_COMPANY_ID);
  return DEFAULT_COMPANY_ID;
}

export function logoutCurrentUser(): void {
  localStorage.removeItem(CURRENT_USER_KEY);
  localStorage.removeItem(CURRENT_COMPANY_KEY);
}

export function checkPermission(permission: keyof UserPermission): boolean {
  const role = getCurrentUserRole();
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions[permission] || false : false;
}

export function getCurrentUserPermissions(): UserPermission | null {
  const role = getCurrentUserRole();
  return ROLE_PERMISSIONS[role] ?? null;
}

export function formatRoleForDisplay(role: UserRole): string {
  switch (role) {
    case 'SUPER_ADMIN': return 'Administrateur';
    case 'COMPTABLE_SAISIEUR': return 'Saisisseur';
    case 'LECTURE_SEULE': return 'Lecture Seule';
    default: return role;
  }
}

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

export function initializeRBACForCompany(companyId: string, ownerId: string, ownerEmail: string): void {
  addCompanyMember({ userId: ownerId, companyId, email: ownerEmail, displayName: 'Propriétaire', role: 'SUPER_ADMIN' });
  setCurrentUserRole('SUPER_ADMIN', companyId);
}
