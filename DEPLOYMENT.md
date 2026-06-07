# Nype Company App

Este diretorio e o app separado para o dominio `nype.company`.

## Supabase

- Projeto: `Nype Company`
- Ref: `zkayfhqojlysxnqdyjyd`
- URL: `https://zkayfhqojlysxnqdyjyd.supabase.co`
- Banco: vazio, com schema operacional criado em `2026-06-07`

Nao reutilize as variaveis do projeto `Dash`/Assessoria LP neste app.

## Master inicial

- `fabiobrandenburgjr@gmail.com`

Ao criar a conta por este dominio, o usuario nasce como master do workspace Nype.

## Variaveis obrigatorias

Configure estas variaveis no projeto Vercel de `nype.company`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `JWT_SECRET`

As demais integracoes, como Meta Ads, Google Ads e Google Calendar, devem usar redirect URIs com `https://nype.company`.
