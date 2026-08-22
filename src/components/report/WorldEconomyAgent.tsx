import { useMemo, useState } from "react";
import { Globe2, Send, X, Users, BookOpen, Landmark, LineChart, ShieldCheck } from "lucide-react";
import { WORLD_ECONOMY_EXPERTS, routeWorldEconomyExperts } from "@/lib/worldEconomyAgent";

interface Props {
  open: boolean;
  onClose: () => void;
  onSend: (query: string) => void;
  loading: boolean;
  messages: { role: "user" | "assistant"; content: string }[];
}

const iconFor = (id: string) => {
  if (id.includes("accounting")) return BookOpen;
  if (id.includes("public")) return Landmark;
  if (id.includes("finance") || id.includes("risk")) return LineChart;
  if (id.includes("audit")) return ShieldCheck;
  return Globe2;
};

export function WorldEconomyAgent({ open, onClose, onSend, loading, messages }: Props) {
  const [draft, setDraft] = useState("");
  const [expertFilter, setExpertFilter] = useState("");
  const visibleExperts = useMemo(() => WORLD_ECONOMY_EXPERTS.filter((e) =>
    `${e.name} ${e.mission}`.toLowerCase().includes(expertFilter.toLowerCase()),
  ), [expertFilter]);

  const submit = () => {
    if (!draft.trim() || loading) return;
    onSend(draft.trim());
    setDraft("");
  };

  if (!open) return null;

  return (
    <aside className="fixed right-0 top-0 z-[60] flex h-full w-full max-w-2xl flex-col border-l border-gold/30 bg-[#07142f]/98 p-5 text-white shadow-2xl backdrop-blur-xl">
      <header className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-gold p-2.5 text-gold-foreground"><Globe2 className="size-6" /></div>
          <div>
            <h2 className="font-serif text-lg font-semibold text-gold-deep">Agent en Économie Mondiale</h2>
            <p className="text-[0.58rem] uppercase tracking-[0.2em] text-white/60">Orchestrateur multi-experts · ScarWrite IA</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="text-white/60 hover:text-gold-deep"><X className="size-5" /></button>
      </header>

      <section className="mt-4 rounded-xl border border-gold/20 bg-white/5 p-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gold-deep"><Users className="size-4" /> Sous-agents spécialisés</div>
        <input value={expertFilter} onChange={(e) => setExpertFilter(e.target.value)} placeholder="Rechercher un expert..." className="mb-3 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs outline-none placeholder:text-white/35" />
        <div className="grid max-h-44 grid-cols-1 gap-1.5 overflow-auto sm:grid-cols-2">
          {visibleExperts.map((expert) => {
            const Icon = iconFor(expert.id);
            return <button key={expert.id} type="button" onClick={() => setDraft(`Analyse cette question avec l'expert ${expert.name}: `)} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2 text-left hover:border-gold/30 hover:bg-gold/10">
              <Icon className="size-4 shrink-0 text-gold-deep" />
              <span className="truncate text-[0.62rem]">{expert.name}</span>
            </button>;
          })}
        </div>
      </section>

      <div className="mt-4 flex-1 space-y-3 overflow-auto rounded-xl border border-white/10 bg-black/10 p-3">
        {messages.length === 0 ? (
          <div className="py-10 text-center">
            <Globe2 className="mx-auto mb-3 size-12 text-gold-deep" />
            <p className="text-sm font-medium">Posez une question économique, financière, comptable ou budgétaire.</p>
            <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-white/55">L'orchestrateur sélectionne les experts pertinents, confronte leurs domaines et construit une réponse structurée. Précisez toujours le pays et la période lorsqu'ils sont importants.</p>
          </div>
        ) : null}
        {messages.map((message, i) => <div key={i} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}><div className={`max-w-[90%] whitespace-pre-wrap rounded-xl px-3 py-2 text-xs leading-relaxed ${message.role === "user" ? "bg-gradient-gold text-gold-foreground" : "border border-gold/20 bg-white/10 text-white"}`}>{message.content}</div></div>)}
        {loading ? <p className="animate-pulse text-xs text-gold-deep">Les experts analysent la demande…</p> : null}
      </div>

      <div className="mt-3 flex items-end gap-2">
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }} rows={3} placeholder="Ex.: Comparez la dette publique d'Haïti et du Sénégal selon les indicateurs disponibles..." className="flex-1 resize-none rounded-xl border border-gold/20 bg-white/10 px-3 py-2 text-xs outline-none placeholder:text-white/35 focus:border-gold" />
        <button type="button" onClick={submit} disabled={!draft.trim() || loading} className="rounded-xl bg-gradient-gold p-3 text-gold-foreground shadow-gold disabled:opacity-40"><Send className="size-4" /></button>
      </div>
    </aside>
  );
}
