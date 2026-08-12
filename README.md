# Lumina Reports

Create a luxurious, high-end web application UI for an AI-powered financial and operational report builder. 

Design Aesthetics & Color Palette:

- Primary background: Crisp, pure white (#FFFFFF) with subtle off-white layering (#F9F9FB) for content cards.

- Accent Color 1 (Luxury Gold): Metallic polished gold (#D4AF37 / #C5A059) used for high-importance borders, key action buttons, hover states, and primary highlights.

- Accent Color 2 (Royal Blue): Fine, delicate lines and typography accents in deep royal blue (#0F2C59 / #1A365D) for status badges, column headers, and structural dividers.

- Typography: Clean, elegant serif fonts for headings (e.g., Playfair Display or Cinzel style) and ultra-crisp sans-serif for numbers/tables (Inter or SF Pro).

Layout Architecture:

1. Header & Navigation:

   - Minimalist, floating navigation bar with a subtle golden glow border.

   - Branding title in gold with royal blue subtitle: "LUMINA - AI Precision Report Suite".

   - Export controls (Export to Excel, PDF, CSV) with thin royal blue outlines and gold text.

2. Main Workspace (Dual Pane Split):

   - Left Pane (Input Studio - 40% width):

     - Large, sleek text area titled "Prompt & Source Data".

     - Placeholders encouraging users to paste raw unstructured logs (e.g., purchases, sales, expenses, inventory movements).

     - Action button: "Générer le Rapport" with a luxurious gold gradient background and subtle drop shadow.

     - Quick template chips: "Rapport des Ventes", "Journal de Dépenses", "Flux d'Achat".

   

3. Right Pane (Dynamic Excel-Style Sheet - 60% width):

   - A polished interactive table component mimicking Excel/Airtable.

   - Header row with dark royal blue text, fine gold bottom border, and subtle blue column separators.

   - Rows with hover transitions (soft gold tint on hover).

   - Dynamic total/summary row at the bottom with highlighted golden card indicators for key metrics (Total Ventes, Total Dépenses, Solde Nette).

   - Filtering and sorting controls on each column header.

Ensure full responsiveness, crisp micro-interactions, dark grid lines with 1px royal blue transparency, and a clean, high-precision luxury feel. No dummy data in the presentation components; keep state ready for live JSON payloads.Build the backend business logic and AI processing pipeline for a real-time text-to-structured-table converter.

Core Requirements & Data Constraints:

- DO NOT hardcode fictional data. All tables must strictly render dynamically from the user's input text or return an empty grid state if no data is present.

AI Integration Architecture:

1. LLM Engine System Prompt:

   - Target API: OpenAI GPT-4o or Anthropic Claude 3.5 Sonnet.

   - System Message instruction:

     "You are a specialized data-structuring financial analyst AI. Your sole task is to ingest unstructured natural language text containing business records (sales, purchases, expenses, inventory, invoices) and transform them into a clean, normalized JSON array representing a structured table.

     Extract and normalize:

     - Date/Time (ISO format standard)

     - Type/Category (e.g., Vente, Achat, Dépense, Transfert)

     - Description/Libellé

     - Quantité/Unités (Numeric, default 1)

     - Prix Unitaire (Numeric)

     - Montant Total (Numeric = Quantité * Prix Unitaire if not specified)

     - Statut/Mode de Paiement (if mentioned)

     

     Rules:

     - Never invent facts, dates, or numbers not present or clearly implied in the text.

     - Automatically deduce appropriate table columns based on the input context.

     - Return strictly valid JSON in the specified JSON Schema format without conversational filler."

2. Required Output JSON Schema:

   {

     "report_title": "String",

     "currency": "String (e.g., USD, EUR, HTG)",

     "columns": [

       { "key": "string", "label": "string", "type": "date | string | number | currency" }

     ],

     "rows": [

       { "id": "string", "col_key_1": "value", "col_key_2": "value" }

     ],

     "summary": {

       "total_income": "number",

       "total_expense": "number",

       "net_balance": "number"

     }

   }

3. Frontend Processing & State Logic:

   - Create a reactive state machine: [Idle] -> [Processing Prompt...] -> [Parsing JSON] -> [Rendering Table].

   - Calculate column totals dynamically on the client side based on parsed numeric fields.

   - Implement real-time cell editing so users can modify table cells directly after AI generation.

   - Support seamless export functions to downloadable .xlsx (using SheetJS / xlsx package) and PDF (using jspdf-autotable). Build the backend business logic and AI processing pipeline for a real-time text-to-structured-table converter.

Core Requirements & Data Constraints:

- DO NOT hardcode fictional data. All tables must strictly render dynamically from the user's input text or return an empty grid state if no data is present.

AI Integration Architecture:

1. LLM Engine System Prompt:

   - Target API: OpenAI GPT-4o or Anthropic Claude 3.5 Sonnet.

   - System Message instruction:

     "You are a specialized data-structuring financial analyst AI. Your sole task is to ingest unstructured natural language text containing business records (sales, purchases, expenses, inventory, invoices) and transform them into a clean, normalized JSON array representing a structured table.

     Extract and normalize:

     - Date/Time (ISO format standard)

     - Type/Category (e.g., Vente, Achat, Dépense, Transfert)

     - Description/Libellé

     - Quantité/Unités (Numeric, default 1)

     - Prix Unitaire (Numeric)

     - Montant Total (Numeric = Quantité * Prix Unitaire if not specified)

     - Statut/Mode de Paiement (if mentioned)

     

     Rules:

     - Never invent facts, dates, or numbers not present or clearly implied in the text.

     - Automatically deduce appropriate table columns based on the input context.

     - Return strictly valid JSON in the specified JSON Schema format without conversational filler."

2. Required Output JSON Schema:

   {

     "report_title": "String",

     "currency": "String (e.g., USD, EUR, HTG)",

     "columns": [

       { "key": "string", "label": "string", "type": "date | string | number | currency" }

     ],

     "rows": [

       { "id": "string", "col_key_1": "value", "col_key_2": "value" }

     ],

     "summary": {

       "total_income": "number",

       "total_expense": "number",

       "net_balance": "number"

     }

   }

3. Frontend Processing & State Logic:

   - Create a reactive state machine: [Idle] -> [Processing Prompt...] -> [Parsing JSON] -> [Rendering Table].

   - Calculate column totals dynamically on the client side based on parsed numeric fields.

   - Implement real-time cell editing so users can modify table cells directly after AI generation.

   - Support seamless export functions to downloadable .xlsx (using SheetJS / xlsx package) and PDF (using jspdf-autotable). Build the backend business logic and AI processing pipeline for a real-time text-to-structured-table converter.

Core Requirements & Data Constraints:

- DO NOT hardcode fictional data. All tables must strictly render dynamically from the user's input text or return an empty grid state if no data is present.

AI Integration Architecture:

1. LLM Engine System Prompt:

   - Target API: OpenAI GPT-4o or Anthropic Claude 3.5 Sonnet.

   - System Message instruction:

     "You are a specialized data-structuring financial analyst AI. Your sole task is to ingest unstructured natural language text containing business records (sales, purchases, expenses, inventory, invoices) and transform them into a clean, normalized JSON array representing a structured table.

     Extract and normalize:

     - Date/Time (ISO format standard)

     - Type/Category (e.g., Vente, Achat, Dépense, Transfert)

     - Description/Libellé

     - Quantité/Unités (Numeric, default 1)

     - Prix Unitaire (Numeric)

     - Montant Total (Numeric = Quantité * Prix Unitaire if not specified)

     - Statut/Mode de Paiement (if mentioned)

     

     Rules:

     - Never invent facts, dates, or numbers not present or clearly implied in the text.

     - Automatically deduce appropriate table columns based on the input context.

     - Return strictly valid JSON in the specified JSON Schema format without conversational filler."

2. Required Output JSON Schema:

   {

     "report_title": "String",

     "currency": "String (e.g., USD, EUR, HTG)",

     "columns": [

       { "key": "string", "label": "string", "type": "date | string | number | currency" }

     ],

     "rows": [

       { "id": "string", "col_key_1": "value", "col_key_2": "value" }

     ],

     "summary": {

       "total_income": "number",

       "total_expense": "number",

       "net_balance": "number"

     }

   }

3. Frontend Processing & State Logic:

   - Create a reactive state machine: [Idle] -> [Processing Prompt...] -> [Parsing JSON] -> [Rendering Table].

   - Calculate column totals dynamically on the client side based on parsed numeric fields.

   - Implement real-time cell editing so users can modify table cells directly after AI generation.

   - Support seamless export functions to downloadable .xlsx (using SheetJS / xlsx package) and PDF (using jspdf-autotable). Crée un module TypeScript complet et réutilisable pour un logiciel de gestion de rapports financiers et opérationnels intelligent.

EXIGENCES STRIPTE DE DONNÉES & STRUCTURE :

1. Le parser IA doit obligatoirement extraire et décomposer la date sous cette structure exacte :

   - jour (1-31, format numérique)

   - mois (Nom du mois, ex: "Janvier", "Février")

   - annee (YYYY, ex: 2026)

   - date_complete (YYYY-MM-DD)

   - semaine_numero (1 à 52)

   - trimestre ("Q1" | "Q2" | "Q3" | "Q4")

   - semestre ("S1" | "S2")

2. SUPPORT DU FILTRAGE & REGROUPEMENT TEMPOREL :

   Permettre à l'utilisateur de regrouper et filtrer la table dynamique selon les vues :

   - Semaine (Par numéro de semaine)

   - Mois (Par mois calendaire)

   - Trimestre (Q1, Q2, Q3, Q4)

   - Semestre (S1, S2)

   - Année (Par année)

   - Global / All-in-One (Tout d'un coup sans filtre)

3. LOGIQUE D'EXPORTATION EXCEL (.xlsx) :

   - Utiliser la librairie SheetJS (xlsx).

   - Créer un classeur avec plusieurs onglets si l'utilisateur choisit un regroupement (ex: 1 onglet par trimestre ou par mois).

   - Générer une ligne de 'Total General' dynamique à la fin du tableau avec la formule Excel SUM.

   - Appliquer des en-têtes "Bleu Royal" et des bordures fines "Dorées".

4. LOGIQUE D'EXPORTATION PDF LUXURY & PRO :

   - Utiliser jsPDF + jspdf-autotable.

   - Design : Fond Blanc Pur (#FFFFFF), En-tête et titres Bleu Royal (#0F2C59), Lignes et accents Métallique Doré (#D4AF37).

   - Inclure un bloc en-tête haut de gamme avec le nom de l'entreprise, la date du jour et les métriques clés (KPIs : Total Ventes, Total Dépenses, Solde Nette).

   - Permettre l'impression "Tout d'un coup" (Rapport complet multi-pages avec pagination automatique "Page X sur Y").

5. PAS DE DONNÉES FICTIVES : Tout doit être alimenté dynamiquement par le state React/Vue ou le JSON fourni par l'IA.Code TypeScript Clé en Main

A. Typage & Interfaces (types/report.ts)

TypeScript

export type FilterPeriod = 'semaine' | 'mois' | 'trimestre' | 'semestre' | 'annee' | 'global';

export interface ReportItem {
  id: string;
  date_complete: string; // ISO YYYY-MM-DD
  jour: number;          // 1 - 31
  mois: string;          // "Janvier", "Février", etc.
  annee: number;         // 2026
  semaine_numero: number;// 1 - 52
  trimestre: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  semestre: 'S1' | 'S2';
  type: 'Vente' | 'Achat' | 'Dépense' | 'Autre';
  categorie: string;
  description: string;
  quantite: number;
  prix_unitaire: number;
  montant_total: number;
}

export interface ReportSummary {
  totalVentes: number;
  totalAchats: number;
  totalDepenses: number;
  soldeNette: number;
}


B. Parser de Réponse IA (services/reportParser.ts)

TypeScript

import { ReportItem, ReportSummary } from '../types/report';

/**
 * Enrichit et normalise la réponse JSON brute de l'IA pour calculer
 * automatiquement les trimestres, semestres et numéros de semaine.
 */
export function parseAIResponse(rawJsonItems: any[]): { items: ReportItem[]; summary: ReportSummary } {
  let totalVentes = 0;
  let totalAchats = 0;
  let totalDepenses = 0;

  const items: ReportItem[] = rawJsonItems.map((item, index) => {
    const dateObj = new Date(item.date_complete || Date.now());
    const monthIndex = dateObj.getMonth(); // 0-11
    
    // Noms des mois en français
    const moisNoms = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const jour = dateObj.getDate();
    const mois = moisNoms[monthIndex];
    const annee = dateObj.getFullYear();

    // Calcul du trimestre et semestre
    const trimestre = monthIndex < 3 ? 'Q1' : monthIndex < 6 ? 'Q2' : monthIndex < 9 ? 'Q3' : 'Q4';
    const semestre = monthIndex < 6 ? 'S1' : 'S2';

    // Calcul du numéro de semaine ISO
    const firstJan = new Date(annee, 0, 1);
    const dayNr = Math.ceil((dateObj.getTime() - firstJan.getTime()) / 86400000);
    const semaine_numero = Math.ceil((dayNr + firstJan.getDay()) / 7);

    const quantite = Number(item.quantite) || 1;
    const prix_unitaire = Number(item.prix_unitaire) || 0;
    const montant_total = Number(item.montant_total) || quantite * prix_unitaire;

    // Calculs des Totaux
    const itemType = (item.type || 'Autre').trim();
    if (itemType.toLowerCase().includes('vente')) totalVentes += montant_total;
    else if (itemType.toLowerCase().includes('achat')) totalAchats += montant_total;
    else if (itemType.toLowerCase().includes('dépense') || itemType.toLowerCase().includes('depense')) totalDepenses += montant_total;

    return {
      id: item.id || `row_${index}_${Date.now()}`,
      date_complete: dateObj.toISOString().split('T')[0],
      jour,
      mois,
      annee,
      semaine_numero,
      trimestre,
      semestre,
      type: itemType as any,
      categorie: item.categorie || 'Général',
      description: item.description || '',
      quantite,
      prix_unitaire,
      montant_total
    };
  });

  const soldeNette = totalVentes - (totalAchats + totalDepenses);

  return {
    items,
    summary: { totalVentes, totalAchats, totalDepenses, soldeNette }
  };
}


C. Exportateur Excel .xlsx (services/excelExporter.ts)

TypeScript

import * as XLSX from 'xlsx';
import { ReportItem, FilterPeriod } from '../types/report';

export function exportToExcel(
  items: ReportItem[], 
  periodGroup: FilterPeriod = 'global', 
  filename: string = 'Rapport_Financier_Lumina.xlsx'
) {
  const wb = XLSX.utils.book_new();

  // 1. Groupement dynamique des données
  const groupedData: Record<string, ReportItem[]> = {};

  items.forEach(item => {
    let key = 'Rapport_Global';
    if (periodGroup === 'semaine') key = `Semaine_${item.semaine_numero}_${item.annee}`;
    else if (periodGroup === 'mois') key = `${item.mois}_${item.annee}`;
    else if (periodGroup === 'trimestre') key = `${item.trimestre}_${item.annee}`;
    else if (periodGroup === 'semestre') key = `${item.semestre}_${item.annee}`;
    else if (periodGroup === 'annee') key = `Annee_${item.annee}`;

    if (!groupedData[key]) groupedData[key] = [];
    groupedData[key].push(item);
  });

  // 2. Génération des feuilles par groupe
  Object.keys(groupedData).forEach(groupKey => {
    const groupItems = groupedData[groupKey];
    
    const excelRows = groupItems.map(i => ({
      'Année': i.annee,
      'Mois': i.mois,
      'Jour': i.jour,
      'Date Complète': i.date_complete,
      'Trimestre': i.trimestre,
      'Semestre': i.semestre,
      'Type': i.type,
      'Catégorie': i.categorie,
      'Description': i.description,
      'Qté': i.quantite,
      'Prix Unitaire ($)': i.prix_unitaire,
      'Montant Total ($)': i.montant_total
    }));

    const ws = XLSX.utils.json_to_sheet(excelRows);

    // Dimensionnement automatique des colonnes
    const colWidths = Object.keys(excelRows[0] || {}).map(key => ({
      wch: Math.max(key.length + 3, 12)
    }));
    ws['!cols'] = colWidths;

    // Ajout à la feuille Excel
    const sheetName = groupKey.substring(0, 30); // Limite de 31 chars Excel
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  // 3. Téléchargement du fichier
  XLSX.writeFile(wb, filename);
}


D. Exportateur PDF Luxury All-in-One (services/pdfExporter.ts)

TypeScript

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ReportItem, ReportSummary } from '../types/report';

export function exportToLuxuryPDF(
  items: ReportItem[], 
  summary: ReportSummary, 
  title: string = 'RAPPORT FINANCIER GLOBAL'
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // --- COULEURS PALETTE LUXURY ---
  const COLOR_PRIMARY = [15, 44, 89];   // Bleu Royal (#0F2C59)
  const COLOR_GOLD = [212, 175, 55];    // Or (#D4AF37)
  const COLOR_BG_LIGHT = [248, 250, 252];

  // --- EN-TÊTE BLEU ROYAL & OR ---
  doc.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.rect(0, 0, 210, 20, 'F');

  doc.setTextColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.text('LUMINA PRECISION SUITE', 12, 13);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Édité le : ${new Date().toLocaleDateString('fr-FR')}`, 165, 13);

  // --- TITRE DU DOCUMENT ---
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.setFontSize(16);
  doc.setFont('times', 'bold');
  doc.text(title.toUpperCase(), 12, 32);

  // --- CARTE SUMMARY / KPI FINANCIALS ---
  doc.setFillColor(COLOR_BG_LIGHT[0], COLOR_BG_LIGHT[1], COLOR_BG_LIGHT[2]);
  doc.setDrawColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
  doc.roundedRect(12, 37, 186, 18, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  
  doc.setTextColor(30, 64, 175); // Bleu
  doc.text(`TOTAL VENTES: ${summary.totalVentes.toLocaleString('fr-FR')} $`, 18, 48);

  doc.setTextColor(185, 28, 28); // Rouge
  doc.text(`TOTAL DÉPENSES: ${(summary.totalAchats + summary.totalDepenses).toLocaleString('fr-FR')} $`, 80, 48);

  doc.setTextColor(21, 128, 61); // Vert
  doc.text(`SOLDE NETTE: ${summary.soldeNette.toLocaleString('fr-FR')} $`, 145, 48);

  // --- TABLEAU PRINCIPAL ---
  const tableData = items.map(i => [
    `${i.jour.toString().padStart(2, '0')}/${i.mois.substring(0, 3)}/${i.annee}`,
    i.trimestre,
    i.type,
    i.description,
    i.quantite,
    `${i.prix_unitaire.toLocaleString('fr-FR')} $`,
    `${i.montant_total.toLocaleString('fr-FR')} $`
  ]);

  autoTable(doc, {
    startY: 60,
    head: [['Date (J/M/A)', 'Trim.', 'Type', 'Description', 'Qté', 'P.U.', 'Total']],
    body: tableData,
    headStyles: {
      fillColor: COLOR_PRIMARY as [number, number, number],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left'
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5
    },
    columnStyles: {
      6: { halign: 'right', fontStyle: 'bold' }
    },
    tableLineColor: COLOR_GOLD as [number, number, number],
    tableLineWidth: 0.15,
    didDrawPage: (data) => {
      // Pied de page Luxury avec numéro de page
      const str = `Page ${doc.getNumberOfPages()}`;
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(str, 180, 287);
    }
  });

  doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}.pdf`);
}

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://lumina-report-forge.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5cf35010-18a9-413f-b591-00fdefe58cac).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
