import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ReportItem, ReportSummary } from "@/types/report";

const COLOR_PRIMARY: [number, number, number] = [15, 44, 89];
const COLOR_GOLD: [number, number, number] = [212, 175, 55];
const COLOR_BG_LIGHT: [number, number, number] = [248, 250, 252];

export function exportToLuxuryPDF(
  items: ReportItem[],
  summary: ReportSummary,
  title = "RAPPORT FINANCIER GLOBAL",
  currency = "USD",
) {
  if (!items.length) return;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  doc.setFillColor(...COLOR_PRIMARY);
  doc.rect(0, 0, 210, 20, "F");
  doc.setFillColor(...COLOR_GOLD);
  doc.rect(0, 20, 210, 0.8, "F");

  doc.setTextColor(...COLOR_GOLD);
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text("LUMINA PRECISION SUITE", 12, 13);

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Édité le : ${new Date().toLocaleDateString("fr-FR")}`, 160, 13);

  doc.setTextColor(...COLOR_PRIMARY);
  doc.setFontSize(16);
  doc.setFont("times", "bold");
  doc.text(title.toUpperCase(), 12, 32);

  doc.setFillColor(...COLOR_BG_LIGHT);
  doc.setDrawColor(...COLOR_GOLD);
  doc.roundedRect(12, 37, 186, 18, 2, 2, "FD");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  const fmt = (n: number) => `${n.toLocaleString("fr-FR")} ${currency}`;

  doc.setTextColor(30, 64, 175);
  doc.text(`TOTAL VENTES: ${fmt(summary.totalVentes)}`, 18, 48);
  doc.setTextColor(185, 28, 28);
  doc.text(
    `TOTAL DÉPENSES: ${fmt(summary.totalAchats + summary.totalDepenses)}`,
    80,
    48,
  );
  doc.setTextColor(21, 128, 61);
  doc.text(`SOLDE NETTE: ${fmt(summary.soldeNette)}`, 145, 48);

  const tableData = items.map((i) => [
    `${String(i.jour).padStart(2, "0")}/${i.mois.substring(0, 3)}/${i.annee}`,
    i.trimestre,
    i.type,
    i.description,
    i.quantite,
    i.prix_unitaire.toLocaleString("fr-FR"),
    i.montant_total.toLocaleString("fr-FR"),
  ]);

  autoTable(doc, {
    startY: 60,
    head: [["Date (J/M/A)", "Trim.", "Type", "Description", "Qté", "P.U.", "Total"]],
    body: tableData,
    foot: [
      [
        "TOTAL GÉNÉRAL",
        "",
        "",
        "",
        "",
        "",
        items
          .reduce((sum, i) => sum + (Number(i.montant_total) || 0), 0)
          .toLocaleString("fr-FR"),
      ],
    ],
    headStyles: {
      fillColor: COLOR_PRIMARY,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "left",
    },
    footStyles: {
      fillColor: [255, 255, 255],
      textColor: COLOR_PRIMARY,
      fontStyle: "bold",
      lineColor: COLOR_GOLD,
      lineWidth: 0.3,
    },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: { 6: { halign: "right", fontStyle: "bold" } },
    tableLineColor: COLOR_GOLD,
    tableLineWidth: 0.15,
    didDrawPage: () => {
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Page ${doc.getCurrentPageInfo().pageNumber} sur ${doc.getNumberOfPages()}`,
        176,
        287,
      );
    },
  });

  doc.save(`${title.toLowerCase().replace(/\s+/g, "_")}.pdf`);
}
