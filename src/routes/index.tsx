import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { TopBar } from "@/components/report/TopBar";
import { SessionSidebar } from "@/components/report/SessionSidebar";
import { MultiSourceInput } from "@/components/report/MultiSourceInput";
import { LedgerPanel } from "@/components/report/LedgerPanel";
import { AccountantAssistant } from "@/components/report/AccountantAssistant";
import { WorldEconomyAgent } from "@/components/report/WorldEconomyAgent";
import { MobileMoneyPanel } from "@/components/report/MobileMoneyPanel";
import { extractFromText, extractFromReceipt, transcribeAudio, generateExecutiveSummary, worldEconomyChat } from "@/lib/scarwrite.functions";
import { applyAnomalyGuard, normalizeRows } from "@/lib/reportEngine";
import { getRatesToUSD } from "@/lib/currency";
import { addReportItems, deleteReportItem, deleteSession, getReportItems, listSessions, putReportItem, saveSession } from "@/lib/localDatabase";
import { exportToCSV, exportToExcel } from "@/lib/excelExporter";
import { exportScarWriteLuxuryPDF } from "@/lib/pdfLuxuryExporter";
import { supabase } from "@/integrations/supabase/client";
import type { AssistantMessage, CurrencyCode, FilterPeriod, MachineState, ReportItem, ReportSession, SourceType } from "@/types/report";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "ScarWrite Rapport — AI Precision Ledger & World Economy Suite" },
    { name: "description", content: "Suite financière et comptable IA avec Agent en Économie Mondiale multi-experts." },
  ] }),
  component: Index,
});

