import * as XLSX from "xlsx";
import type { FilterPeriod, ReportItem } from "@/types/report";
import { groupKeyFor } from "@/lib/reportParser";

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
  "Qté",
  "Prix Unitaire",
  "Montant Total",
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
    i.quantite,
    i.prix_unitaire,
    i.montant_total,
  ];
}

const ROYAL = "FF0F2C59";
const GOLD = "FFD4AF37";

function styleSheet(ws: XLSX.WorkSheet, rowCount: number) {
  const border = {
    top: { style: "thin", color: { rgb: GOLD } },
    bottom: { style: "thin", color: { rgb: GOLD } },
    left: { style: "thin", color: { rgb: GOLD } },
    right: { style: "thin", color: { rgb: GOLD } },
  };
  for (let c = 0; c < HEADERS.length; c += 1) {
    const ref = XLSX.utils.encode_cell({ r: 0, c });
    const cell = ws[ref];
    if (cell) {
      cell.s = {
        font: { bold: true, color: { rgb: "FFFFFFFF" } },
        fill: { fgColor: { rgb: ROYAL } },
        border,
      };
    }
  }
  const totalRef = XLSX.utils.encode_cell({ r: rowCount + 1, c: 0 });
  if (ws[totalRef]) {
    ws[totalRef].s = { font: { bold: true, color: { rgb: ROYAL } }, border };
  }
}

export function exportToExcel(
  items: ReportItem[],
  periodGroup: FilterPeriod = "global",
  filename = "Rapport_Financier_Lumina.xlsx",
) {
  if (!items.length) return;
  const wb = XLSX.utils.book_new();

  const grouped: Record<string, ReportItem[]> = {};
  for (const item of items) {
    const key = groupKeyFor(item, periodGroup).replace(/[\\/*?:[\]]/g, "-");
    (grouped[key] ??= []).push(item);
  }

  for (const [groupKey, groupItems] of Object.entries(grouped)) {
    const body = groupItems.map(rowFor);
    const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...body]);

    const firstDataRow = 2;
    const lastDataRow = body.length + 1;
    const totalRow = lastDataRow + 1;
    XLSX.utils.sheet_add_aoa(
      ws,
      [
        [
          "TOTAL GÉNÉRAL",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          { f: `SUM(K${firstDataRow}:K${lastDataRow})` },
          { f: `SUM(L${firstDataRow}:L${lastDataRow})` },
          { f: `SUM(M${firstDataRow}:M${lastDataRow})` },
        ],
      ],
      { origin: `A${totalRow}` },
    );

    ws["!cols"] = HEADERS.map((h) => ({ wch: Math.max(h.length + 4, 12) }));
    styleSheet(ws, body.length);
    XLSX.utils.book_append_sheet(wb, ws, groupKey.substring(0, 30));
  }

  XLSX.writeFile(wb, filename);
}

export function exportToCSV(items: ReportItem[], filename = "rapport_lumina.csv") {
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
