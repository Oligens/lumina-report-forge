import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ReportItem, ReportSession } from "@/types/report";
import { computeSummary } from "@/lib/reportEngine";

const COLOR_PRIMARY: [number, number, number] = [15, 44, 89];
const COLOR_GOLD: [number, number, number] = [212, 175, 55];
const COLOR_BG: [number, number, number] = [248, 250, 252];

export function exportScarWriteLuxuryPDF(
  session: ReportSession,
  items: ReportItem[],
  userName = "Utilisateur ScarWrite",
) {
  if (!items.length) return;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // 1. Brand header
  doc.setFillColor(...COLOR_PRIMARY);
  doc.rect(0, 0, 210, 22, "F");
  doc.setFillColor(...COLOR_GOLD);
  doc.rect(0, 22, 210, 0.9, "F");

  // Nib mark
  doc.setFillColor(...COLOR_GOLD);
  doc.triangle(9, 6, 16, 6, 12.5, 17, "F");
  doc.setFillColor(...COLOR_PRIMARY);
  doc.circle(12.5, 10.5, 1.4, "F");

  doc.setTextColor(...COLOR_GOLD);
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text("SCARWRITE RAPPORT", 20, 14);

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    `Compte : ${userName} | Date : ${new Date().toLocaleDateString("fr-FR")}`,
    118,
    14,
  );

  // 2. Session title
  doc.setTextColor(...COLOR_PRIMARY);
  doc.setFontSize(15);
  doc.setFont("times", "bold");
  doc.text(session.title.toUpperCase(), 12, 33);

  let cursorY = 39;

  // 3. Executive AI narrative
  if (session.executive_summary) {
    const lines = doc.splitTextToSize(session.executive_summary, 178) as string[];
    const boxHeight = 14 + lines.length * 4;
    doc.setFillColor(...COLOR_BG);
    doc.setDrawColor(...COLOR_GOLD);
    doc.roundedRect(12, cursorY, 186, boxHeight, 2, 2, "FD");

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLOR_GOLD);
    doc.text("SYNTHÈSE DÉCISIONNELLE DE L'EXPERT IA (PREMIUM)", 16, cursorY + 6);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 41, 59);
    doc.text(lines, 16, cursorY + 12);
    cursorY += boxHeight + 6;
  }

  // 4. KPI cards
  const summary = computeSummary(items);
  const cards: [string, number, [number, number, number]][] = [
    ["TOTAL VENTES", summary.totalVentes, [30, 64, 175]],
    ["TOTAL DÉPENSES", summary.totalDepenses, [185, 28, 28]],
    ["SOLDE CONSOLIDÉ NET", summary.soldeNet, [21, 128, 61]],
  ];
  cards.forEach(([label, value, color], index) => {
    const x = 12 + index * 62;
    doc.setFillColor(...COLOR_BG);
    doc.setDrawColor(...COLOR_GOLD);
    doc.roundedRect(x, cursorY, 58, 17, 2, 2, "FD");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLOR_PRIMARY);
    doc.text(label, x + 4, cursorY + 6);
    doc.setFontSize(10);
    doc.setTextColor(...color);
    doc.text(`${value.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} USD`, x + 4, cursorY + 13);
  });
  cursorY += 24;

  // 5. Data table with anomaly badges
  const tableRows = items.map((i) => [
    `${String(i.jour).padStart(2, "0")}/${i.mois.substring(0, 3)}/${i.annee}`,
    `${i.trimestre} / ${i.semestre} / S${i.semaine_numero}`,
    i.type,
    i.description,
    i.anomaly_badge !== "NORMAL"
      ? i.anomaly_badge === "DUPLICATE_RISK"
        ? "Risque Doublon"
        : "Écart Anormal"
      : "OK",
    `${i.quantite}`,
    `${i.prix_unitaire.toLocaleString("fr-FR")} ${i.currency_original}`,
    `${i.montant_converted_usd.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} USD`,
  ]);

  autoTable(doc, {
    startY: cursorY,
    head: [["Date", "Période", "Type", "Description", "Audit IA", "Qté", "P.U.", "Total (USD)"]],
    body: tableRows,
    foot: [
      [
        "TOTAL GÉNÉRAL",
        "",
        "",
        "",
        "",
        "",
        "",
        `${items
          .reduce((sum, i) => sum + (Number(i.montant_converted_usd) || 0), 0)
          .toLocaleString("fr-FR", { maximumFractionDigits: 2 })} USD`,
      ],
    ],
    headStyles: {
      fillColor: COLOR_PRIMARY,
      textColor: [255, 255, 255],
      fontStyle: "bold",
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
    columnStyles: {
      4: { fontStyle: "bold", textColor: [185, 28, 28] },
      7: { halign: "right", fontStyle: "bold" },
    },
    tableLineColor: COLOR_GOLD,
    tableLineWidth: 0.2,
    didDrawPage: () => {
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Page ${doc.getCurrentPageInfo().pageNumber} sur ${doc.getNumberOfPages()}`,
        176,
        289,
      );
    },
  });

  doc.save(`${session.title.toLowerCase().replace(/\s+/g, "_")}_scarwrite.pdf`);
}
