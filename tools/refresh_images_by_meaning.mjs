#!/usr/bin/env node

// Replaces images using the English definition as part of the search
// intent. Preferred providers are tried in the configured source order before
// Openverse/Flickr. The selector prefers a landscape image while retaining a
// semantic title/tag match to the word and its definition.

import { execFileSync } from 'node:child_process';
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseImageToolOptions } from './image_tool_options.mjs';
import { configuredSourceSummary, preferredCandidates } from './image_sources.mjs';

const { root, outputDir, imageDir, retry, reportPrefix } = parseImageToolOptions({ allowRetry: true });
const api = 'https://api.openverse.org/v1/images';
const concurrency = 1;
const apiRequestIntervalMs = 1_100;
let nextApiRequestAt = 0;
const stopWords = new Set('a an the to of in on at for from with and or by as is are be being been this that these those it its one someone something which who whose when where while than rather very more most less least only usually normally mainly mostly quite way degree state type kind person animal thing area place time use take make have has had do does did'.split(' '));

function rowsFrom(content) {
  return content.split(/\r?\n/).filter(Boolean).map(line => line.split('\t'));
}

function tokens(text) {
  return (text ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .match(/[a-z0-9]+/g)?.filter(token => token.length > 2 && !stopWords.has(token)) ?? [];
}

function queryFor(entry) {
  const wordTerms = tokens(entry.word);
  const definitionTerms = tokens(entry.definition).filter(term => !wordTerms.includes(term));
  // A compact query avoids excluding good results through over-specific search.
  return [...wordTerms, ...definitionTerms.slice(0, 4)].join(' ');
}

async function fetchJson(url, extraHeaders = {}) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const waitMs = Math.max(0, nextApiRequestAt - Date.now());
    if (waitMs) await new Promise(resolve => setTimeout(resolve, waitMs));
    nextApiRequestAt = Date.now() + apiRequestIntervalMs;
    const response = await fetch(url, { headers: { 'User-Agent': 'anki-vocabulary-image-refresh/1.0', ...extraHeaders } });
    if (response.ok) return response.json();
    if (response.status !== 429 || attempt === 3) throw new Error(`API returned ${response.status}`);
    const retryAfterSeconds = Number(response.headers.get('retry-after'));
    const retryDelayMs = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
      ? retryAfterSeconds * 1_000
      : 15_000 * (attempt + 1);
    await new Promise(resolve => setTimeout(resolve, retryDelayMs));
  }
}

function candidateScore(candidate, entry) {
  const target = new Set([...tokens(entry.word), ...tokens(entry.definition)]);
  const title = tokens(candidate.title);
  const tags = (candidate.tags ?? []).flatMap(tag => tokens(typeof tag === 'string' ? tag : tag.name));
  const wordTerms = new Set(tokens(entry.word));
  const overlap = (values, source, weight) => values.reduce((score, value) => score + (source.has(value) ? weight : 0), 0);
  const exactWord = overlap(title, wordTerms, 14) + overlap(tags, wordTerms, 8);
  const meaning = overlap(title, target, 3) + overlap(tags, target, 2);
  const ratio = candidate.width && candidate.height ? candidate.width / candidate.height : 0;
  // Prefer landscape images, but do not require or target a particular ratio.
  // Portrait images remain eligible when their semantic match is stronger.
  const orientation = ratio >= 1 ? 12 : Math.max(0, 4 - (1 - ratio) * 8);
  const resolution = Math.min(4, Math.log10(Math.max(1, (candidate.width ?? 0) * (candidate.height ?? 0))) - 4);
  return exactWord + meaning + orientation + resolution;
}

