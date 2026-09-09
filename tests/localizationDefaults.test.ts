import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { translations } from '../src/lib/i18n';

const provider = readFileSync('src/lib/i18nContext.tsx', 'utf8');
const layout = readFileSync('src/app/layout.tsx', 'utf8');
const home = readFileSync('src/app/page.tsx', 'utf8');

assert.match(provider, /useState<Language>\('en'\)/, 'English must be the client default');
assert.doesNotMatch(provider, /item\['ar'\]/, 'translations must not fall back across locales');
assert.match(layout, /<html lang="en" dir="ltr">/, 'server document default must be English LTR');
assert.doesNotMatch(home, /fallback={<LoadingScreen message=/, 'loading fallback must use the active translation');

for (const [key, value] of Object.entries(translations)) {
  assert.ok(value.en.trim(), `${key} is missing English copy`);
  assert.ok(value.ar.trim(), `${key} is missing Arabic copy`);
}

console.log('Localization defaults and translation completeness tests passed');
