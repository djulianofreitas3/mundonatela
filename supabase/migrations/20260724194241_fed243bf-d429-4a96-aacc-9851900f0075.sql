BEGIN;
DELETE FROM public.historico_ativacoes;
DELETE FROM public.codigos_ativacao;
DELETE FROM public.dispositivo_lista;
DELETE FROM public.dispositivos;
DELETE FROM public.listas_iptv;
DELETE FROM public.clientes;
COMMIT;