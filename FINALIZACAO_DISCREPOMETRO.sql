-- 🚀 SCRIPT DE FINALIZAÇÃO DISCREPÔMETRO --
-- Execute este SQL no Supabase Dashboard → SQL Editor
-- URL: https://supabase.com/dashboard/project/hvjjcegcdivumprqviug/sql/new

-- 1. Deletar e recriar tabela limpa
DROP TABLE IF EXISTS public.analise_discrepancia CASCADE;

CREATE TABLE public.analise_discrepancia (
    id bigint generated by default as identity primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    produto text not null,
    codigo text not null,
    cfop text default '',
    valor_unitario numeric default 0,
    valor_total numeric default 0,
    entradas integer default 0,
    saidas integer default 0,
    est_inicial integer default 0,
    est_final integer default 0,
    est_calculado integer default 0,
    discrepancia_tipo text check (discrepancia_tipo in ('Sem Discrepância', 'Estoque Excedente', 'Estoque Faltante')) default 'Sem Discrepância',
    discrepancia_valor numeric default 0,
    observacoes text default '',
    ano integer default extract(year from now()),
    user_id text default 'anonymous'
);

-- 2. Criar índices para performance
CREATE INDEX idx_analise_discrepancia_ano ON public.analise_discrepancia(ano);
CREATE INDEX idx_analise_discrepancia_codigo ON public.analise_discrepancia(codigo);
CREATE INDEX idx_analise_discrepancia_tipo ON public.analise_discrepancia(discrepancia_tipo);
CREATE INDEX idx_analise_discrepancia_cfop ON public.analise_discrepancia(cfop);
CREATE INDEX idx_analise_discrepancia_user_id ON public.analise_discrepancia(user_id);

-- 3. Enable RLS e políticas
ALTER TABLE public.analise_discrepancia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations" ON public.analise_discrepancia FOR ALL USING (true);

-- 4. Inserir dados de exemplo para teste
INSERT INTO public.analise_discrepancia (
    produto, codigo, cfop, valor_unitario, valor_total, 
    entradas, saidas, est_inicial, est_final, est_calculado,
    discrepancia_tipo, discrepancia_valor, observacoes, ano, user_id
) VALUES 
('NIS LAMEN 85G GALINHA CAIPIRA', '12345', '1102, 5102, 1551, 5405',
 1.50, 517.50, 175, 170, 50, 55, 55,
 'Estoque Excedente', 5, 'Discrepância detectada no estoque', 2024, 'system'),
('BAUD PANETTONE 500G', '67890', '1102, 5102',
 4.00, 380.00, 50, 45, 30, 35, 35,
 'Estoque Excedente', 5, 'Estoque maior que esperado', 2024, 'system'),
('NIS LAMEN 85G CARNE', '11111', '1202, 5910',
 1.50, 330.00, 120, 100, 40, 60, 60,
 'Sem Discrepância', 0, 'Estoque conforme esperado', 2024, 'system');

-- 5. Verificar se funcionou
SELECT 'TABELA CRIADA COM SUCESSO!' as status, count(*) as registros_teste FROM public.analise_discrepancia;

SELECT produto, codigo, discrepancia_tipo, discrepancia_valor, cfop 
FROM public.analise_discrepancia 
ORDER BY created_at DESC 
LIMIT 10; 