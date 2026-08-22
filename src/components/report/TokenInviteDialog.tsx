import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Key, Copy, Check, Trash2, Shield, User, Eye, Calendar, Clock } from "lucide-react";
import type { UserRole, InvitationToken, CompanyMember } from "@/types/report";
import { useRBAC, useCompanyMembers, useInvitationTokens } from "@/hooks/useRBAC";
import {
  generateInvitationToken,
  validateAndUseToken,
  revokeToken,
  removeCompanyMember,
  updateMemberRole,
  setCurrentUserRole,
  formatRoleForDisplay,
} from "@/lib/rbac";
import { getCurrentCompanyId } from "@/lib/rbac";

interface TokenInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTokenJoined?: (role: UserRole) => void;
}

export function TokenInviteDialog({ open, onOpenChange, onTokenJoined }: TokenInviteDialogProps) {
  const { isSuperAdmin, canGenerateTokens, roleDisplayName } = useRBAC();
  const { members } = useCompanyMembers();
  const { tokens, refreshTokens } = useInvitationTokens();
  
  const [selectedRole, setSelectedRole] = useState<UserRole>("COMPTABLE_SAISIEUR");
  const [expiresInDays, setExpiresInDays] = useState<string>("30");
  const [maxUses, setMaxUses] = useState<string>("5");
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [joinTokenInput, setJoinTokenInput] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateToken = () => {
    const companyId = getCurrentCompanyId() || "default-company";
    const expiresAt = expiresInDays ? new Date(Date.now() + parseInt(expiresInDays) * 24 * 60 * 60 * 1000).toISOString() : undefined;
    const maxUsesNum = maxUses ? parseInt(maxUses) : undefined;
    
    const token = generateInvitationToken(
      companyId,
      selectedRole,
      "admin-user",
      expiresAt,
      maxUsesNum
    );
    
    setGeneratedToken(token.token);
    refreshTokens();
  };

  const handleCopyToken = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoinWithToken = () => {
    const result = validateAndUseToken(joinTokenInput.trim());
    
    if (result && result.success) {
      setCurrentUserRole(result.role, result.companyId);
      setJoinError(null);
      onTokenJoined?.(result.role);
      onOpenChange(false);
      setJoinTokenInput("");
    } else {
      setJoinError(result?.error || "Token invalide");
    }
  };

  const handleRevokeToken = (tokenId: string) => {
    revokeToken(tokenId);
    refreshTokens();
  };

  const handleUpdateMemberRole = (memberId: string, newRole: UserRole) => {
    updateMemberRole(memberId, newRole);
  };

  const handleRemoveMember = (memberId: string) => {
    removeCompanyMember(memberId);
  };

  const activeTokens = tokens.filter(t => t.isActive);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-royal">
            Gestion de l'Équipe & Accès
          </DialogTitle>
          <DialogDescription>
            Gérez les membres de votre entreprise et générez des tokens d'invitation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Section 1: Rejoindre avec un token */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Key className="size-5 text-gold-deep" />
                <h3 className="font-semibold text-royal">Rejoindre une Entreprise via Token</h3>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Collez votre token SCAR-TOKEN-XXXX-ROLE"
                  value={joinTokenInput}
                  onChange={(e) => setJoinTokenInput(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleJoinWithToken} className="bg-gradient-gold text-white hover:brightness-110">
                  Rejoindre
                </Button>
              </div>
              {joinError && (
                <p className="mt-2 text-sm text-destructive">{joinError}</p>
              )}
            </CardContent>
          </Card>

          {/* Section 2: Générer un token (Admin seulement) */}
          {isSuperAdmin && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="size-5 text-gold-deep" />
                  <h3 className="font-semibold text-royal">Générer un Token d'Invitation</h3>
                  <Badge variant="outline" className="ml-auto">Admin Only</Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label>Rôle à attribuer</Label>
                    <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COMPTABLE_SAISIEUR">Saisisseur (Accès Écriture)</SelectItem>
                        <SelectItem value="LECTURE_SEULE">Lecture Seule (Auditeur)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Expiration (jours)</Label>
                    <Input
                      type="number"
                      value={expiresInDays}
                      onChange={(e) => setExpiresInDays(e.target.value)}
                      min="1"
                      max="365"
                    />
                  </div>
                  
                  <div>
                    <Label>Nombre maximal d'utilisations</Label>
                    <Input
                      type="number"
                      value={maxUses}
                      onChange={(e) => setMaxUses(e.target.value)}
                      min="1"
                      max="100"
                    />
                  </div>
                </div>

                <Button onClick={handleGenerateToken} className="w-full bg-gradient-gold text-white hover:brightness-110">
                  <Key className="size-4 mr-2" />
                  Générer un Token d'Accès
                </Button>

                {generatedToken && (
                  <div className="mt-4 p-4 rounded-lg border border-gold/30 bg-gradient-gold/5">
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-sm font-mono text-gold-deep">{generatedToken}</code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopyToken}
                        className="border-gold/30 text-gold-deep hover:bg-gold/10"
                      >
                        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                      </Button>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Copiez ce token et partagez-le avec le collaborateur à inviter.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Section 3: Tokens actifs */}
          {isSuperAdmin && activeTokens.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="size-5 text-royal" />
                  <h3 className="font-semibold text-royal">Tokens Actifs</h3>
                </div>
                
                <div className="space-y-2">
                  {activeTokens.map((token) => (
                    <div
                      key={token.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-royal/15 bg-white/50"
                    >
                      <div className="flex-1">
                        <p className="font-mono text-sm text-royal">{token.token}</p>
                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="size-3" />
                            {formatRoleForDisplay(token.roleName)}
                          </span>
                          {token.expiresAt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="size-3" />
                              Expire: {new Date(token.expiresAt).toLocaleDateString()}
                            </span>
                          )}
                          {token.maxUses && (
                            <span className="flex items-center gap-1">
                              <Key className="size-3" />
                              {token.currentUses}/{token.maxUses} utilisations
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRevokeToken(token.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section 4: Membres de l'entreprise */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="size-5 text-royal" />
                <h3 className="font-semibold text-royal">Membres de l'Entreprise</h3>
              </div>
              
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-royal/15 bg-white/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-royal/10 p-2">
                        <User className="size-4 text-royal" />
                      </div>
                      <div>
                        <p className="font-medium text-royal">{member.displayName}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={member.role === "SUPER_ADMIN" ? "default" : "outline"}
                        className={
                          member.role === "SUPER_ADMIN"
                            ? "bg-gold-deep text-white"
                            : member.role === "COMPTABLE_SAISIEUR"
                              ? "border-gold/30 text-gold-deep"
                              : "border-muted/30 text-muted-foreground"
                        }
                      >
                        {formatRoleForDisplay(member.role)}
                      </Badge>
                      
                      {isSuperAdmin && member.role !== "SUPER_ADMIN" && (
                        <>
                          <Select
                            value={member.role}
                            onValueChange={(v) => handleUpdateMemberRole(member.id, v as UserRole)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="COMPTABLE_SAISIEUR">Saisisseur</SelectItem>
                              <SelectItem value="LECTURE_SEULE">Lecture Seule</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                
                {members.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    Aucun membre pour le moment.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
