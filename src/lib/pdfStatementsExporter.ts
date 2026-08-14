import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { CompanyProfile, FinancialStatements } from "@/types/report";

const ROYAL: [number, number, number] = [15, 44, 89];
const GOLD: [number, number, number] = [212, 175, 55];

type Line = { libelle: string; montant: number };

const money = (value: number, currency: string) =>
  `${Number(value || 0).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} ${currency}`;

export function exportFinancialStatementsPDF(
  profile: CompanyProfile,
  statements: FinancialStatements,
  periodLabel: string,
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const currency = profile.devise_presentation;

  // Official header
  doc.setFillColor(...ROYAL);
  doc.rect(0, 0, 210, 26, "F");
  doc.setFillColor(...GOLD);
  doc.rect(0, 26, 210, 1, "F");

  if (profile.logo_data_url) {
    try {
      doc.addImage(profile.logo_data_url, "PNG", 8, 4, 18, 18);
    } catch {
      /* ignore unsupported logo formats */
    }
  }

  doc.setTextColor(...GOLD);
  doc.setFont("times", "bold");
  doc.setFontSize(15);
  doc.text(profile.nom || "Entreprise", 30, 12);

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(
    [
      `${profile.adresse || "—"} · Tél : ${profile.telephone || "—"}`,
      `NIF : ${profile.nif || "—"} · Patente : ${profile.patente || "—"} · RC : ${profile.registre_commerce || "—"}`,
      `Norme : ${profile.norme_comptable} · ${profile.forme_juridique} · Période : ${periodLabel}`,
    ],
    30,
    17,
  );

  let y = 34;

  const section = (title: string, head: string[], rows: (string | number)[][]) => {
    if (!rows.length) return;
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...ROYAL);
    doc.text(title, 12, y);
    y += 2;
    autoTable(doc, {
      startY: y,
      head: [head],
      body: rows.map((row) => row.map(String)),
      headStyles: { fillColor: ROYAL, textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [250, 250, 252] },
      styles: { fontSize: 8, cellPadding: 2.2 },
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
      tableLineColor: GOLD,
      tableLineWidth: 0.2,
      margin: { left: 12, right: 12 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
  };

  const lines = (list: Line[] | undefined, prefix = ""): (string | number)[][] =>
    (list ?? []).map((l) => [`${prefix}${l.libelle}`, money(l.montant, currency)]);

  const bilan = statements.bilan;
  if (bilan) {
    section("1. BILAN COMPTABLE — ACTIFS", ["Poste", `Montant (${currency})`], [
      ...lines(bilan.actifs_immobilises, "Immobilisé · "),
      ...lines(bilan.actifs_circulants, "Circulant · "),
    ]);
    section("2. BILAN COMPTABLE — PASSIFS & CAPITAUX PROPRES", ["Poste", `Montant (${currency})`], [
      ...lines(bilan.passifs, "Passif · "),
      ...lines(bilan.capitaux_propres, "Capitaux · "),
    ]);
  }

  const resultat = statements.resultat;
  if (resultat) {
    section("3. COMPTE DE RÉSULTAT", ["Poste", `Montant (${currency})`], [
      ...lines(resultat.produits, "Produit · "),
      ...lines(resultat.charges, "Charge · "),
      ["Résultat d'exploitation", money(resultat.resultat_exploitation, currency)],
      ["Résultat financier", money(resultat.resultat_financier, currency)],
      ["RÉSULTAT NET", money(resultat.resultat_net, currency)],
    ]);
  }

  const tresorerie = statements.tresorerie;
  if (tresorerie) {
    section("4. ÉTAT DES FLUX DE TRÉSORERIE", ["Flux", `Montant (${currency})`], [
      ...lines(tresorerie.exploitation, "Exploitation · "),
      ...lines(tresorerie.investissement, "Investissement · "),
      ...lines(tresorerie.financement, "Financement · "),
    ]);
  }

  section(
    "5. VARIATION DES CAPITAUX PROPRES",
    ["Poste", `Montant (${currency})`],
    lines(statements.capitaux),
  );

  if (statements.notes?.length) {
    section(
      "6. NOTES ANNEXES AUX ÉTATS FINANCIERS",
      ["N°", "Note"],
      statements.notes.map((note, index) => [String(index + 1), note]),
    );
  }

  if (statements.comparatif?.length) {
    section(
      "7. COMPARATIF EXERCICE N vs N-1",
      ["Poste", `N (${currency})`, `N-1 (${currency})`],
      statements.comparatif.map((row) => [
        row.libelle,
        money(row.n, currency),
        money(row.n1, currency),
      ]),
    );
  }

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.3);
    doc.line(12, 285, 198, 285);
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`Généré via ScarWrite Rapport — Conforme ${profile.norme_comptable}`, 12, 290);
    doc.text(`Page ${page} / ${pages}`, 180, 290);
  }

  const slug = (value: string) =>
    value.trim().replace(/\s+/g, "_").replace(/[^\w-]/g, "") || "Entreprise";
  doc.save(`Etats_Financiers_${slug(profile.nom)}_${slug(periodLabel)}.pdf`);
}
