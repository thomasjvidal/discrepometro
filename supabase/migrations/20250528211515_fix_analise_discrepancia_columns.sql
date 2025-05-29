-- Adicionar colunas que podem estar faltando na tabela analise_discrepancia
ALTER TABLE public.analise_discrepancia ADD COLUMN IF NOT EXISTS ano integer default extract(year from now());
ALTER TABLE public.analise_discrepancia ADD COLUMN IF NOT EXISTS user_id text default 'anonymous';
ALTER TABLE public.analise_discrepancia ADD COLUMN IF NOT EXISTS cfop text default '';
ALTER TABLE public.analise_discrepancia ADD COLUMN IF NOT EXISTS valor_unitario numeric default 0;
ALTER TABLE public.analise_discrepancia ADD COLUMN IF NOT EXISTS valor_total numeric default 0;
ALTER TABLE public.analise_discrepancia ADD COLUMN IF NOT EXISTS discrepancia_valor numeric default 0;
ALTER TABLE public.analise_discrepancia ADD COLUMN IF NOT EXISTS est_calculado integer default 0;
ALTER TABLE public.analise_discrepancia ADD COLUMN IF NOT EXISTS observacoes text default '';

-- Criar índices que podem estar faltando
CREATE INDEX IF NOT EXISTS idx_analise_discrepancia_ano ON public.analise_discrepancia(ano);
CREATE INDEX IF NOT EXISTS idx_analise_discrepancia_codigo ON public.analise_discrepancia(codigo);
CREATE INDEX IF NOT EXISTS idx_analise_discrepancia_tipo ON public.analise_discrepancia(discrepancia_tipo);
CREATE INDEX IF NOT EXISTS idx_analise_discrepancia_cfop ON public.analise_discrepancia(cfop);
CREATE INDEX IF NOT EXISTS idx_analise_discrepancia_user_id ON public.analise_discrepancia(user_id);

-- Garantir que RLS está ativo
ALTER TABLE public.analise_discrepancia ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações (desenvolvimento)
DROP POLICY IF EXISTS "Allow all operations on analise_discrepancia" ON public.analise_discrepancia;
CREATE POLICY "Allow all operations on analise_discrepancia" ON public.analise_discrepancia
    FOR ALL USING (true);
