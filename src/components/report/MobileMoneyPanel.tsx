import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Settings,
  Download,
  AlertCircle,
  CheckCircle,
  ArrowUpDown,
  Phone,
  Globe,
} from "lucide-react";
import {
  loadMMSettings,
  saveMMSettings,
  loadMMTransactions,
  saveMMTransactions,
  loadMMAdjustments,
  saveMMAdjustments,
  loadMMCashCounts,
  saveMMCashCounts,
  computeMMRows,
  formatBase,
  estimateCommission,
  DEFAULT_MM_SETTINGS,
} from "@/lib/mobileMoney";
import type { MMTransaction, MMAdjustment, MMCashCount, MMSettings } from "@/types/mobileMoney";
import { MM_SERVICES, type MMService, type MMOperation } from "@/types/mobileMoney";
import { useRBAC } from "@/hooks/useRBAC";

export function MobileMoneyPanel() {
  const { userRole } = useRBAC();
  const canEdit = userRole !== "LECTURE_SEULE";

  const [settings, setSettings] = useState<MMSettings>(() => loadMMSettings());
  const [transactions, setTransactions] = useState<MMTransaction[]>(() =>
    loadMMTransactions(),
  );
  const [adjustments, setAdjustments] = useState<MMAdjustment[]>(() =>
    loadMMAdjustments(),
  );
  const [cashCounts, setCashCounts] = useState<MMCashCount[]>(() => loadMMCashCounts());

  // Formulaire nouvelle transaction
  const [newTx, setNewTx] = useState<{
    date: string;
    service: MMService;
    operation: MMOperation;
    montant: string;
    frais_client: string;
    commission_operateur: string;
    currency: string;
    note: string;
  }>({
    date: new Date().toISOString().split("T")[0],
    service: "MonCash",
    operation: "DEPOT",
    montant: "",
    frais_client: "",
    commission_operateur: "",
    currency: settings.base_currency,
    note: "",
  });

  // Formulaire ajustement
  const [newAdjustment, setNewAdjustment] = useState<{
    date: string;
    service: MMService;
    commission_reelle: string;
    currency: string;
  }>({
    date: new Date().toISOString().split("T")[0],
    service: "MonCash",
    commission_reelle: "",
    currency: settings.base_currency,
  });

  // Formulaire comptage cash
  const [cashCount, setCashCount] = useState<{
    date: string;
    cash_reel: string;
  }>({
    date: new Date().toISOString().split("T")[0],
    cash_reel: "",
  });

  const { rows: computedRows, totals } = useMemo(
    () => computeMMRows(transactions, adjustments, settings),
    [transactions, adjustments, settings],
  );

  const handleAddTransaction = () => {
    if (!canEdit) return;
    
    const montantNum = parseFloat(newTx.montant) || 0;
    if (montantNum <= 0) return;

    let fraisClientNum = parseFloat(newTx.frais_client) || 0;
    let commissionOpNum = parseFloat(newTx.commission_operateur) || 0;

    // Estimation auto si commission vide
    if (commissionOpNum === 0 && newTx.operation === "DEPOT") {
      commissionOpNum = estimateCommission(montantNum, settings);
    }

    const tx: MMTransaction = {
      id: crypto.randomUUID(),
      date: newTx.date,
      service: newTx.service,
      operation: newTx.operation,
      montant: montantNum,
      frais_client: fraisClientNum,
      commission_operateur: commissionOpNum,
      commission_estimee: commissionOpNum > 0 && parseFloat(newTx.commission_operateur) === 0,
      currency: newTx.currency as any,
      note: newTx.note || undefined,
      created_at: new Date().toISOString(),
    };

    const updated = [...transactions, tx];
    setTransactions(updated);
    saveMMTransactions(updated);

    // Reset partiel
    setNewTx((prev) => ({
      ...prev,
      montant: "",
      frais_client: "",
      commission_operateur: "",
      note: "",
    }));
  };

  const handleAddAdjustment = () => {
    if (!canEdit) return;

    const commissionReelle = parseFloat(newAdjustment.commission_reelle) || 0;
    if (commissionReelle <= 0) return;

    const adj: MMAdjustment = {
      id: crypto.randomUUID(),
      date: newAdjustment.date,
      service: newAdjustment.service,
      commission_reelle: commissionReelle,
      currency: newAdjustment.currency as any,
      created_at: new Date().toISOString(),
    };

    const updated = [...adjustments, adj];
    setAdjustments(updated);
    saveMMAdjustments(updated);

    setNewAdjustment((prev) => ({
      ...prev,
      commission_reelle: "",
    }));
  };

  const handleCashCount = () => {
    const cashReel = parseFloat(cashCount.cash_reel) || 0;
    if (cashReel <= 0) return;

    const count: MMCashCount = {
      date: cashCount.date,
      cash_reel: cashReel,
    };

    const updated = [...cashCounts, count];
    setCashCounts(updated);
    saveMMCashCounts(updated);

    setCashCount((prev) => ({
      ...prev,
      cash_reel: "",
    }));
  };

  const handleUpdateSettings = (updated: MMSettings) => {
    setSettings(updated);
    saveMMSettings(updated);
  };

  const latestCashCount = cashCounts.length > 0 ? cashCounts[cashCounts.length - 1] : null;
  const ecartCaisse = latestCashCount ? latestCashCount.cash_reel - totals.cashActive : 0;

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif text-[#0B1E48]">
            Mobile Money & Transferts Internationaux
          </h2>
          <p className="text-sm text-muted-foreground">
            MonCash • Natcash • Western Union • MoneyGram • Ria • CAM Transfer
          </p>
        </div>
        <div className="flex gap-2">
          <MobileMoneySettingsDialog
            settings={settings}
            onUpdate={handleUpdateSettings}
          />
          <Button
            variant="outline"
            className="border-[#D4AF37] text-[#0B1E48] hover:bg-[#F3E5AB]"
            disabled={!canEdit}
          >
            <Download className="w-4 h-4 mr-2" />
            Rapport PDF
          </Button>
        </div>
      </div>

      {/* Cartes KPI */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-strong border-[#D4AF37]/25">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#0B1E48]">
              Caisse Cash (Physique)
            </CardTitle>
            <DollarSign className="w-4 h-4 text-[#D4AF37]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0B1E48]">
              {formatBase(totals.cashActive, settings)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Solde initial + Impacts Cash cumulés
            </p>
          </CardContent>
        </Card>

        <Card className="glass-strong border-[#D4AF37]/25">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#0B1E48]">
              Portefeuilles Numériques
            </CardTitle>
            <Wallet className="w-4 h-4 text-[#D4AF37]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0B1E48]">
              {formatBase(totals.walletActive, settings)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Solde initial + Impacts Wallet cumulés
            </p>
          </CardContent>
        </Card>

        <Card className="glass-strong border-[#D4AF37]/25 bg-gradient-to-br from-[#0B1E48] to-[#1A365D]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Honoraires & Commissions
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#F3E5AB]">
              {formatBase(totals.honorairesNets, settings)}
            </div>
            <p className="text-xs text-white/70 mt-1">
              Revenus nets convertis en {settings.base_currency}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-strong border-[#D4AF37]/25">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#0B1E48]">
              Volume Transactions
            </CardTitle>
            <ArrowUpDown className="w-4 h-4 text-[#D4AF37]" />
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-sm">
                <span className="text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Dépôts: {formatBase(totals.volumeDepots, settings)}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center mt-1">
              <div className="text-sm">
                <span className="text-red-600 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" />
                  Retraits: {formatBase(totals.volumeRetraits, settings)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assistant Écart de Caisse */}
      {latestCashCount && (
        <Card className={`glass-strong border-2 ${
          Math.abs(ecartCaisse) > 1000 
            ? "border-red-500" 
            : ecartCaisse !== 0 
              ? "border-yellow-500" 
              : "border-green-500"
        }`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#0B1E48]">
              <AlertCircle className={`w-5 h-5 ${
                Math.abs(ecartCaisse) > 1000 
                  ? "text-red-500" 
                  : ecartCaisse !== 0 
                    ? "text-yellow-500" 
                    : "text-green-500"
              }`} />
              Contrôle de Caisse - {latestCashCount.date}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Solde Théorique</p>
                <p className="text-lg font-bold text-[#0B1E48]">
                  {formatBase(totals.cashActive, settings)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Comptage Physique</p>
                <p className="text-lg font-bold text-[#0B1E48]">
                  {formatBase(latestCashCount.cash_reel, settings)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Écart</p>
                <p className={`text-lg font-bold ${
                  ecartCaisse > 0 
                    ? "text-green-600" 
                    : ecartCaisse < 0 
                      ? "text-red-600" 
                      : "text-green-600"
                }`}>
                  {ecartCaisse >= 0 ? "+" : ""}{formatBase(ecartCaisse, settings)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Onglets principaux */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList className="bg-white/50 backdrop-blur border border-[#D4AF37]/25">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="ajustements">Ajustements Commission</TabsTrigger>
          <TabsTrigger value="comptage">Comptage Caisse</TabsTrigger>
        </TabsList>

        {/* Onglet Transactions */}
        <TabsContent value="transactions" className="space-y-4">
          <Card className="glass-strong border-[#D4AF37]/25">
            <CardHeader>
              <CardTitle className="text-[#0B1E48]">Nouvelle Transaction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                <div className="col-span-1">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newTx.date}
                    onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
                    disabled={!canEdit}
                  />
                </div>
                <div className="col-span-1">
                  <Label>Service</Label>
                  <Select
                    value={newTx.service}
                    onValueChange={(v) => setNewTx({ ...newTx, service: v as MMService })}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MM_SERVICES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1">
                  <Label>Type</Label>
                  <Select
                    value={newTx.operation}
                    onValueChange={(v) => setNewTx({ ...newTx, operation: v as MMOperation })}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DEPOT">Dépôt / Envoi</SelectItem>
                      <SelectItem value="RETRAIT">Retrait / Réception</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1">
                  <Label>Devise</Label>
                  <Select
                    value={newTx.currency}
                    onValueChange={(v) => setNewTx({ ...newTx, currency: v })}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HTG">HTG 🇭🇹</SelectItem>
                      <SelectItem value="USD">USD 🇺🇸</SelectItem>
                      <SelectItem value="EUR">EUR 🇪🇺</SelectItem>
                      <SelectItem value="DOP">DOP 🇩🇴</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1">
                  <Label>Montant Client</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newTx.montant}
                    onChange={(e) => setNewTx({ ...newTx, montant: e.target.value })}
                    disabled={!canEdit}
                  />
                </div>
                <div className="col-span-1">
                  <Label>Frais Client (Cash)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newTx.frais_client}
                    onChange={(e) => setNewTx({ ...newTx, frais_client: e.target.value })}
                    disabled={!canEdit}
                  />
                </div>
                <div className="col-span-1">
                  <Label>Commission Opérateur</Label>
                  <Input
                    type="number"
                    placeholder="Auto"
                    value={newTx.commission_operateur}
                    onChange={(e) => setNewTx({ ...newTx, commission_operateur: e.target.value })}
                    disabled={!canEdit}
                  />
                </div>
                <div className="col-span-1 flex items-end">
                  <Button
                    className="w-full bg-gradient-to-r from-[#0B1E48] to-[#1A365D] text-white border border-[#D4AF37]/50 hover:from-[#1A365D] hover:to-[#0B1E48]"
                    onClick={handleAddTransaction}
                    disabled={!canEdit || !newTx.montant}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
                <div className="col-span-2 md:col-span-4 lg:col-span-8">
                  <Label>Note (optionnel)</Label>
                  <Input
                    placeholder="Référence client, numéro de transaction..."
                    value={newTx.note}
                    onChange={(e) => setNewTx({ ...newTx, note: e.target.value })}
                    disabled={!canEdit}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tableau des transactions */}
          <Card className="glass-strong border-[#D4AF37]/25">
            <CardHeader>
              <CardTitle className="text-[#0B1E48]">Historique des Opérations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-[#D4AF37]/25 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#0B1E48]/5">
                      <TableHead className="text-[#0B1E48]">Date</TableHead>
                      <TableHead className="text-[#0B1E48]">Service</TableHead>
                      <TableHead className="text-[#0B1E48]">Type</TableHead>
                      <TableHead className="text-[#0B1E48] text-right">Montant Client</TableHead>
                      <TableHead className="text-[#0B1E48] text-right">Impact Cash Exact</TableHead>
                      <TableHead className="text-[#0B1E48] text-right">Impact Wallet Exact</TableHead>
                      <TableHead className="text-[#0B1E48] text-right">Honoraire Net</TableHead>
                      <TableHead className="text-[#0B1E48]">Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {computedRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Aucune transaction enregistrée
                        </TableCell>
                      </TableRow>
                    ) : (
                      computedRows.map((row) => (
                        <TableRow key={row.id} className="hover:bg-[#F3E5AB]/10">
                          <TableCell className="font-medium">{row.date}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {row.service.includes("Cash") || row.service.includes("natcash") ? (
                                <Phone className="w-4 h-4 text-[#D4AF37]" />
                              ) : (
                                <Globe className="w-4 h-4 text-[#D4AF37]" />
                              )}
                              {row.service}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={row.operation === "DEPOT" ? "default" : "secondary"}
                              className={
                                row.operation === "DEPOT"
                                  ? "bg-green-600"
                                  : "bg-red-600"
                              }
                            >
                              {row.operation === "DEPOT" ? "Dépôt" : "Retrait"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {row.montant.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}{" "}
                            {row.currency}
                          </TableCell>
                          <TableCell className={`text-right font-bold ${
                            row.impact_cash >= 0 ? "text-green-600" : "text-red-600"
                          }`}>
                            {row.impact_cash >= 0 ? "+" : ""}
                            {row.impact_cash.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}{" "}
                            {settings.base_currency}
                          </TableCell>
                          <TableCell className={`text-right font-bold ${
                            row.impact_wallet >= 0 ? "text-green-600" : "text-red-600"
                          }`}>
                            {row.impact_wallet >= 0 ? "+" : ""}
                            {row.impact_wallet.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}{" "}
                            {settings.base_currency}
                          </TableCell>
                          <TableCell className="text-right font-bold text-[#D4AF37]">
                            +{row.honoraire_net.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}{" "}
                            {settings.base_currency}
                          </TableCell>
                          <TableCell>
                            {row.commission_estimee ? (
                              <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                Commission estimée
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                Validé
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Ajustements */}
        <TabsContent value="ajustements" className="space-y-4">
          <Card className="glass-strong border-[#D4AF37]/25">
            <CardHeader>
              <CardTitle className="text-[#0B1E48]">Ajustement de Commission Réelle</CardTitle>
              <p className="text-sm text-muted-foreground">
                Lorsque l'opérateur communique la commission réelle (différente de l'estimation)
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newAdjustment.date}
                    onChange={(e) => setNewAdjustment({ ...newAdjustment, date: e.target.value })}
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <Label>Service</Label>
                  <Select
                    value={newAdjustment.service}
                    onValueChange={(v) =>
                      setNewAdjustment({ ...newAdjustment, service: v as MMService })
                    }
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MM_SERVICES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Commission Réelle</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newAdjustment.commission_reelle}
                    onChange={(e) =>
                      setNewAdjustment({ ...newAdjustment, commission_reelle: e.target.value })
                    }
                    disabled={!canEdit}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    className="w-full bg-gradient-to-r from-[#0B1E48] to-[#1A365D] text-white border border-[#D4AF37]/50"
                    onClick={handleAddAdjustment}
                    disabled={!canEdit || !newAdjustment.commission_reelle}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Valider
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Historique ajustements */}
          {adjustments.length > 0 && (
            <Card className="glass-strong border-[#D4AF37]/25">
              <CardHeader>
                <CardTitle className="text-[#0B1E48]">Historique des Ajustements</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead className="text-right">Commission Réelle</TableHead>
                      <TableHead className="text-right">Impact sur Wallet</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adjustments.map((adj) => (
                      <TableRow key={adj.id}>
                        <TableCell>{adj.date}</TableCell>
                        <TableCell>{adj.service}</TableCell>
                        <TableCell className="text-right">
                          {adj.commission_reelle.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}{" "}
                          {adj.currency}
                        </TableCell>
                        <TableCell className="text-right text-[#D4AF37]">
                          +{formatBase(adj.commission_reelle, settings)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Onglet Comptage Caisse */}
        <TabsContent value="comptage" className="space-y-4">
          <Card className="glass-strong border-[#D4AF37]/25">
            <CardHeader>
              <CardTitle className="text-[#0B1E48]">Comptage Physique de Caisse</CardTitle>
              <p className="text-sm text-muted-foreground">
                Saisissez le montant réel compté en caisse pour comparer avec le solde théorique
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={cashCount.date}
                    onChange={(e) => setCashCount({ ...cashCount, date: e.target.value })}
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <Label>Cash Physique Compté</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={cashCount.cash_reel}
                    onChange={(e) => setCashCount({ ...cashCount, cash_reel: e.target.value })}
                    disabled={!canEdit}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    className="w-full bg-gradient-to-r from-[#0B1E48] to-[#1A365D] text-white border border-[#D4AF37]/50"
                    onClick={handleCashCount}
                    disabled={!canEdit || !cashCount.cash_reel}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Enregistrer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {cashCounts.length > 0 && (
            <Card className="glass-strong border-[#D4AF37]/25">
              <CardHeader>
                <CardTitle className="text-[#0B1E48]">Historique des Comptages</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Cash Compté</TableHead>
                      <TableHead className="text-right">Solde Théorique</TableHead>
                      <TableHead className="text-right">Écart</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cashCounts.map((count, idx) => {
                      // Calcul du solde théorique à cette date (approximatif)
                      const soldeTheorique = totals.cashActive;
                      const ecart = count.cash_reel - soldeTheorique;
                      return (
                        <TableRow key={idx}>
                          <TableCell>{count.date}</TableCell>
                          <TableCell className="text-right">
                            {count.cash_reel.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}{" "}
                            {settings.base_currency}
                          </TableCell>
                          <TableCell className="text-right">
                            ~{formatBase(soldeTheorique, settings)}
                          </TableCell>
                          <TableCell
                            className={`text-right font-bold ${
                              ecart > 0
                                ? "text-green-600"
                                : ecart < 0
                                  ? "text-red-600"
                                  : "text-green-600"
                            }`}
                          >
                            {ecart >= 0 ? "+" : ""}
                            {ecart.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}{" "}
                            {settings.base_currency}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MobileMoneySettingsDialog({
  settings,
  onUpdate,
}: {
  settings: MMSettings;
  onUpdate: (s: MMSettings) => void;
}) {
  const [local, setLocal] = useState(settings);
  const { userRole } = useRBAC();
  const isAdmin = userRole === "SUPER_ADMIN";

  const handleSave = () => {
    onUpdate(local);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-[#D4AF37] text-[#0B1E48] hover:bg-[#F3E5AB]"
          disabled={!isAdmin}
        >
          <Settings className="w-4 h-4 mr-2" />
          Paramètres
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-[#0B1E48]">
            Configuration Mobile Money & Transferts
          </DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="caisses">Caisses de Départ</TabsTrigger>
            <TabsTrigger value="commissions">Grilles Commissions</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Devise de Base</Label>
                <Select
                  value={local.base_currency}
                  onValueChange={(v) => setLocal({ ...local, base_currency: v as any })}
                  disabled={!isAdmin}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HTG">HTG 🇭🇹</SelectItem>
                    <SelectItem value="USD">USD 🇺🇸</SelectItem>
                    <SelectItem value="EUR">EUR 🇪🇺</SelectItem>
                    <SelectItem value="DOP">DOP 🇩🇴</SelectItem>
                    <SelectItem value="CAD">CAD 🇨🇦</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Taux USD vers Devise Base (1 USD = X)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={local.usd_rate}
                  onChange={(e) => setLocal({ ...local, usd_rate: parseFloat(e.target.value) || 0 })}
                  disabled={!isAdmin}
                />
              </div>
              <div>
                <Label>Commission Par Défaut (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={local.default_commission_pct}
                  onChange={(e) =>
                    setLocal({ ...local, default_commission_pct: parseFloat(e.target.value) || 0 })
                  }
                  disabled={!isAdmin}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Utilisée pour estimation automatique si non renseignée
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="caisses" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Caisse Physique Cash ({local.base_currency})</Label>
                <Input
                  type="number"
                  value={local.opening_cash_base}
                  onChange={(e) =>
                    setLocal({ ...local, opening_cash_base: parseFloat(e.target.value) || 0 })
                  }
                  disabled={!isAdmin}
                />
              </div>
              <div>
                <Label>Caisse Physique Cash (USD)</Label>
                <Input
                  type="number"
                  value={local.opening_cash_usd}
                  onChange={(e) =>
                    setLocal({ ...local, opening_cash_usd: parseFloat(e.target.value) || 0 })
                  }
                  disabled={!isAdmin}
                />
              </div>
              <div>
                <Label>Portefeuilles Numériques ({local.base_currency})</Label>
                <Input
                  type="number"
                  value={local.opening_wallet_base}
                  onChange={(e) =>
                    setLocal({ ...local, opening_wallet_base: parseFloat(e.target.value) || 0 })
                  }
                  disabled={!isAdmin}
                />
              </div>
              <div>
                <Label>Comptes Internationaux (USD)</Label>
                <Input
                  type="number"
                  value={local.opening_wallet_usd}
                  onChange={(e) =>
                    setLocal({ ...local, opening_wallet_usd: parseFloat(e.target.value) || 0 })
                  }
                  disabled={!isAdmin}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="commissions" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-[#F3E5AB]/10 border-[#D4AF37]/25">
                <h4 className="font-semibold text-[#0B1E48] mb-2">Règles de Commission</h4>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• <strong>Dépôt / Envoi :</strong> L'agent encaisse le montant + frais client en cash, et le wallet est crédité du montant moins la commission opérateur</li>
                  <li>• <strong>Retrait / Réception :</strong> L'agent donne le cash au client, et le wallet est débité du montant plus la commission reçue</li>
                  <li>• La commission opérateur est estimée automatiquement si non renseignée (peut être ajustée ensuite)</li>
                  <li>• Les commissions en devise étrangère sont converties automatiquement au taux du jour</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => setLocal(settings)}>
            Annuler
          </Button>
          <Button
            className="bg-gradient-to-r from-[#0B1E48] to-[#1A365D] text-white border border-[#D4AF37]/50"
            onClick={handleSave}
            disabled={!isAdmin}
          >
            Enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
