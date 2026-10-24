import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const taxPath = join(__dirname, 'Tatoosh-Taxonomy.csv');
const matPath = join(__dirname, 'TatooshTrophic.txt');
const outPath = join(__dirname, 'MAR-TATOOSH-1.json');

const taxRaw = readFileSync(taxPath, 'utf8');
const taxLines = taxRaw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
const rows = [];
for (let i = 1; i < taxLines.length; i++) {
  const line = taxLines[i];
  if (!line.trim()) continue;
  const parts = line.split(',');
  rows.push({
    input: parts[0] || '',
    species: parts[8] || '',
    genus: parts[9] || '',
  });
}

const matRaw = readFileSync(matPath, 'utf8');
const numMatches = matRaw.match(/[-\d]+/g);
const nums = numMatches ? numMatches.map(x => parseInt(x)) : [];
const n = rows.length;
const matrix = [];
let idx = 0;
for (let i = 0; i < n && idx < nums.length; i++) {
  const row = [];
  for (let j = 0; j < n && idx < nums.length; j++) {
    row.push(nums[idx++]);
  }
  matrix.push(row);
}

const nodes = rows.slice(0, n).map((r, i) => {
  let name = '';
  if (r.species && r.species !== '0') {
    if (r.genus) name = `${r.genus} ${r.species}`;
    else name = r.species;
  } else {
    name = r.input;
  }
  name = name.replace(/\s+/g, ' ').trim();
  const lower = name.toLowerCase();
  let role = 'other';
  if (lower.includes('phytoplankton') || lower.includes('diatom') || lower.includes('algae') || lower.includes('ulva') || lower.includes('laminaria') || lower.includes('fucus') || lower.includes('porphyra') || lower.includes('corallina') || lower.includes('costaria') || lower.includes('alaria') || lower.includes('postelsia') || lower.includes('saccharina') || lower.includes('halosaccion') || lower.includes('mastocarpus') || lower.includes('iridaea') || lower.includes('phyllospadix') || lower.includes('macroalgae')) {
    role = 'producer';
  } else if (lower.includes('detritus') || lower.includes('particulate') || lower.includes('zooplankton')) {
    role = 'decomposer';
  }
  return {
    id: `sp-${i}`,
    label: name,
    scientificName: name,
    trophicRole: role,
    roleEvidence: 'unknown',
    metadata: { original: r.input }
  };
});

const edges = [];
for (let i = 0; i < matrix.length; i++) {
  for (let j = 0; j < matrix[i].length; j++) {
    const v = matrix[i][j];
    if (v > 0) {
      edges.push({ source: `sp-${j}`, target: `sp-${i}` });
    }
  }
}

const ds = {
  id: 'MAR-TATOOSH-1',
  name: 'MAR-TATOOSH-1 · Tatoosh Island intertidal (middle zone)',
  ecosystem: 'marine',
  summary: 'Middle intertidal (mussel-dominated) trophic food web from Tatoosh Island, WA.',
  isDemo: false,
  sourceStatus: 'research-provided-validation-pending',
  userProvided: false,
  provenance: {
    origin: 'Wootton JT, Sander EL, Allesina S (2016) Data from: What can interaction webs tell us about species roles? Dryad https://doi.org/10.5061/dryad.39jv1',
    citation: 'Wootton JT, Sander EL, Allesina S (2016). Data from: What can interaction webs tell us about species roles? PLoS Computational Biology, 12(6), e1004330. Dataset deposited at Dryad: https://doi.org/10.5061/dryad.39jv1',
    sourceUrl: 'https://doi.org/10.5061/dryad.39jv1',
    doi: '10.5061/dryad.39jv1',
    license: 'Dataset published on Dryad (10.5061/dryad.39jv1). Reuse terms per Dryad license; attribution required. Verify current license terms.',
    version: 'v1',
    nodeUnit: 'Species and some functional groups (as reported)',
    cleaningNotes: [
      'Extracted trophic matrix (110×110) from TatooshTrophic.txt; interpreted +1 as column prey of row => column → row (food source → consumer).',
      'Only feeding links retained; non-feeding entries excluded.',
      'Derived node labels from taxonomy; some groups left as reported.',
      'Trophic roles assigned conservatively (producers/decomposers/other) with roleEvidence="unknown".',
      'No species relationships, citations, or validation results were invented.'
    ],
    validationStatus: 'research-provided-validation-pending',
    retrievedOn: '2026-10-17'
  },
  nodes,
  edges
};

writeFileSync(outPath, JSON.stringify(ds, null, 2));
console.log(nodes.length, edges.length);
