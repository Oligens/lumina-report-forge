import { useState, useEffect, useCallback } from 'react';
import type { UserRole, UserPermission, InvitationToken, CompanyMember } from '@/types/report';
import {
  getCurrentUserRole,
  getCurrentCompanyId,
  checkPermission,
  getCurrentUserPermissions,
  getCompanyMembers,
  getAllTokens,
  formatRoleForDisplay,
} from '@/lib/rbac';

/**
 * Hook personnalisé pour gérer l'état RBAC de l'utilisateur courant
 */
export function useRBAC() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<UserPermission | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Charger le rôle et l'entreprise au montage
    const userRole = getCurrentUserRole();
    const currentCompanyId = getCurrentCompanyId();
    
    setRole(userRole);
    setCompanyId(currentCompanyId);
    
    if (userRole) {
      const perms = getCurrentUserPermissions();
      setPermissions(perms);
    }
    
    setIsLoading(false);
  }, []);

  const hasPermission = useCallback((permission: keyof UserPermission): boolean => {
    return checkPermission(permission);
  }, []);

  const canAccessStudio = hasPermission('canAccessStudio');
  const canWriteTransactions = hasPermission('canWriteTransactions');
  const canModifySettings = hasPermission('canModifyCompanySettings');
  const canGenerateTokens = hasPermission('canGenerateTokens');
  const canInviteUsers = hasPermission('canInviteUsers');
  const canExportData = hasPermission('canExportData');
  const canUseVoiceDictation = hasPermission('canUseVoiceDictation');
  const canUseOCR = hasPermission('canUseOCR');

  return {
    role,
    companyId,
    permissions,
    isLoading,
    isAuthenticated: role !== null,
    hasPermission,
    canAccessStudio,
    canWriteTransactions,
    canModifySettings,
    canGenerateTokens,
    canInviteUsers,
    canExportData,
    canUseVoiceDictation,
    canUseOCR,
    isSuperAdmin: role === 'SUPER_ADMIN',
    isSaisisseur: role === 'COMPTABLE_SAISIEUR',
    isLectureSeule: role === 'LECTURE_SEULE',
    roleDisplayName: role ? formatRoleForDisplay(role) : '',
  };
}

/**
 * Hook pour gérer les membres d'une entreprise
 */
export function useCompanyMembers(companyId?: string) {
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentCompanyId = getCurrentCompanyId();
  const targetCompanyId = companyId || currentCompanyId;

  useEffect(() => {
    if (targetCompanyId) {
      const companyMembers = getCompanyMembers(targetCompanyId);
      setMembers(companyMembers);
    }
    setIsLoading(false);
  }, [targetCompanyId]);

  return { members, isLoading };
}

/**
 * Hook pour gérer les tokens d'invitation
 */
export function useInvitationTokens() {
  const [tokens, setTokens] = useState<InvitationToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const allTokens = getAllTokens();
    setTokens(allTokens);
    setIsLoading(false);
  }, []);

  const refreshTokens = useCallback(() => {
    const allTokens = getAllTokens();
    setTokens(allTokens);
  }, []);

  return { tokens, isLoading, refreshTokens };
}
