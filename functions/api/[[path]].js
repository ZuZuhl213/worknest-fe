export async function onRequest({ request, params, env }) {
  const apiOrigin = (env.API_ORIGIN || 'https://worknest-be.onrender.com').replace(/\/$/, '');
  const path = Array.isArray(params.path) ? params.path.join('/') : params.path || '';
  const incomingUrl = new URL(request.url);
  const targetUrl = new URL(`${apiOrigin}/api/${path}`);
  targetUrl.search = incomingUrl.search;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('origin');
  headers.delete('referer');

  return fetch(targetUrl, new Request(request, { headers }));
}