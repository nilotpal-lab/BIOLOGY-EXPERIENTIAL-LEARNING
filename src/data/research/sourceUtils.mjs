/**
 * sourceUtils.mjs — shared helpers for the research-data converters.
 *
 * Every converter in this folder follows the same contract:
 *   - it reads verbatim source files that are committed under source-<dataset>/,
 *   - it fails loudly (throw / non-zero exit) when the source shape changes,
 *   - it prints a record of raw vs accepted vs rejected records,
 *   - it writes one deterministic FoodWebDataset module.
 *
 * The generated modules must never be hand-edited: re-run the converter.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import Papa from 'papaparse'

/**
 * Read a committed source file. Archives in this project mix UTF-8 and
 * legacy Latin-1 exports, so fall back to latin1 rather than silently
 * mangling accented species names.
 */
export function readSourceText(filePath) {
  const buffer = readFileSync(filePath)
  const utf8 = buffer.toString('utf8')
  if (utf8.includes('\uFFFD')) return buffer.toString('latin1')
  return utf8.replace(/^\uFEFF/, '')
}

/** Parse a CSV/TSV source file into `{ header, rows }`. */
export function readTable(filePath, options = {}) {
  const text = readSourceText(filePath)
  const parsed = Papa.parse(text.trim(), {
    header: true,
    skipEmptyLines: 'greedy',
    delimiter: options.delimiter ?? '',
    transformHeader: (header) => header.replace(/^\uFEFF/, '').trim(),
  })
  if (parsed.errors.length > 0) {
    const first = parsed.errors[0]
    throw new Error(`${filePath}: CSV parse error on row ${first.row}: ${first.message}`)
  }
  return { header: parsed.meta.fields ?? [], rows: parsed.data }
}

/** Parse a delimiter-less matrix file (the marine `*_spnames.csv` webs). */
export function readMatrix(filePath) {
  const text = readSourceText(filePath)
  const parsed = Papa.parse(text.trim(), { skipEmptyLines: 'greedy' })
  if (parsed.errors.length > 0) {
    const first = parsed.errors[0]
    throw new Error(`${filePath}: matrix parse error on row ${first.row}: ${first.message}`)
  }
  return parsed.data.map((row) => row.map((cell) => String(cell).trim()))
}

export function slug(value, fallback = 'node') {
  const slugged = String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slugged || fallback
}

/** Stable, readable node ids: `<prefix>-<zero-padded index>`. */
export function makeIdFactory(prefix, width = 3) {
  let index = 0
  return () => `${prefix}-${String(index++).padStart(width, '0')}`
}

/**
 * Write a deterministic FoodWebDataset TypeScript module.
 * JSON.stringify with two-space indentation keeps diffs reviewable.
 */
export function writeDatasetModule({ outPath, exportName, title, headerLines, dataset }) {
  const lines = [
    "import type { FoodWebDataset } from '../../core/types'",
    '',
    '/* ============================================================================',
    ` * ${title}`,
    ' *',
    ...headerLines.map((line) => ` * ${line}`.trimEnd()),
    ' *',
    ' * Generated file — do not hand-edit. Change the committed source files or the',
    ' * converter and re-run it (see src/data/research/README.md).',
    ' * ========================================================================== */',
    '',
    `export const ${exportName}: FoodWebDataset = ${JSON.stringify(dataset, null, 2)}`,
    '',
  ]
  writeFileSync(outPath, lines.join('\n'))
}

/** Print a conversion report so every run is auditable from the terminal. */
export function report(title, lines) {
  console.log(`\n${title}`)
  console.log('-'.repeat(title.length))
  for (const line of lines) console.log(`  ${line}`)
}
