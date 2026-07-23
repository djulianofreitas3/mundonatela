-- Script para criar o usuário administrador inicial se ele não existir
-- Nota: Senhas no auth.users são armazenadas com hash. Usamos um ID estável para o seed.

DO $$
DECLARE
  new_user_id UUID := '00000000-0000-0000-0000-000000000001';
  admin_email TEXT := 'admin@mundonatela.com';
  admin_pass_hash TEXT := crypt('admin123456', gen_salt('bf')); -- Senha: admin123456
BEGIN
  -- 1. Inserir no auth.users (apenas se o e-mail não existir)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      admin_email,
      admin_pass_hash,
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Administrador Inicial"}',
      'authenticated',
      'authenticated',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    -- 2. Inserir na tabela de identidades (necessário para o Supabase Auth funcionar corretamente)
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at,
      provider_id
    ) VALUES (
      new_user_id,
      new_user_id,
      format('{"sub":"%s","email":"%s"}', new_user_id, admin_email)::jsonb,
      'email',
      now(),
      now(),
      now(),
      new_user_id::text
    );

    -- 3. Inserir no perfil público
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (new_user_id, 'Administrador Inicial', admin_email, 'admin')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
