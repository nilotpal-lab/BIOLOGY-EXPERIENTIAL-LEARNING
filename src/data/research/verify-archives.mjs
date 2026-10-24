/**
 * verify-archives.mjs
 *
 * Proof that the files the converters read are the files the repositories
 * actually distribute. The committed copies under source-<dataset>/ are hashed
 * and compared with the same entries extracted from the downloaded archives.
 *
 * The archives are not committed (they are large downloads), so this check is
 * run on demand. Extract them first, for example:
 *
 *   mkdir -p /c/tmp/verify/{A,B,C,D}
 *   unzip -oq doi_10_5061_dryad_866t1g1zj__v20240507.zip -d /c/tmp/verify/A
 *   unzip -oq /c/tmp/verify/A/FoodwebMetadata.zip -d /c/tmp/verify/A/meta
 *   unzip -oq doi_10_5061_dryad_1mv20r6__v20200831.zip  -d /c/tmp/verify/B
 *   unzip -oq doi_10_5061_dryad_230j5ch__v20190911.zip  -d /c/tmp/verify/C
 *   unzip -oq doi_10_25349_D9M038__v20221003.zip        -d /c/tmp/verify/D
 *   unzip -oq /c/tmp/verify/D/data.zip -d /c/tmp/verify/D/inner
 *
 * Then:
 *   node src/data/research/verify-archives.mjs --a /c/tmp/verify/A/meta \
 *        --b /c/tmp/verify/B --c /c/tmp/verify/C --d /c/tmp/verify/D/inner
 *
 * --a must point at the extraction of FoodwebMetadata.zip (the inner archive
 * that holds the per-pond folders); --d at the extraction of data.zip.
 *
 * Exits non-zero on any mismatch or missing file.
 */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

function arg(flag) {
  const index = process.argv.indexOf(flag)
  return index === -1 ? null : process.argv[index + 1]
}

const roots = {
  A: arg('--a'),
  B: arg('--b'),
  C: arg('--c'),
  D: arg('--d'),
}
if (Object.values(roots).every((value) => !value)) {
  console.error('Nothing to check: pass at least one extracted archive directory (--a, --b, --c, --d).')
  process.exit(2)
}

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex')

/** Committed copy -> path inside the extracted archive. */
const FILES = [
  {
    committed: join(here, 'source-fw-pond1', 'nodes.csv'),
    archive: ['A', 'FoodwebMetadata/communities/Pond1/nodes.csv'],
  },
  {
    committed: join(here, 'source-fw-pond1', 'properties.csv'),
    archive: ['A', 'FoodwebMetadata/communities/Pond1/properties.csv'],
  },
  {
    committed: join(here, 'source-fw-pond1', 'trophic.links.csv'),
    archive: ['A', 'FoodwebMetadata/communities/Pond1/trophic.links.csv'],
  },
  {
    committed: join(here, 'source-fw-pond47', 'nodes.csv'),
    archive: ['A', 'FoodwebMetadata/communities/Pond47/nodes.csv'],
  },
  {
    committed: join(here, 'source-fw-pond47', 'properties.csv'),
    archive: ['A', 'FoodwebMetadata/communities/Pond47/properties.csv'],
  },
  {
    committed: join(here, 'source-fw-pond47', 'trophic.links.csv'),
    archive: ['A', 'FoodwebMetadata/communities/Pond47/trophic.links.csv'],
  },
  {
    committed: join(here, 'source-ter-c', 'Insect+data.csv'),
    archive: ['C', 'Insect+data.csv'],
  },
  {
    committed: join(here, 'source-ter-c', 'TidyTrait.csv'),
    archive: ['C', 'TidyTrait.csv'],
  },
  {
    committed: join(here, 'source-ter-d', 'pred_prey_sizes_DNAinteractions.csv'),
    archive: ['D', 'data/outputs/2i_final_dataset/pred_prey_sizes_DNAinteractions.csv'],
  },
  {
    committed: join(here, 'source-ter-d', 'Predator_IDs.csv'),
    archive: ['D', 'data/raw_data/2_sample_data/Predator_IDs.csv'],
  },
  {
    committed: join(here, 'source-mar-ythan', 'ythan_spnames.csv'),
    archive: ['B', 'ythan_spnames.csv'],
  },
]

let checked = 0
let skipped = 0
const failures = []

for (const file of FILES) {
  const [archiveKey, relative] = file.archive
  const root = roots[archiveKey]
  if (!root) {
    console.log(`SKIP  ${file.committed.split(/[\\/]/).slice(-2).join('/')} (no --${archiveKey.toLowerCase()} directory)`)
    skipped += 1
    continue
  }
  const archived = resolve(root, relative)
  let committedHash
  let archivedHash
  try {
    committedHash = sha256(readFileSync(file.committed))
  } catch {
    failures.push(`missing committed file: ${file.committed}`)
    continue
  }
  try {
    archivedHash = sha256(readFileSync(archived))
  } catch {
    failures.push(`missing archive entry: ${archived}`)
    continue
  }
  checked += 1
  if (committedHash !== archivedHash) {
    failures.push(
      `hash mismatch for ${relative}\n    committed ${committedHash}\n    archived  ${archivedHash}`,
    )
  } else {
    console.log(`OK    ${relative}  sha256 ${committedHash.slice(0, 16)}…`)
  }
}

console.log(`\n${checked} file(s) verified, ${skipped} skipped, ${failures.length} failure(s).`)
if (failures.length > 0) {
  for (const failure of failures) console.error(`FAIL  ${failure}`)
  process.exit(1)
}
