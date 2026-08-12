import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppHeader } from "@/components/report/AppHeader";
import { InputStudio } from "@/components/report/InputStudio";
import { ReportGrid } from "@/components/report/ReportGrid";
import { generateReport } from "@/lib/report.functions";
import { computeSummary, parseAIResponse } from "@/lib/reportParser";
import { exportToCSV, exportToExcel } from "@/lib/excelExporter";
import { exportToLuxuryPDF } from "@/lib/pdfExporter";
import type {
  FilterPeriod,
  MachineState,
  ParsedReport,
  ReportPayload,
} from "@/types/report";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LUMINA — AI Precision Report Suite" },
      {
        name: "description",
        content:
          "Transformez vos données brutes en rapports financiers structurés, éditables et exportables en Excel, PDF et CSV grâce à l'IA.",
      },
      { property: "og:title", content: "LUMINA — AI Precision Report Suite" },
      {
        property: "og:description",
        content:
          "Convertisseur IA texte vers tableau financier : édition en temps réel, regroupement temporel et exports haut de gamme.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const runGeneration = useServerFn(generateReport);
  const [prompt, setPrompt] = useState("");
  const [state, setState] = useState<MachineState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ParsedReport | null>(null);
  const [period, setPeriod] = useState<FilterPeriod>("global");
  const [groupFilter, setGroupFilter] = useState("all");

  const summary = useMemo(
    () => (report ? computeSummary(report.items) : computeSummary([])),
    [report],
  );

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setError(null);
    setState("processing");
    try {
      const result = await runGeneration({ data: { prompt } });
      setState("parsing");
      const payload = JSON.parse(result.payload) as ReportPayload;
      setReport(parseAIResponse(payload));
      setPeriod("global");
      setGroupFilter("all");
      setState("ready");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Une erreur est survenue.");
      setState("error");
    }
  };

  const handleCellEdit = (rowId: string, key: string, value: string) => {
    setReport((previous) => {
      if (!previous) return previous;
      const column = previous.columns.find((c) => c.key === key);
      const numeric = column?.type === "number" || column?.type === "currency";
      return {
        ...previous,
        items: previous.items.map((item) =>
          item.id === rowId
            ? { ...item, [key]: numeric ? Number(value) || 0 : value }
            : item,
        ),
      };
    });
  };

  const items = report?.items ?? [];
  const noData = items.length === 0;

  return (
    <div className="min-h-screen bg-background pb-8">
      <AppHeader
        disabled={noData}
        onExportExcel={() => exportToExcel(items, period)}
        onExportCSV={() => exportToCSV(items)}
        onExportPDF={() =>
          exportToLuxuryPDF(
            items,
            summary,
            report?.title ?? "Rapport Financier Global",
            report?.currency ?? "USD",
          )
        }
      />

      <main className="mx-auto mt-6 grid max-w-[1600px] gap-5 px-4 sm:px-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <InputStudio
          value={prompt}
          onChange={setPrompt}
          onGenerate={handleGenerate}
          state={state}
          error={error}
        />
        <ReportGrid
          report={report}
          summary={summary}
          period={period}
          onPeriodChange={setPeriod}
          groupFilter={groupFilter}
          onGroupFilterChange={setGroupFilter}
          onCellEdit={handleCellEdit}
          busy={state === "processing" || state === "parsing"}
        />
      </main>
    </div>
  );
}
