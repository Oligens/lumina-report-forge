import * as XLSX from "xlsx";
import type { FilterPeriod, ReportItem } from "@/types/report";
import { groupKeyFor } from "@/lib/reportEngine";

const HEADERS = [
  "Année",
  "Mois",
  "Jour",
  "Date Complète",
  "Semaine",
  "Trimestre",
  "Semestre",
  "Type",
  "Catégorie",
  "Description",
  "Source",
  "Audit IA",
  "Qté",
  "Prix Unitaire",
  "Devise",
  "Montant Total",
  "Total (USD)",
];

function rowFor(i: ReportItem) {
  return [
    i.annee,
    i.mois,
    i.jour,
    i.date_complete,
    i.semaine_numero,
    i.trimestre,
    i.semestre,
    i.type,
    i.categorie,
    i.description,
    i.source_type,
    i.anomaly_badge,
    i.quantite,
    i.prix_unitaire,
    i.currency_original,
    i.montant_total,
    i.montant_converted_usd,
  ];
}

const ROYAL = "FF0F2C59";
const GOLD = "FFD4AF37";

export function exportToExcel(
  items: ReportItem[],
  periodGroup: FilterPeriod = "global",
  filename = "ScarWrite_Rapport.xlsx",
) {
  if (!items.length) return;
  const wb = XLSX.utils.book_new();

  const grouped: Record<string, ReportItem[]> = {};
  for (const item of items) {
    const key = groupKeyFor(item, periodGroup).replace(/[\\/*?:[\]]/g, "-");
    (grouped[key] ??= []).push(item);
  }

  const border = {
    top: { style: "thin", color: { rgb: GOLD } },
    bottom: { style: "thin", color: { rgb: GOLD } },
    left: { style: "thin", color: { rgb: GOLD } },
    right: { style: "thin", color: { rgb: GOLD } },
  };

  for (const [groupKey, groupItems] of Object.entries(grouped)) {
    const body = groupItems.map(rowFor);
    const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...body]);

    const first = 2;
    const last = body.length + 1;
    const totalRow = last + 1;
    XLSX.utils.sheet_add_aoa(
      ws,
      [
        [
          "TOTAL GÉNÉRAL",
          ...Array(11).fill(""),
          { f: `SUM(M${first}:M${last})` },
          "",
          "",
          { f: `SUM(P${first}:P${last})` },
          { f: `SUM(Q${first}:Q${last})` },
        ],
      ],
      { origin: `A${totalRow}` },
    );

    ws["!cols"] = HEADERS.map((h) => ({ wch: Math.max(h.length + 4, 12) }));
    for (let c = 0; c < HEADERS.length; c += 1) {
      const cell = ws[XLSX.utils.encode_cell({ r: 0, c })];
      if (cell)
        cell.s = {
          font: { bold: true, color: { rgb: "FFFFFFFF" } },
          fill: { fgColor: { rgb: ROYAL } },
          border,
        };
    }
    const totalCell = ws[XLSX.utils.encode_cell({ r: totalRow - 1, c: 0 })];
    if (totalCell) totalCell.s = { font: { bold: true, color: { rgb: ROYAL } }, border };

    XLSX.utils.book_append_sheet(wb, ws, groupKey.substring(0, 30));
  }

  XLSX.writeFile(wb, filename);
}

export function exportToCSV(items: ReportItem[], filename = "scarwrite_rapport.csv") {
  if (!items.length) return;
  const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...items.map(rowFor)]);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