const newId = () => typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(16).slice(2)}`;

type EconomyMessage = { role: "user" | "assistant"; content: string };

function Index() {
  const runText = useServerFn(extractFromText);
  const runReceipt = useServerFn(extractFromReceipt);
  const runTranscribe = useServerFn(transcribeAudio);
  const runNarrative = useServerFn(generateExecutiveSummary);
  const runWorldEconomy = useServerFn(worldEconomyChat);
  const [sessions, setSessions] = useState<ReportSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [items, setItems] = useState<ReportItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [prompt, setPrompt] = useState("");
  const [state, setState] = useState<MachineState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<SourceType>("TEXT");
  const [period, setPeriod] = useState<FilterPeriod>("global");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [rates, setRates] = useState<Record<CurrencyCode, number>>({ USD: 1, EUR: 1.08, HTG: 0.0076 });
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(true);
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([]);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantReady, setAssistantReady] = useState(false);
  const [worldOpen, setWorldOpen] = useState(false);
  const [worldMessages, setWorldMessages] = useState<EconomyMessage[]>([]);
  const [worldLoading, setWorldLoading] = useState(false);
  const [mobileMoneyOpen, setMobileMoneyOpen] = useState(false);

  const activeSession = useMemo(() => sessions.find((session) => session.id === activeId) ?? null, [sessions, activeId]);
  const refreshCounts = useCallback(async (list: ReportSession[]) => {
    const entries = await Promise.all(list.map(async (session) => [session.id, (await getReportItems(session.id)).length] as const));
    setCounts(Object.fromEntries(entries));
  }, []);

  useEffect(() => {
    void (async () => {
      const stored = await listSessions();
      if (!stored.length) {
        const session: ReportSession = { id: newId(), title: `Registre ${new Date().toLocaleDateString("fr-FR")}`, period_group: "global", currency_reference: "USD", created_at: new Date().toISOString() };
        await saveSession(session); setSessions([session]); setActiveId(session.id); setCounts({ [session.id]: 0 });
      } else { setSessions(stored); setActiveId(stored[0]!.id); await refreshCounts(stored); }
      setRates((await getRatesToUSD()).rates);
    })();
    supabase.auth.getSession().then(({ data }) => setUserEmail(data.session?.user.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => setUserEmail(session?.user.email ?? null));
    return () => sub.subscription.unsubscribe();
  }, [refreshCounts]);
  useEffect(() => { if (activeId) void getReportItems(activeId).then(setItems); }, [activeId]);

  const syncToCloud = useCallback(async (session: ReportSession, rows: ReportItem[]) => {
    const { data } = await supabase.auth.getUser(); const uid = data.user?.id; if (!uid) return;
    setSyncing(true);
    try {
      await supabase.from("report_sessions").upsert({ id: session.id, user_id: uid, title: session.title, period_group: session.period_group, currency_reference: session.currency_reference, executive_summary: session.executive_summary ?? null, created_at: session.created_at });
      if (rows.length) await supabase.from("report_items").upsert(rows.map((item) => ({ id: item.id, user_id: uid, report_id: session.id, date_complete: item.date_complete, jour: item.jour, mois: item.mois, annee: item.annee, semaine_numero: item.semaine_numero, trimestre: item.trimestre, semestre: item.semestre, type: item.type, categorie: item.categorie, description: item.description, quantite: item.quantite, prix_unitaire: item.prix_unitaire, montant_total: item.montant_total, currency_original: item.currency_original, exchange_rate: item.exchange_rate, montant_converted_usd: item.montant_converted_usd, anomaly_badge: item.anomaly_badge, anomaly_explanation: item.anomaly_explanation ?? null, source_type: item.source_type, created_at: item.created_at })));
    } finally { setSyncing(false); }
  }, []);

  const ingestPayload = useCallback(async (payload: string, source: SourceType) => {
    if (!activeSession) return; setState("parsing");
    const parsed = JSON.parse(payload) as { rows?: unknown[]; items?: unknown[] }; const rawRows = parsed.rows ?? parsed.items ?? [];
    const fresh = normalizeRows(rawRows, { reportId: activeSession.id, sourceType: source, fallbackCurrency: currency, ratesToUsd: rates });
    if (!fresh.length) throw new Error("Aucune écriture détectée dans cette source.");
    const merged = applyAnomalyGuard([...items, ...fresh]); await addReportItems(activeSession.id, merged); setItems(merged); setCounts((p) => ({ ...p, [activeSession.id]: merged.length })); setState("ready"); void syncToCloud(activeSession, merged);
  }, [activeSession, currency, items, rates, syncToCloud]);

  const handleSubmitText = async () => { if (!prompt.trim() || !activeSession) return; setError(null); setState("processing"); setSourceType("TEXT"); try { const result = await runText({ data: { prompt, currency } }); await ingestPayload(result.payload, "TEXT"); setPrompt(""); } catch (e) { setError(e instanceof Error ? e.message : "Une erreur est survenue."); setState("error"); } };
  const handleSubmitReceipt = async (dataUrl: string) => { setError(null); setState("processing"); setSourceType("OCR_RECEIPT"); try { const result = await runReceipt({ data: { imageDataUrl: dataUrl, currency } }); await ingestPayload(result.payload, "OCR_RECEIPT"); } catch (e) { setError(e instanceof Error ? e.message : "Lecture du reçu impossible."); setState("error"); } };
  const handleTranscribe = async (base64: string, format: string) => { setError(null); setState("processing"); setSourceType("VOICE_NOTE"); try { const { text } = await runTranscribe({ data: { audioBase64: base64, format } }); const result = await runText({ data: { prompt: text, currency } }); await ingestPayload(result.payload, "VOICE_NOTE"); } catch (e) { setError(e instanceof Error ? e.message : "Transcription impossible."); setState("error"); } };
  const handleCellEdit = (rowId: string, key: keyof ReportItem, value: string) => { const numericKeys: (keyof ReportItem)[] = ["quantite", "prix_unitaire", "montant_total"]; setItems((previous) => previous.map((item) => { if (item.id !== rowId) return item; const updated: ReportItem = numericKeys.includes(key) ? { ...item, [key]: Number(value) || 0 } : { ...item, [key]: value }; updated.montant_converted_usd = updated.montant_total * updated.exchange_rate; void putReportItem(updated); return updated; })); };
  const handleDeleteRow = async (rowId: string) => { await deleteReportItem(rowId); setItems((p) => p.filter((item) => item.id !== rowId)); if (activeId) setCounts((p) => ({ ...p, [activeId]: Math.max((p[activeId] ?? 1) - 1, 0) })); };
  const handleCreateSession = async () => { const session: ReportSession = { id: newId(), title: `Registre ${new Date().toLocaleDateString("fr-FR")}`, period_group: "global", currency_reference: currency, created_at: new Date().toISOString() }; await saveSession(session); setSessions((p) => [session, ...p]); setActiveId(session.id); setItems([]); setCounts((p) => ({ ...p, [session.id]: 0 })); };
  const handleDeleteSession = async (id: string) => { await deleteSession(id); const remaining = sessions.filter((s) => s.id !== id); setSessions(remaining); if (activeId === id) { setActiveId(remaining[0]?.id ?? null); setItems(remaining[0] ? await getReportItems(remaining[0].id) : []); } };
  const handleNarrative = async () => { if (!activeSession || !items.length) return; setNarrativeLoading(true); try { const ledger = items.map((i) => `${i.date_complete} | ${i.type} | ${i.categorie} | ${i.description} | ${i.montant_converted_usd.toFixed(2)} USD`).join("\n"); const { summary } = await runNarrative({ data: { ledger } }); const updated = { ...activeSession, executive_summary: summary }; await saveSession(updated); setSessions((p) => p.map((s) => s.id === updated.id ? updated : s)); void syncToCloud(updated, items); } catch (e) { setError(e instanceof Error ? e.message : "Synthèse indisponible."); } finally { setNarrativeLoading(false); } };
  const handleSignIn = async () => { await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } }); };
  const handleSignOut = async () => { await supabase.auth.signOut(); };

  const handleAssistantSend = useCallback((text: string) => { setAssistantMessages((p) => [...p, { role: "user", content: text }]); setAssistantLoading(true); setTimeout(() => { setAssistantMessages((p) => [...p, { role: "assistant", content: "Je peux vous aider avec l'analyse des écritures, les états financiers, les normes comptables, les amortissements et provisions." }]); setAssistantLoading(false); if (items.length) setAssistantReady(true); }, 600); }, [items.length]);
  const handleAssistantExport = useCallback(() => { if (activeSession) exportScarWriteLuxuryPDF(activeSession, items); }, [activeSession, items]);

  const handleWorldEconomySend = useCallback(async (text: string) => {
    const next = [...worldMessages, { role: "user" as const, content: text }]; setWorldMessages(next); setWorldLoading(true);
    try {
      const context = activeSession ? `Dossier: ${activeSession.title}. ${items.length} écritures comptables disponibles.` : "Aucun dossier comptable actif.";
      const result = await runWorldEconomy({ data: { messages: next, context } });
      setWorldMessages((p) => [...p, { role: "assistant", content: result.reply }]);
    } catch (e) { setWorldMessages((p) => [...p, { role: "assistant", content: e instanceof Error ? e.message : "Agent indisponible." }]); }
    finally { setWorldLoading(false); }
  }, [activeSession, items.length, runWorldEconomy, worldMessages]);

  return (
    <div className="app-mesh min-h-screen pb-8">
      <TopBar disabled={items.length === 0} onExportExcel={() => exportToExcel(items, period)} onExportCSV={() => exportToCSV(items)} onExportPDF={() => activeSession ? exportScarWriteLuxuryPDF(activeSession, items) : undefined} currency={currency} onCurrencyChange={setCurrency} userEmail={userEmail} onSignIn={handleSignIn} onSignOut={handleSignOut} syncing={syncing} assistantOpen={assistantOpen} onToggleAssistant={() => setAssistantOpen(!assistantOpen)} onOpenWorldEconomy={() => setWorldOpen(true)} />
      <main className="mx-auto mt-6 grid max-w-[1920px] gap-5 px-4 sm:px-6 lg:grid-cols-[minmax(0,22fr)_minmax(0,28fr)_minmax(0,32fr)_minmax(0,18fr)]">
        <SessionSidebar sessions={sessions} activeId={activeId} counts={counts} onSelect={setActiveId} onCreate={handleCreateSession} onDelete={handleDeleteSession} period={period} onPeriodChange={setPeriod} onOpenMobileMoney={() => setMobileMoneyOpen(true)} />
        <MultiSourceInput value={prompt} onChange={setPrompt} onSubmitText={handleSubmitText} onSubmitReceipt={handleSubmitReceipt} onTranscribe={handleTranscribe} state={state} error={error} sourceType={sourceType} />
        <LedgerPanel session={activeSession} items={items} period={period} displayCurrency={currency} rates={rates} onCellEdit={handleCellEdit} onDeleteRow={handleDeleteRow} onGenerateNarrative={handleNarrative} narrativeLoading={narrativeLoading} busy={state === "processing" || state === "parsing"} />
        <AccountantAssistant open={assistantOpen} onClose={() => setAssistantOpen(false)} messages={assistantMessages} onSend={handleAssistantSend} loading={assistantLoading} ready={assistantReady} onExport={handleAssistantExport} />
      </main>
      <WorldEconomyAgent open={worldOpen} onClose={() => setWorldOpen(false)} onSend={handleWorldEconomySend} loading={worldLoading} messages={worldMessages} />
      {mobileMoneyOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"><div className="relative h-[90vh] w-[95vw] max-w-[1600px] overflow-hidden rounded-2xl bg-white shadow-2xl"><button onClick={() => setMobileMoneyOpen(false)} className="absolute right-4 top-4 z-10 rounded-full bg-[#0B1E48]/10 p-2 text-[#0B1E48]">×</button><div className="h-full overflow-y-auto"><MobileMoneyPanel /></div></div></div>}
    </div>
  );
}
