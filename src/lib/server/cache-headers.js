// Cabeçalhos de cache para respostas de leitura pesadas do dashboard.
// `private` garante que só o navegador do próprio usuário cacheia — o CDN
// compartilhado da Vercel NÃO guarda (evita vazar dados entre workspaces) e
// reduz o Fast Origin Transfer em navegações repetidas / re-render.
export const META_READ_CACHE = {
  'Cache-Control': 'private, max-age=120, stale-while-revalidate=600',
}
