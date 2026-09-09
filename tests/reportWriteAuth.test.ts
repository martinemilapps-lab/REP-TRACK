import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { NextRequest } from 'next/server';
import * as availabilityRoute from '../src/app/api/reports/availability/route';
import * as branchRoute from '../src/app/api/reports/branch/route';
import * as doctorRoute from '../src/app/api/reports/doctor/route';
import * as eventsRoute from '../src/app/api/reports/events/route';
import * as hospitalRoute from '../src/app/api/reports/hospital/route';
import * as pharmacyRoute from '../src/app/api/reports/pharmacy/route';
import * as specialTasksRoute from '../src/app/api/reports/special-tasks/route';
import * as trainingsRoute from '../src/app/api/reports/trainings/route';

const requireModule = createRequire(`${process.cwd()}/package.json`);
const headers = requireModule('next/headers') as { cookies: () => Promise<unknown> };
const originalCookies = headers.cookies;
headers.cookies = async () => ({ get: () => undefined });

const routes = {
  availability: availabilityRoute.POST,
  branch: branchRoute.POST,
  doctor: doctorRoute.POST,
  events: eventsRoute.POST,
  hospital: hospitalRoute.POST,
  pharmacy: pharmacyRoute.POST,
  'special-tasks': specialTasksRoute.POST,
  trainings: trainingsRoute.POST,
};

function request(kind: string, body?: string) {
  return new NextRequest(`http://localhost/api/reports/${kind}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body }),
  });
}

async function main() {
  try {
    for (const [kind, post] of Object.entries(routes)) {
      for (const [caseName, body] of [['missing body', undefined], ['invalid fields', '{}']] as const) {
        const response = await post(request(kind, body));
        assert.equal(response.status, 401, `${kind} must return 401 for anonymous POST with ${caseName}`);
        const payload = await response.json() as { success?: boolean };
        assert.equal(payload.success, false, `${kind} must preserve the unauthorized error contract`);
      }
    }
    console.log('Report write routes authenticate before parsing or validating request bodies');
  } finally {
    headers.cookies = originalCookies;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
