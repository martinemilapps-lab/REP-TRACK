export interface Env {
  DB: D1Database;
  REP_TRACK_DATA_API_SECRET?: string;
}

const DEFAULT_SECRET = 'rep-track-dev-internal-secret-2026';

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ success: false, error: message }, status);
}

function verifyAuth(request: Request, env: Env): boolean {
  const authHeader = request.headers.get('Authorization');
  const expectedSecret = env.REP_TRACK_DATA_API_SECRET || DEFAULT_SECRET;
  return Boolean(authHeader && authHeader === `Bearer ${expectedSecret}`);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/+$/, '');

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // 1. Unauthenticated Health Check Endpoint
    if (pathname === '/health' || pathname === '') {
      if (request.method !== 'GET') {
        return errorResponse('Method not allowed', 405);
      }
      const d1Available = Boolean(env.DB && typeof env.DB.prepare === 'function');
      return jsonResponse({
        service: 'running',
        environment: 'dev',
        d1_binding: d1Available ? 'available' : 'unavailable',
      });
    }

    // 2. Strict Authentication on all other API endpoints
    if (!verifyAuth(request, env)) {
      return errorResponse('Unauthorized: Invalid or missing data API secret', 401);
    }

    try {
      // 3. Raw Parameterized Query Gateway: POST /api/query
      if (pathname === '/api/query' && request.method === 'POST') {
        const body = (await request.json()) as { sql?: string; params?: unknown[]; method?: string; raw?: boolean };
        if (!body.sql) {
          return errorResponse('Missing "sql" property in request body', 400);
        }
        const stmt = env.DB.prepare(body.sql);
        const boundStmt = body.params && body.params.length > 0 ? stmt.bind(...body.params) : stmt;

        if (body.method === 'run') {
          const runResult = await boundStmt.run();
          return jsonResponse({
            success: true,
            rows: [],
            meta: runResult.meta,
          });
        }

        if (body.method === 'get') {
          const rawRows = await boundStmt.raw();
          return jsonResponse({
            success: true,
            rows: rawRows && rawRows.length > 0 ? rawRows[0] : undefined,
          });
        }

        if (body.raw || body.method === 'raw' || body.method === 'all' || body.method === 'values') {
          const rawRows = await boundStmt.raw();
          return jsonResponse({
            success: true,
            rows: rawRows || [],
          });
        }

        const result = await boundStmt.all();
        return jsonResponse({
          success: true,
          results: result.results || [],
          rows: result.results || [],
          meta: result.meta,
        });
      }

      // 4. Batch Parameterized Query Gateway: POST /api/batch
      if (pathname === '/api/batch' && request.method === 'POST') {
        const body = (await request.json()) as { statements?: { sql: string; params?: unknown[]; method?: string }[] };
        if (!body.statements || !Array.isArray(body.statements)) {
          return errorResponse('Missing or invalid "statements" array in request body', 400);
        }
        const stmts = body.statements.map((s) => {
          const stmt = env.DB.prepare(s.sql);
          return s.params && s.params.length > 0 ? stmt.bind(...s.params) : stmt;
        });
        const batchResults = await env.DB.batch(stmts);
        return jsonResponse({
          success: true,
          results: batchResults.map((r) => r.results || []),
          batchRows: batchResults.map((r) => {
            const res = r.results || [];
            return {
              rows: res.map((row) => (typeof row === 'object' && row !== null ? Object.values(row) : row)),
            };
          }),
        });
      }

      // 5. Auth Sessions Gateway: /api/sessions
      if (pathname.startsWith('/api/sessions')) {
        const token = pathname.replace('/api/sessions', '').replace(/^\//, '');

        // GET /api/sessions/:token - Fetch active session with user details
        if (request.method === 'GET' && token) {
          const query = `
            SELECT 
              s.id as session_id,
              s.user_id,
              s.expires_at,
              u.username,
              u.name,
              u.position_code,
              u.system_role,
              u.role,
              u.rep_id,
              u.must_change_password
            FROM sessions s
            INNER JOIN users u ON s.user_id = u.id
            WHERE s.id = ? AND s.expires_at > ?
            LIMIT 1;
          `;
          const nowMs = Date.now();
          const row = await env.DB.prepare(query).bind(token, nowMs).first();
          if (!row) {
            return errorResponse('Session not found or expired', 404);
          }
          return jsonResponse({ success: true, session: row });
        }

        // POST /api/sessions - Create session
        if (request.method === 'POST') {
          const body = (await request.json()) as { id: string; userId: string; expiresAt: number };
          if (!body.id || !body.userId || !body.expiresAt) {
            return errorResponse('Missing required session fields', 400);
          }
          await env.DB.prepare(
            'INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?);'
          ).bind(body.id, body.userId, body.expiresAt, Date.now()).run();
          return jsonResponse({ success: true, id: body.id }, 201);
        }

        // DELETE /api/sessions/:token - Revoke session
        if (request.method === 'DELETE' && token) {
          await env.DB.prepare('DELETE FROM sessions WHERE id = ?;').bind(token).run();
          return jsonResponse({ success: true });
        }
      }

      // 6. Users Gateway: /api/users
      if (pathname.startsWith('/api/users')) {
        const userId = pathname.replace('/api/users', '').replace(/^\//, '');

        if (request.method === 'GET') {
          if (userId) {
            const user = await env.DB.prepare(
              'SELECT id, username, username_number, name, position_code, system_role, role, rep_id, is_active, must_change_password, password_hash FROM users WHERE id = ? LIMIT 1;'
            ).bind(userId).first();
            if (!user) return errorResponse('User not found', 404);
            return jsonResponse({ success: true, user });
          }

          const usernameParam = url.searchParams.get('username');
          if (usernameParam) {
            const user = await env.DB.prepare(
              'SELECT id, username, username_number, name, position_code, system_role, role, rep_id, is_active, must_change_password, password_hash FROM users WHERE username = ? LIMIT 1;'
            ).bind(usernameParam).first();
            if (!user) return errorResponse('User not found', 404);
            return jsonResponse({ success: true, user });
          }

          const allUsers = await env.DB.prepare(
            'SELECT id, username, username_number, name, position_code, system_role, role, rep_id, is_active, must_change_password FROM users ORDER BY position_code, username_number;'
          ).all();
          return jsonResponse({ success: true, users: allUsers.results });
        }
      }

      // 7. Representatives Gateway: /api/representatives
      if (pathname.startsWith('/api/representatives')) {
        const repId = pathname.replace('/api/representatives', '').replace(/^\//, '');

        if (request.method === 'GET') {
          if (repId) {
            const rep = await env.DB.prepare(
              'SELECT * FROM representatives WHERE id = ? LIMIT 1;'
            ).bind(repId).first();
            if (!rep) return errorResponse('Representative not found', 404);
            return jsonResponse({ success: true, representative: rep });
          }

          const reps = await env.DB.prepare(
            'SELECT * FROM representatives WHERE is_active = 1 ORDER BY name;'
          ).all();
          return jsonResponse({ success: true, representatives: reps.results });
        }

        if (request.method === 'PATCH' && repId) {
          const body = (await request.json()) as Record<string, unknown>;
          const updates: string[] = [];
          const params: unknown[] = [];

          if ('assignedHospitals' in body) {
            updates.push('assigned_hospitals = ?');
            params.push(body.assignedHospitals);
          }
          if ('assignedPharmacies' in body) {
            updates.push('assigned_pharmacies = ?');
            params.push(body.assignedPharmacies);
          }
          if ('assignedDrs' in body) {
            updates.push('assigned_drs = ?');
            params.push(body.assignedDrs);
          }
          if ('name' in body) {
            updates.push('name = ?');
            params.push(body.name);
          }
          if ('area' in body) {
            updates.push('area = ?');
            params.push(body.area);
          }

          if (updates.length === 0) {
            return errorResponse('No fields provided for update', 400);
          }

          updates.push('updated_at = ?');
          params.push(Date.now());
          params.push(repId);

          await env.DB.prepare(
            `UPDATE representatives SET ${updates.join(', ')} WHERE id = ?;`
          ).bind(...params).run();

          return jsonResponse({ success: true, id: repId });
        }
      }

      // 8. Areas Gateway: /api/areas
      if (pathname === '/api/areas' && request.method === 'GET') {
        const areas = await env.DB.prepare(
          'SELECT * FROM areas WHERE is_active = 1 ORDER BY name;'
        ).all();
        return jsonResponse({ success: true, areas: areas.results });
      }

      // 9. Positions Gateway: /api/positions
      if (pathname === '/api/positions' && request.method === 'GET') {
        const positions = await env.DB.prepare(
          'SELECT * FROM positions ORDER BY hierarchy_level, code;'
        ).all();
        return jsonResponse({ success: true, positions: positions.results });
      }

      // 10. Visit Objectives Gateway: /api/objectives
      if (pathname === '/api/objectives' && request.method === 'GET') {
        const pos = url.searchParams.get('position');
        if (pos) {
          const objs = await env.DB.prepare(
            'SELECT * FROM visit_objectives WHERE position_code = ? AND is_active = 1 ORDER BY display_order;'
          ).bind(pos).all();
          return jsonResponse({ success: true, objectives: objs.results });
        }

        const allObjs = await env.DB.prepare(
          'SELECT * FROM visit_objectives WHERE is_active = 1 ORDER BY position_code, display_order;'
        ).all();
        return jsonResponse({ success: true, objectives: allObjs.results });
      }

      // 11. Manager Scopes Gateway: /api/managers/:id/scope
      if (pathname.startsWith('/api/managers/') && pathname.endsWith('/scope')) {
        const managerId = pathname.replace('/api/managers/', '').replace('/scope', '');
        const repsRes = await env.DB.prepare(`
          SELECT r.* 
          FROM manager_rep_scopes mrs
          INNER JOIN representatives r ON mrs.rep_id = r.id
          WHERE mrs.manager_user_id = ? AND r.is_active = 1
          ORDER BY r.name;
        `).bind(managerId).all();

        const areasRes = await env.DB.prepare(`
          SELECT a.* 
          FROM manager_area_scopes mas
          INNER JOIN areas a ON mas.area_id = a.id
          WHERE mas.manager_user_id = ? AND a.is_active = 1
          ORDER BY a.name;
        `).bind(managerId).all();

        return jsonResponse({
          success: true,
          data: {
            managedReps: repsRes.results,
            managedAreas: areasRes.results,
            managedRepsCount: repsRes.results.length,
            managedAreasCount: areasRes.results.length,
          },
        });
      }

      // 12. Coverage Calculation Gateway: /api/coverage/:repId
      if (pathname.startsWith('/api/coverage/')) {
        const repId = pathname.replace('/api/coverage/', '');
        const rep = await env.DB.prepare(
          'SELECT * FROM representatives WHERE id = ? LIMIT 1;'
        ).bind(repId).first();

        if (!rep) return errorResponse('Representative not found', 404);

        const [hosp, pharm, dr] = await env.DB.batch([
          env.DB.prepare('SELECT COUNT(DISTINCT hospital_id) as count FROM hospital_visits WHERE rep_id = ?;').bind(repId),
          env.DB.prepare('SELECT COUNT(DISTINCT pharmacy_id) as count FROM pharmacy_visits WHERE rep_id = ?;').bind(repId),
          env.DB.prepare('SELECT COUNT(DISTINCT doctor_id) as count FROM doctor_visits WHERE rep_id = ?;').bind(repId),
        ]);

        const actual = {
          hospitals: (hosp.results[0] as { count: number })?.count || 0,
          pharmacies: (pharm.results[0] as { count: number })?.count || 0,
          doctors: (dr.results[0] as { count: number })?.count || 0,
        };

        return jsonResponse({
          success: true,
          representative: rep,
          actual,
        });
      }

      // Fallback: 404 Not Found
      return errorResponse(`Endpoint not found: ${request.method} ${pathname}`, 404);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Internal Server Error';
      console.error('Worker runtime error:', message);
      return errorResponse(message, 500);
    }
  },
};
