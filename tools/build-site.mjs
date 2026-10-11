// Build the site for one deploy target, without going through a shell.
//
//   node tools/build-site.mjs production            -> dist/
//   node tools/build-site.mjs production <outDir>   -> <outDir>
//
// `pnpm build` is the Preview. This is the launch shape (the clinic's domain,
// no base path), selected with DEPLOY_TARGET — see astro.config.mjs for why
// that is an environment variable and not `--base /`. The tests import
// `buildSite` to build into a temporary folder and check the output.
//
// Two Astro builds of the same project must not run at once: they share the
// content store in node_modules/.astro and each clears it when it sees a
// different config. That is why `pnpm test` runs its files one at a time
// (`--test-concurrency=1`).
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const astroBin = join(root, 'node_modules', 'astro', 'bin', 'astro.mjs');

/**
 * Run `astro build` for `target` into `outDir` (a fresh temporary folder when
 * omitted) and return that folder. Throws with Astro's output when the build
 * fails, so a test failure shows the real error.
 */
export function buildSite(target, outDir = mkdtempSync(join(tmpdir(), `therapyhouse-${target}-`))) {
  const result = spawnSync(process.execPath, [astroBin, 'build', '--outDir', outDir], {
    cwd: root,
    env: { ...process.env, DEPLOY_TARGET: target },
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(
      `The ${target} build failed (exit ${result.status}).\n${result.stdout}\n${result.stderr}`
    );
  }
  return outDir;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [target = 'production', outDir = join(root, 'dist')] = process.argv.slice(2);
  console.log(`Built ${target} into ${buildSite(target, outDir)}`);
}
