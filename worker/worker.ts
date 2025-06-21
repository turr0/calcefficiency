/// <reference types="@cloudflare/workers-types" />
// KVNamespace and ExecutionContext are globally available via the triple-slash directive

export interface Env {
  APIKEY: string; // The secret key name used in the fetch handler
  __STATIC_CONTENT: KVNamespace; // Bound by Wrangler if [assets] or [site] is configured
  __STATIC_CONTENT_MANIFEST: string; // Bound by Wrangler for static assets manifest
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const apiKey = env.APIKEY; // Accede a tu secreto (Access your secret)

    // Aquí puedes usar tu apiKey como necesites (Here you can use your apiKey as needed)
    return new Response(
      `¡Hola! Tu API Key está ${apiKey ? 'cargada correctamente' : 'no encontrada'}`,
      { status: 200, headers: { 'Content-Type': 'text/plain' } }
    );
  }
};
