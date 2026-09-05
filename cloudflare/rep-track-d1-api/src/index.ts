export interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Minimal Worker: Only implement GET /health
    if (url.pathname === '/health' || url.pathname === '/health/') {
      if (request.method !== 'GET') {
        return new Response(
          JSON.stringify({
            status: 'error',
            message: 'Method not allowed',
          }),
          {
            status: 405,
            headers: {
              'Content-Type': 'application/json',
              'Allow': 'GET',
            },
          }
        );
      }

      const d1Available = Boolean(env.DB && typeof env.DB.prepare === 'function');

      return new Response(
        JSON.stringify({
          service: 'running',
          environment: 'dev',
          d1_binding: d1Available ? 'available' : 'unavailable',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        status: 'error',
        message: 'Not found',
      }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  },
};
