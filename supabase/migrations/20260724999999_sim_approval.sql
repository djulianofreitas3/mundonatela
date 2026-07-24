DO $$
DECLARE
  v_client_id uuid;
  v_lista_id uuid;
  v_device_id uuid;
  v_req_id uuid := 'b4f3a193-fca9-4849-99c9-c0d4b5eedc63';
  v_token text := 'simulated-bearer-token-12345';
BEGIN
  SELECT id INTO v_client_id FROM public.clientes LIMIT 1;
  SELECT id INTO v_lista_id FROM public.listas_iptv LIMIT 1;
  SELECT id INTO v_device_id FROM public.dispositivos WHERE installation_id = 'test-device-real-flow' LIMIT 1;

  UPDATE public.dispositivos 
  SET status = 'active', 
      cliente_id = v_client_id, 
      device_token = v_token,
      activated_at = now(),
      expires_at = NULL
  WHERE id = v_device_id;

  INSERT INTO public.dispositivo_lista (dispositivo_id, lista_id)
  VALUES (v_device_id, v_lista_id)
  ON CONFLICT (dispositivo_id, lista_id) DO NOTHING;

  UPDATE public.codigos_ativacao
  SET used_at = now()
  WHERE request_id = v_req_id;
END $$;
