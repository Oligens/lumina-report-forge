CREATE TABLE public.report_sessions (
  id UUID NOT NULL PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  period_group TEXT NOT NULL DEFAULT 'global',
  currency_reference TEXT NOT NULL DEFAULT 'USD',
  executive_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_sessions TO authenticated;
GRANT ALL ON public.report_sessions TO service_role;
ALTER TABLE public.report_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own sessions" ON public.report_sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.report_items (
  id UUID NOT NULL PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.report_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  date_complete DATE NOT NULL,
  jour INTEGER NOT NULL,
  mois TEXT NOT NULL,
  annee INTEGER NOT NULL,
  semaine_numero INTEGER NOT NULL,
  trimestre TEXT NOT NULL,
  semestre TEXT NOT NULL,
  type TEXT NOT NULL,
  categorie TEXT NOT NULL DEFAULT 'Général',
  description TEXT NOT NULL DEFAULT '',
  quantite NUMERIC NOT NULL DEFAULT 1,
  prix_unitaire NUMERIC NOT NULL DEFAULT 0,
  montant_total NUMERIC NOT NULL DEFAULT 0,
  currency_original TEXT NOT NULL DEFAULT 'USD',
  exchange_rate NUMERIC NOT NULL DEFAULT 1,
  montant_converted_usd NUMERIC NOT NULL DEFAULT 0,
  anomaly_badge TEXT NOT NULL DEFAULT 'NORMAL',
  anomaly_explanation TEXT,
  source_type TEXT NOT NULL DEFAULT 'TEXT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_items TO authenticated;
GRANT ALL ON public.report_items TO service_role;
ALTER TABLE public.report_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own items" ON public.report_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX report_items_report_id_idx ON public.report_items(report_id);