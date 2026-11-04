#!/usr/bin/env node
'use strict';

/**
 * Esegue in sequenza tutti gli script "build:*" di package.json (tranne se stesso),
 * passando a ciascuno le opzioni ricevute: `npm run build:all -- --no-pdf`.
 *
 * Perche' non una catena "npm run a && npm run b" in package.json: npm accoderebbe le
 * opzioni solo all'ultimo comando, e per di piu' senza "--", cosi' che le prenderebbe
 * per se'. Leggere gli script da package.json fa si' che una nuova certificazione
 * entri in build:all da sola.
 */

const path = require('path');
const { spawnSync } = require('child_process');

const pkg = require(path.resolve('package.json'));
const names = Object.keys(pkg.scripts || {}).filter(n => n.startsWith('build:') && n !== 'build:all');
const args = process.argv.slice(2);

for (const name of names) {
  console.log(`\n=== ${name} ===`);
  const r = spawnSync('npm', ['run', '--silent', name, '--', ...args], { stdio: 'inherit' });
  if (r.status !== 0) {
    console.error(`\n${name} non riuscito (codice ${r.status}): mi fermo.`);
    process.exit(r.status || 1);
  }
}
console.log(`\nCompletati: ${names.join(', ')}`);