async function lookupImage(entry) {
  const runQuery = async query => {
    const params = new URLSearchParams({ q: query, page_size: '20', source: 'flickr', mature: 'false' });
    const data = await fetchJson(`${api}?${params}`);
    return data.results ?? [];
  };
  const semanticQuery = queryFor(entry);
  let preferred = await preferredCandidates(semanticQuery, fetchJson);
  if (!preferred?.length && semanticQuery !== entry.word) preferred = await preferredCandidates(entry.word, fetchJson);
  if (preferred?.length) return preferred.sort((left, right) => candidateScore(right, entry) - candidateScore(left, entry));

  let candidates = await runQuery(semanticQuery);
  if (!candidates.length && semanticQuery !== entry.word) candidates = await runQuery(entry.word);
  const valid = candidates.filter(item => item.url && /^https:\/\/live\.staticflickr\.com\//.test(item.url) && item.width && item.height);
  if (!valid.length) return null;
  valid.sort((left, right) => candidateScore(right, entry) - candidateScore(left, entry));
  return valid.sort((left, right) => candidateScore(right, entry) - candidateScore(left, entry))
    .map(image => ({ url: image.url, width: image.width, height: image.height, title: image.title }));
}

async function downloadAsJpeg(url, destination) {
  const response = await fetch(url, { headers: { 'User-Agent': 'anki-vocabulary-image-refresh/1.0' } });
  if (!response.ok) throw new Error(`image returned ${response.status}`);
  const tempDownload = `${destination}.download`;
  const tempJpeg = `${destination}.new.jpg`;
  await writeFile(tempDownload, Buffer.from(await response.arrayBuffer()));
  try {
    execFileSync('/usr/bin/sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '88', tempDownload, '--out', tempJpeg], { stdio: 'ignore' });
    if ((await stat(tempJpeg)).size < 1024) throw new Error('JPEG is unexpectedly small');
    await rename(tempJpeg, destination);
  } finally {
    await rm(tempDownload, { force: true });
    await rm(tempJpeg, { force: true });
  }
}

async function main() {
  await mkdir(imageDir, { recursive: true });
  const entriesByFile = new Map();
  const names = (await readdir(outputDir)).filter(name => name.startsWith('CHOICE-') && name.endsWith('.txt')).sort();

  for (const name of names) {
    const rows = rowsFrom(await readFile(path.join(outputDir, name), 'utf8'));
    for (const row of rows) {
      if (row.length !== 19) throw new Error(`${name} has a row with ${row.length} columns`);
      if (row[14] && !entriesByFile.has(row[14])) entriesByFile.set(row[14], {
        fileName: row[14], word: row[7], type: row[8], definition: row[12], vietnamese: row[13],
      });
    }
  }
  // Include Fill-only records retained from older lists.
  for (const choiceName of names) {
    const fillName = choiceName.replace(/^CHOICE-/, 'FILL-');
    const rows = rowsFrom(await readFile(path.join(outputDir, fillName), 'utf8'));
    for (const row of rows) {
      if (row.length !== 14) throw new Error(`${fillName} has a row with ${row.length} columns`);
      if (row[9] && !entriesByFile.has(row[9])) entriesByFile.set(row[9], {
        fileName: row[9], word: row[2], type: row[3], definition: row[7], vietnamese: row[8],
      });
    }
  }

  let entries = [...entriesByFile.values()];
  if (retry) {
    const failedPath = path.join(root, `${reportPrefix}-image-refresh-failures.tsv`);
    const failedNames = new Set((await readFile(failedPath, 'utf8')).split(/\r?\n/).filter(Boolean).map(line => line.split('\t')[0]));
    entries = entries.filter(entry => failedNames.has(entry.fileName));
  }
  console.log(`Refreshing ${entries.length} images using definitions, a landscape preference, and source order: ${configuredSourceSummary()}.`);
  const failures = [];
  let next = 0;
  async function worker() {
    while (next < entries.length) {
      const index = next++;
      const entry = entries[index];
      try {
        const sources = await lookupImage(entry);
        if (!sources?.length) throw new Error(`no semantic search result for: ${queryFor(entry)}`);
        let source;
        let lastError;
        for (const candidate of sources.slice(0, 5)) {
          try { await downloadAsJpeg(candidate.url, path.join(imageDir, entry.fileName)); source = candidate; break; }
          catch (error) { lastError = error; }
        }
        if (!source) throw lastError ?? new Error('no downloadable image result');
        const ratio = (source.width / source.height).toFixed(2);
        console.log(`[${index + 1}/${entries.length}] ${entry.word} (${ratio})`);
      } catch (error) {
        failures.push({ ...entry, error: error.message });
        console.error(`[${index + 1}/${entries.length}] failed ${entry.word}: ${error.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  if (failures.length) {
    await writeFile(path.join(root, `${reportPrefix}-image-refresh-failures.tsv`), failures.map(item => [item.fileName, item.word, item.definition, item.vietnamese, item.error].join('\t')).join('\n') + '\n');
  } else {
    await rm(path.join(root, `${reportPrefix}-image-refresh-failures.tsv`), { force: true });
  }
  console.log(`Completed: ${entries.length - failures.length} refreshed, ${failures.length} retained.`);
}

await main();
