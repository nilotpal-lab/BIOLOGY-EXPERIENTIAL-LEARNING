import { readFileSync } from 'fs';
import { importFromJson } from '../../core/dataValidation.ts';

const json = readFileSync('src/data/research/MAR-TATOOSH-1.json');
const res = importFromJson({jsonText: json.toString(), fileName: 'MAR-TATOOSH-1.json'});
console.log('blocked:', res.blocked);
console.log('nodes:', res.dataset?.nodes.length);
console.log('edges:', res.dataset?.edges.length);
console.log('issues:', res.issues.length);
res.issues.slice(0, 10).forEach(i => {
  console.log(i.severity + ':', i.code, i.message);
});
